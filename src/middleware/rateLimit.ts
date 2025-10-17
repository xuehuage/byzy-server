
import rateLimit from 'express-rate-limit';

// 公开接口的速率限制 - 更严格
export const publicRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 30, // 每个IP限制30个请求
    standardHeaders: true,
    legacyHeaders: false,
});

export default publicRateLimiter;