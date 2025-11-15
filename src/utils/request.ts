// # 封装第三方请求（签名、 headers、错误处理）
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { generateSign } from './sign';
import { Response } from 'express';
import { sendError } from './apiResponse';

// 第三方接口基础URL
const BASE_URL = 'https://vsi-api.shouqianba.com';

axios.interceptors.request.use(config => {
    return config;
});

/**
 * 发送第三方请求
 * @param path 接口路径（如'/upay/v2/pay'）
 * @param data 请求体数据（JSON对象）
 * @param sn 签名序列号（vendor_sn或terminal_sn）
 * @param key 签名密钥（vendor_key或terminal_key）
 * @returns 第三方响应数据
 */
export const requestThirdParty = async (
    path: string,
    data: any,
    sn: string,
    key: string
): Promise<any> => {
    try {
        // 1. 转换请求体为JSON字符串（UTF-8）
        const body = JSON.stringify(data);

        // 2. 生成签名
        const sign = generateSign(body, key);

        // 3. 配置请求
        const config: AxiosRequestConfig = {
            url: `${BASE_URL}${path}`,
            method: 'POST',
            headers: {
                'Authorization': sn + " " + sign,
                'Content-Type': 'application/json',

            },
            data: data
        };
        // 4. 发送请求并返回响应
        const response: AxiosResponse = await axios(config);
        return response.data;
    } catch (error) {
        console.error('第三方请求失败:', error);
        throw new Error(`第三方接口调用失败: ${(error as Error).message}`);
    }
};

/**
 * 处理第三方请求的错误响应（在controller中使用）
 * @param error 错误对象
 * @param res Express响应对象
 */
export const handleThirdPartyError = (error: Error, res: Response) => {
    console.error('支付接口错误:', error);
    sendError(res, error.message || '支付接口调用失败', 500);
};