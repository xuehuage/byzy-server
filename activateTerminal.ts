import dotenv from 'dotenv';
import { testConnection } from './src/config/database';
import { activateTerminal } from './src/services/terminalService';

// 初始化环境变量
dotenv.config();

// 激活参数（可根据实际设备ID修改）
const DEVICE_ID = 'byzy_pc'; // 设备唯一标识

// 执行激活
const run = async () => {
    try {
        // 测试数据库连接
        console.log('测试数据库连接...');
        const isConnected = await testConnection();
        if (!isConnected) throw new Error('数据库连接失败');

        // 执行激活
        console.log(`开始激活设备：${DEVICE_ID}`);
        const terminal = await activateTerminal(DEVICE_ID);

        // 输出结果
        console.log('激活成功！终端信息：');
        console.log({
            device_id: terminal.device_id,
            terminal_sn: terminal.terminal_sn,
            activated_at: terminal.activated_at,
            expires_at: terminal.expires_at
        });
    } catch (error) {
        console.error('激活失败：', (error as Error).message);
        process.exit(1); // 失败时退出进程
    }
};

// 启动执行
run();