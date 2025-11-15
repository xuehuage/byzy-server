import dotenv from 'dotenv';
import { testConnection } from './src/config/database';
import { activateTerminal } from './src/services/terminalService';

// 初始化环境变量
dotenv.config();

// 激活参数（可根据实际设备ID修改）

// 执行激活
const run = async () => {
    try {

        const terminal = await activateTerminal(process.env.DEVICE_ID || 'byzy_pc_01');

        // 输出结果
        console.log('激活成功！终端信息：');
        console.log({
            device_id: terminal.device_id,
            terminal_sn: terminal.terminal_sn,
            activated_at: terminal.activated_at,
        });
    } catch (error) {
        console.error('激活失败：', (error as Error).message);
        process.exit(1); // 失败时退出进程
    }
};

// 启动执行
run();