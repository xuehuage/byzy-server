//# 激活文件
import { requestThirdParty } from '../utils/request';
import TerminalModel, { Terminal } from '../models/TerminalModel';

/**
 * 终端激活接口
 * @param deviceId 设备ID（必填）
 * @returns 激活后的终端信息
 */
export const activateTerminal = async (deviceId: string): Promise<Terminal> => {
    // 1. 校验环境变量（服务商信息）
    const vendorSn = process.env.VENDOR_SN;
    const vendorKey = process.env.VENDOR_KEY;
    if (!vendorSn || !vendorKey) {
        throw new Error('环境变量未配置VENDOR_SN或VENDOR_KEY');
    }

    // 2. 构造激活接口参数（必填项）
    const activateParams = {
        app_id: process.env.VENDOR_APPID, // 第三方要求的固定app_id
        code: process.env.VENDOR_CODE, // 第三方要求的激活码
        device_id: deviceId,
    };
    console.log('激活参数activateParams：', activateParams)
    // 3. 调用第三方激活接口（使用vendor_sn和vendor_key签名）
    const thirdPartyResponse = await requestThirdParty(
        '/terminal/activate', // 激活接口路径
        activateParams,
        vendorSn,
        vendorKey
    );
    console.log('thirdPartyResponse:', thirdPartyResponse)

    // 4. 处理第三方响应（假设响应格式：{ code: 0, message: 'success', terminal_sn: 'xxx', terminal_key: 'xxx', expires_at: '2024-12-31 23:59:59' }）
    if (thirdPartyResponse.result_code !== '200') {
        throw new Error(`激活失败：${thirdPartyResponse.error_message || '未知错误'}`);
    }

    // 5. 解析响应并存储到数据库
    const terminalData: Omit<Terminal, 'id' | 'created_at' | 'updated_at'> = {
        terminal_sn: thirdPartyResponse.biz_response.terminal_sn,
        terminal_key: thirdPartyResponse.biz_response.terminal_key,
        device_id: deviceId,
        activated_at: new Date(),
    };

    const savedTerminal = await TerminalModel.saveActivatedTerminal(terminalData);
    return savedTerminal;
};