// src/models/TerminalModel.ts
import { executeQuery, executeWrite, QueryResult, WriteResult } from '../config/database'; // 修正导入

// 终端信息类型定义
export interface Terminal {
    id: number;
    terminal_sn: string; // 终端序列号（激活或签到返回）
    terminal_key: string; // 终端密钥（激活或签到返回）
    device_id: string; // 设备唯一标识（激活时传入）
    activated_at: Date; // 激活时间
    expires_at: Date | null; // 密钥过期时间（签到返回）
    created_at: Date; // 记录创建时间
    updated_at: Date; // 记录更新时间
}

// 存储激活后的终端信息
export const saveActivatedTerminal = async (terminalData: Omit<Terminal, 'id' | 'created_at' | 'updated_at'>): Promise<Terminal> => {
    const sql = `
    INSERT INTO terminals (
      terminal_sn, terminal_key, device_id, activated_at, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE  -- 若设备ID已存在则更新
      terminal_sn = VALUES(terminal_sn),
      terminal_key = VALUES(terminal_key),
      activated_at = VALUES(activated_at),
      expires_at = VALUES(expires_at),
      updated_at = NOW()
  `;
    const params = [
        terminalData.terminal_sn,
        terminalData.terminal_key,
        terminalData.device_id,
        terminalData.activated_at,
        terminalData.expires_at
    ];
    const result: WriteResult = await executeWrite(sql, params); // 使用executeWrite执行写操作
    return {
        id: result.insertId as number,
        ...terminalData,
        created_at: new Date(),
        updated_at: new Date()
    };
};

// 查询终端信息（供后续签到更新使用）
export const findByDeviceId = async (deviceId: string): Promise<Terminal | null> => {
    const sql = `
    SELECT * FROM terminals
    WHERE device_id = ?
    LIMIT 1
  `;
    const rows: QueryResult<Terminal> = await executeQuery(sql, [deviceId]); // 使用executeQuery执行查询
    return rows.length > 0 ? rows[0] : null;
};

export default { saveActivatedTerminal, findByDeviceId };