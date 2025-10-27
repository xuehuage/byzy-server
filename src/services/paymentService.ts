// src/services/paymentService.ts（补充预下单方法）
import { requestThirdParty } from '../utils/request';
import TerminalModel from '../models/TerminalModel';
import MergedOrderTempModel from '../models/MergedOrderTempModel';

/**
 * 第三方预下单参数
 */
interface PrecreateParams {
    clientSn: string; // 商户订单号
    totalAmount: number; // 分
    subject: string;
    payway: string; // 2=支付宝，3=微信
}

/**
 * 调用第三方预下单接口
 */
export const createPrepayment = async (params: PrecreateParams) => {
    // 1. 获取终端信息（用于签名）
    const terminal = await TerminalModel.findByDeviceId();
    console.log('获取终端信息:', terminal)
    if (!terminal || !terminal.terminal_sn || !terminal.terminal_key) {
        throw new Error('终端信息不完整');
    }

    // 2. 构造第三方请求参数
    const thirdPartyData = {
        terminal_sn: terminal.terminal_sn,
        client_sn: params.clientSn,
        total_amount: params.totalAmount.toString(), // 分，字符串类型
        payway: params.payway,
        subject: params.subject,
        operator: 'byzy_fyh'
    };
    console.log('构造第三方请求参数:', thirdPartyData)
    // 3. 调用第三方预下单接口
    const result = await requestThirdParty(
        '/upay/v2/precreate', // 预下单接口路径
        thirdPartyData,
        terminal.terminal_sn,
        terminal.terminal_key
    );
    console.log('第三方预下单接口返回值：', result)

    // 4. 校验第三方响应并更新临时订单的二维码
    if (result.result_code !== '200' || result.biz_response.result_code !== 'PRECREATE_SUCCESS') {
        throw new Error(`第三方预下单失败: ${result.biz_response.error_message || '未知错误'}`);
    }
    await MergedOrderTempModel.updateQrCode(
        params.clientSn,
        result.biz_response.data.qr_code
    );

    return result;
};

export const searchPaymentStatus = async (clientSn: string): Promise<void> => {
    const terminal = await TerminalModel.findByDeviceId();
    console.log('serchPaymentStatus获取终端信息:', terminal)
    if (!terminal || !terminal.terminal_sn || !terminal.terminal_key) {
        throw new Error('终端信息不完整');
    }

    // 2. 构造第三方请求参数
    const thirdPartyData = {
        terminal_sn: terminal.terminal_sn,
        client_sn: clientSn,
    };
    console.log('serchPaymentStatus构造第三方请求参数:', thirdPartyData)
    // 3. 调用第三方预下单接口
    const result = await requestThirdParty(
        '/upay/v2/query', // 预下单接口路径
        thirdPartyData,
        terminal.terminal_sn,
        terminal.terminal_key
    );
    console.log('serchPaymentStatus第三方预下单接口返回值：', result)
    return result;
}