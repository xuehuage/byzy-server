import rateLimit from 'express-rate-limit';

// 开发环境的限流配置
const devRateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1分钟
    max: 100, // 每个IP限制100个请求
    message: {
        error: '请求过于频繁，请稍后再试',
        code: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 生产环境的限流配置
const prodRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 30, // 每个IP限制30个请求
    message: {
        error: '请求过于频繁，请稍后再试',
        code: 429
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// 根据环境选择限流配置
export const publicRateLimiter = process.env.NODE_ENV === 'production' ? prodRateLimiter : devRateLimiter;

export default publicRateLimiter;