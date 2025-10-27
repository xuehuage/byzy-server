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


export const formatUniformType = (val: number): string => {
    let text = '校服';
    switch (val) {
        case 1:
            text = '夏装'
            break;
        case 2:
            text = '春秋装'
            break;
        case 3:
            text = '冬装'
            break;
        case 4:
            text = '夏装上衣'
            break;
        case 5:
            text = '秋装上衣'
            break;
        default:
            break;

    }
    return text;
}