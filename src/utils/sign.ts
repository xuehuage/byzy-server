// # 签名生成工具（MD5算法实现）
import crypto from 'crypto';

/**
 * 生成签名
 * @param body 请求体JSON字符串（UTF-8编码）
 * @param key 签名密钥（vendor_key或terminal_key）
 * @returns 签名结果（32位大写MD5）
 */
export const generateSign = (body: string, key: string): string => {
    const signStr = body + key;
    console.log('signStr:', signStr)
    const result = crypto.createHash('md5').update(signStr, 'utf8').digest('hex')
    console.log('sign大写：', result.toUpperCase())
    console.log('sign：', result)
    return crypto.createHash('md5').update(signStr, 'utf8').digest('hex').toUpperCase();
};