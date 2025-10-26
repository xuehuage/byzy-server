import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { handleThirdPartyError } from '../utils/request';
import { sendError, sendSuccess } from '../utils/apiResponse';
import { createPayment } from '../services/paymentService';

// 支付请求参数验证规则
export const paymentValidation = [
    body('orderNo').notEmpty().withMessage('订单号不能为空'),
    body('amount').isNumeric().withMessage('金额必须为数字'),
    body('subject').notEmpty().withMessage('订单标题不能为空')
];

/**
 * 处理支付请求
 */
export const pay = async (req: Request, res: Response) => {
    // 1. 验证请求参数
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, '参数验证失败: ' + errors.array().map(e => e.msg).join(','), 400);
    }

    try {
        // 2. 调用Service层发起支付
        const result = await createPayment(req.body);
        // 3. 返回成功响应
        sendSuccess(res, result, '支付请求成功');
    } catch (error) {
        // 4. 处理错误
        handleThirdPartyError(error as Error, res);
    }
};