import { JwtPayload } from '../utils/jwt'; // 假设JwtPayload在这个路径

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload
        }
    }
}


export { };