import winston from 'winston';
import path from 'path';
import fs from 'fs';
import DailyRotateFile from 'winston-daily-rotate-file';

// 1. 确保日志目录存在（不存在则创建）
const logDir = path.join(__dirname, '../../logs'); // 日志文件存放在项目根目录的logs文件夹
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true }); // 递归创建目录（支持嵌套）
}

// 2. 定义日志格式
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // 时间戳
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // 日志格式：[时间戳] [日志级别] 日志内容 附加信息（可选）
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
  })
);

// 3. 配置日志器
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info', // 日志级别：debug < info < warn < error（默认info，可通过环境变量调整）
  format: logFormat,
  defaultMeta: { service: 'school-management-api' }, // 默认附加服务名称（便于多服务日志区分）
  transports: [
    // 3.1 控制台输出（开发环境用，颜色区分级别）
    new winston.transports.Console({
      format: winston.format.combine(
        logFormat,
        winston.format.colorize({ all: true }) // 控制台日志颜色化
      )
    }),

    // 3.2 所有日志写入文件（按天分割）
    new DailyRotateFile({
      filename: path.join(logDir, 'app-%DATE%.log'), // 日志文件名：app-2024-10-01.log
      datePattern: 'YYYY-MM-DD', // 按天分割
      maxSize: '20m', // 单个日志文件最大20MB
      maxFiles: '30d', // 日志文件保留30天
      level: 'info' // 记录info及以上级别日志
    }),

    // 3.3 错误日志单独写入文件（便于排查问题）
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'), // 错误日志文件名：error-2024-10-01.log
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '90d', // 错误日志保留90天（更久便于追溯）
      level: 'error' // 只记录error级别日志
    })
  ]
});

// 4. 开发环境额外输出debug日志（可选）
if (process.env.NODE_ENV === 'development') {
  logger.level = 'debug'; // 开发环境显示debug日志
}

export default logger;