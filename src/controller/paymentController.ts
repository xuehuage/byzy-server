import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendError, sendSuccess } from '../utils/apiResponse';
import { getStudentByidCard } from '../services/studentService';
import { createPrepayment, searchPaymentStatus as servicePamentStatus } from '../services/paymentService';
import { createTempMergedOrder, migrateToFormalOrder } from '../services/mergedOrderService';
import { formatUniformType } from '../utils/formatter';
import crypto from 'crypto';
import { notifyPaymentSuccess } from '../services/websocketService';

const SHOUQIANBA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5+MNqcjgw4bsSWhJfw2M
+gQB7P+pEiYOfvRmA6kt7Wisp0J3JbOtsLXGnErn5ZY2D8KkSAHtMYbeddphFZQJ
zUbiaDi75GUAG9XS3MfoKAhvNkK15VcCd8hFgNYCZdwEjZrvx6Zu1B7c29S64LQP
HceS0nyXF8DwMIVRcIWKy02cexgX0UmUPE0A2sJFoV19ogAHaBIhx5FkTy+eeBJE
bU03Do97q5G9IN1O3TssvbYBAzugz+yUPww2LadaKexhJGg+5+ufoDd0+V3oFL0/
ebkJvD0uiBzdE3/ci/tANpInHAUDIHoWZCKxhn60f3/3KiR8xuj2vASgEqphxT5O
fwIDAQAB
-----END PUBLIC KEY-----`

// 预下单参数验证规则
export const prepayValidation = [
    body('id_card').notEmpty().withMessage('身份证号不能为空'),
    body('pay_way').isIn([2, 3]).withMessage('支付方式必须为2（支付宝）或3（微信）')
];

/**
 * 学生合并订单预下单接口
 * 接收身份证和支付方式，生成第三方支付二维码
 */
export const prepay = async (req: Request, res: Response) => {
    // 1. 参数验证
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, '参数错误: ' + errors.array().map(e => e.msg).join(',') + '请联系管理员', 400);
    }

    const { id_card: idCard, pay_way: payWay } = req.body;

    try {
        // 2. 查询学生及未付款订单
        const studentResult = await getStudentByidCard(idCard);
        if (!studentResult) {
            return sendError(res, '未找到学生信息', 404);
        }
        const { student, orders } = studentResult;

        // 3. 筛选未付款订单（payment_status=0）
        const unpaidOrders = orders.filter(order => order.payment_status === 0);
        if (unpaidOrders.length === 0) {
            return sendError(res, '无未付款订单', 400);
        }

        // 4. 计算总金额（元转分，第三方接口要求）
        const totalAmount = unpaidOrders.reduce(
            (sum, order) => sum + Number(order.total_amount), // 转换为分
            0
        );

        if (totalAmount <= 0) {
            return sendError(res, '订单金额无效', 400);
        }

        // 5. 生成订单标题（合并校服信息）
        const subjectParts = unpaidOrders.map(order =>
            `${formatUniformType(order.uniform_type)}${order.quantity}套，尺码${order.size}`
        );

        const subject = subjectParts.join('；');

        // 6. 生成唯一商户订单号
        const clientSn = await createTempMergedOrder({
            studentId: student.id,
            totalAmount, // 单位：分
            payway: payWay,
            subject,
            unpaidOrders
        });
        console.error('唯一商户订单号:', clientSn);
        // 7. 调用第三方预下单接口
        // 可根据业务场景从请求或配置获取
        const thirdPartyResult = await createPrepayment({
            clientSn,
            totalAmount, // 单位：分
            subject,
            payway: payWay.toString(),
        });
        console.error('调用第三方预下单接口:', thirdPartyResult);

        // 8. 构建响应参数
        const responseData = {
            total_amount: totalAmount / 100, // 转回元
            subject,
            sn: thirdPartyResult.biz_response.data.sn,
            client_sn: thirdPartyResult.biz_response.data.client_sn,
            qr_code: thirdPartyResult.biz_response.data.qr_code,
            qr_code_image_url: thirdPartyResult.biz_response.data.qr_code_image_url
        };
        console.error('构建响应参数:', responseData);

        sendSuccess(res, responseData, '预下单成功');
    } catch (error) {
        console.error('预下单失败:', error);
        sendError(res, (error as Error).message || '预下单失败', 500);
    }
};

export const searchPaymentStatus = async (req: Request, res: Response) => {
    const { client_sn } = req.params;
    try {

        const responseData = await servicePamentStatus(client_sn)

        // 解析第三方返回的order_status
        const orderStatus = responseData.biz_response?.data?.order_status;

        // 处理支付成功（PAID）
        if (orderStatus === 'PAID') {
            // 调用迁移方法：删除临时订单、生成正式订单、更新原始订单
            await migrateToFormalOrder(
                client_sn,
                new Date(), // 支付时间（可从第三方返回的pay_time提取，此处示例用当前时间）
                responseData.biz_response.data?.transaction_id // 第三方流水号
            );
        }

        sendSuccess(res, responseData, '预下单成功');
    } catch (error) {
        console.error('预下单失败:', error);
        sendError(res, (error as Error).message || '预下单失败', 500);
    }
}

// 修复公钥格式的函数
function fixPublicKeyFormat(publicKey: string): string {

    // 如果已经是正确的PEM格式，直接返回
    if (publicKey.includes('-----BEGIN PUBLIC KEY-----') &&
        publicKey.includes('-----END PUBLIC KEY-----')) {
        return publicKey;
    }

    // 修复格式问题
    let fixedKey = publicKey;

    // 修复 BEGIN/END 标记
    fixedKey = fixedKey.replace('---BEGIN PUBLIC KEY---', '-----BEGIN PUBLIC KEY-----');
    fixedKey = fixedKey.replace('---END PUBLIC KEY---', '-----END PUBLIC KEY-----');

    // 确保有正确的换行
    if (!fixedKey.includes('\n')) {
        const base64Content = fixedKey
            .replace('-----BEGIN PUBLIC KEY-----', '')
            .replace('-----END PUBLIC KEY-----', '')
            .trim();

        // 重新构建PEM格式，每64字符换行
        const formattedContent = base64Content.match(/.{1,64}/g)?.join('\n') || base64Content;
        fixedKey = `-----BEGIN PUBLIC KEY-----\n${formattedContent}\n-----END PUBLIC KEY-----`;
    }

    return fixedKey;
}

export const paymentCallback = async (req: Request, res: Response) => {
    try {

        // 1. 获取回调请求头中的签名
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return sendError(res, 'Missing Authorization header', 400);
        }

        // 2. 直接使用整个 Authorization 头作为 Base64 编码的签名
        const sign = authHeader.trim();

        // 3. 获取原始请求体
        const rawBody = (req as any).rawBody;
        if (!rawBody) {
            return sendError(res, 'Missing raw body', 400);
        }

        const rawBodyString = rawBody.toString('utf8');

        // 4. 使用 SHOUQIANBA_PUBLIC_KEY 进行 RSA SHA256 验签
        let shouqianbaPublicKey = SHOUQIANBA_PUBLIC_KEY;

        if (!shouqianbaPublicKey) {
            return sendError(res, 'System configuration error', 500);
        }

        // 修复公钥格式
        shouqianbaPublicKey = fixPublicKeyFormat(shouqianbaPublicKey);



        // RSA SHA256 验签
        let isValid = false;
        let verifyError = null;

        try {
            const verify = crypto.createVerify('RSA-SHA256');
            verify.update(rawBodyString, 'utf8');
            verify.end();

            const bytesSign = Buffer.from(sign, 'base64');

            // 使用修复后的PEM格式公钥进行验签
            isValid = verify.verify(shouqianbaPublicKey, bytesSign);

        } catch (rsaError: any) {
            verifyError = rsaError;

        }




        // 5. 处理业务逻辑 - 根据实际数据结构调整
        const callbackData = req.body;

        // 根据实际回调数据结构解析 - 直接使用根级字段
        const {
            client_sn,
            order_status,
            finish_time,  // 实际字段名是 finish_time
            trade_no,     // 实际字段名是 trade_no
            total_amount,
            subject
        } = callbackData;



        if (!client_sn) {
            return sendError(res, 'Missing client_sn in callback', 400);
        }

        // 处理支付成功逻辑
        if (order_status === 'PAID') {
            try {

                // 调用迁移方法 - 使用正确的字段名
                await migrateToFormalOrder(
                    client_sn,
                    finish_time ? new Date(parseInt(finish_time)) : new Date(),
                    trade_no  // 使用 trade_no 作为交易号
                );

                // 通过WebSocket通知前端支付成功
                const notificationData = {
                    client_sn,
                    order_status,
                    pay_time: finish_time ? new Date(parseInt(finish_time)) : new Date(),
                    transaction_id: trade_no,
                    total_amount,
                    subject,
                    message: '支付成功'
                };

                const notified = notifyPaymentSuccess(client_sn, notificationData);
                if (!notified) {
                    console.warn(`⚠️ 客户端 ${client_sn} 未建立WebSocket连接`);
                } else {
                    console.log(`🔔 已发送WebSocket通知: ${client_sn}`);
                }

            } catch (migrationError) {
                console.error('❌ 订单迁移失败:', migrationError);
                // 即使迁移失败，也要返回成功给收钱吧，避免重复回调
            }
        } else {
            console.log(`ℹ️ 订单状态非PAID: ${order_status}, client_sn: ${client_sn}`);
        }

        // 返回成功响应给收钱吧
        sendSuccess(res, { result: 'SUCCESS' }, 'Callback processed successfully');

    } catch (error) {
        console.error('💥 回调处理异常:', error);
        sendError(res, 'Callback processing failed', 500);
    }
};

