// 终端信息类型定义
export interface Terminal {
    id: number;
    terminal_sn: string; // 终端序列号（激活或签到返回）
    terminal_key: string; // 终端密钥（激活或签到返回）
    activated_at: Date; // 激活时间
    expires_at: Date | null; // 过期时间（若有）
    device_id: string; // 设备ID（激活时传入）
}