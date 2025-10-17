import qrcode from 'qrcode';
import fs from 'fs';
import path from 'path';

// 解决ES模块__dirname问题（本地环境适配）

// 本地二维码存储目录（放在public下，便于前端直接访问）
const QRCODE_DIR = path.join(__dirname, '../public/qrcodes');

// 确保目录存在
const ensureDirExists = () => {
    if (!fs.existsSync(QRCODE_DIR)) {
        fs.mkdirSync(QRCODE_DIR, { recursive: true });
        console.log(`✅ 二维码目录已创建: ${QRCODE_DIR}`);
    }
};

/**
 * 生成学校二维码（本地环境专用）
 * @param schoolId 学校ID
 * @returns 二维码图片相对路径（用于数据库存储）
 */
export const generateSchoolQrcode = async (schoolId: number): Promise<string> => {
    try {
        ensureDirExists();

        // 本地测试URL（适配前端本地服务）
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
        const qrcodeUrl = `${frontendUrl}/schools/${schoolId}`;
        console.log(`📌 生成二维码的URL: ${qrcodeUrl}`);

        // 文件名使用schoolId，便于关联
        const filename = `${schoolId}.png`;
        const filePath = path.join(QRCODE_DIR, filename);

        // 生成二维码（本地调试配置：高容错率，便于识别）
        await qrcode.toFile(filePath, qrcodeUrl, {
            errorCorrectionLevel: 'H', // 高容错率（30%损坏仍可识别）
            width: 300, // 固定尺寸，便于打印测试
            margin: 2 // 边框留白
        });

        console.log(`✅ 二维码已生成: ${filePath}`);
        // 返回相对路径（前端可通过 /qrcodes/1.png 访问）
        return `/qrcodes/${filename}`;
    } catch (error) {
        console.error('❌ 二维码生成失败:', error);
        throw new Error(`生成二维码失败: ${(error as Error).message}`);
    }
};

/**
 * 本地测试用：删除指定学校的二维码
 * @param schoolId 学校ID
 */
export const deleteSchoolQrcode = (schoolId: number): void => {
    const filename = `${schoolId}.png`;
    const filePath = path.join(QRCODE_DIR, filename);

    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ 已删除二维码: ${filePath}`);
    }
};