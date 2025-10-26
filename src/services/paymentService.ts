import { requestThirdParty } from '../utils/request';
import TerminalModel from '../models/TerminalModel'; // 修复路径错误（model→models，文件名大小写统一）
import { Terminal } from '../models/TerminalModel'; // 从TerminalModel导入Terminal接口（与定义处保持一致）

// 定义支付参数类型
interface CreatePaymentParams {
    orderNo: string;
    amount: number;
    subject: string;
    deviceId: string; // 新增设备ID参数（用于查询终端信息）
}

/**
 * 发起支付
 * @param params 支付参数（如订单号、金额等）
 * @returns 第三方支付响应
 */
export const createPayment = async (params: any) => {
    // 1. 根据设备ID获取终端信息（修复：使用TerminalModel中实际存在的findByDeviceId方法）
    const terminal: Terminal | null = await TerminalModel.findByDeviceId(params.deviceId);
    if (!terminal || !terminal.terminal_sn || !terminal.terminal_key) {
        throw new Error('终端未激活或信息不完整，请先执行激活接口');
    }

    // 2. 构造第三方支付接口参数（金额单位为“分”）
    const paymentData = {
        out_trade_no: params.orderNo, // 商户订单号
        total_fee: params.amount * 100, // 转换为分
        subject: params.subject, // 订单标题
        // 其他参数...
    };

    // 3. 调用第三方支付接口（使用终端密钥签名）
    return requestThirdParty(
        '/upay/v2/pay', // 支付接口路径
        paymentData,
        terminal.terminal_sn,
        terminal.terminal_key
    );
};