// src/controller/paymentCallbackController.ts
import { Request, Response } from 'express';
import { migrateToFormalOrder } from '../services/mergedOrderService';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * 第三方支付回调接口
 * 验证签名后处理支付成功逻辑
 */
export const paymentCallback = async (req: Request, res: Response) => {
    // try {
    //     // 1. 验证第三方签名（确保请求合法性）
    //     const signatureValid = verifyThirdPartySign(req.body, req.headers.sign as string);
    //     if (!signatureValid) {
    //         return res.status(400).send('invalid sign'); // 第三方要求直接返回字符串
    //     }

    //     // 2. 解析回调参数
    //     const { client_sn: clientSn, transaction_id: transactionId, pay_time: payTime } = req.body;
    //     if (!clientSn || !payTime) {
    //         return res.status(400).send('missing params');
    //     }

    //     // 3. 迁移订单并更新状态
    //     await migrateToFormalOrder(
    //         clientSn,
    //         new Date(payTime),
    //         transactionId
    //     );

    //     // 4. 返回成功响应（第三方要求固定格式）
    //     res.send({ result_code: 'SUCCESS' });
    // } catch (error) {
    //     console.error('支付回调处理失败:', error);
    //     res.status(500).send('processing failed');
    // }
};

function verifyThirdPartySign(body: any, arg1: string) {
    throw new Error('Function not implemented.');
}
