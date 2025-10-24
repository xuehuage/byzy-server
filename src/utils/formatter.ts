/**
 * 将对象中的BigInt类型转换为Number
 * @param data 需要转换的数据（对象或数组）
 * @returns 转换后的数据
 */
export const formatBigInt = (data: any): any => {
    if (typeof data === 'bigint') {
        return Number(data);
    }
    if (data instanceof Array) {
        return data.map(item => formatBigInt(item));
    }
    if (data instanceof Object) {
        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                data[key] = formatBigInt(data[key]);
            }
        }
    }
    return data;
};