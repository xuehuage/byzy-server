import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { sendError, sendSuccess } from '../utils/apiResponse';
import { getStudentByidCard } from '../services/studentService';
import { createPrepayment, searchPaymentStatus as servicePamentStatus } from '../services/paymentService';
import { createTempMergedOrder, migrateToFormalOrder } from '../services/mergedOrderService';
import { formatUniformType } from '../utils/formatter';

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
        console.log('unpaidOrders:', unpaidOrders)
        if (unpaidOrders.length === 0) {
            return sendError(res, '无未付款订单', 400);
        }

        // 4. 计算总金额（元转分，第三方接口要求）
        const totalAmount = unpaidOrders.reduce(
            (sum, order) => sum + Number(order.total_amount), // 转换为分
            0
        );
        console.log('totalAmount:', totalAmount)

        if (totalAmount <= 0) {
            return sendError(res, '订单金额无效', 400);
        }

        // 5. 生成订单标题（合并校服信息）
        const subjectParts = unpaidOrders.map(order =>
            `${formatUniformType(order.uniform_type)}${order.quantity}套，尺码${order.size}`
        );
        console.log('subjectParts:', subjectParts)

        const subject = subjectParts.join('；');

        // 6. 生成唯一商户订单号
        const clientSn = await createTempMergedOrder({
            studentId: student.id,
            totalAmount: totalAmount, // 分
            payway: payWay,
            subject,
            unpaidOrders
        });
        console.error('唯一商户订单号:', clientSn);
        // 7. 调用第三方预下单接口
        // 可根据业务场景从请求或配置获取
        const thirdPartyResult = await createPrepayment({
            clientSn,
            totalAmount, // 分
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
            qr_code: thirdPartyResult.biz_response.data.qr_code
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