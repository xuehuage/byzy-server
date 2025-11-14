// 学生校服购买记录类型定义
import { PaymentStatus, Timestamps } from './database.types';
import { UniformType } from './school.types';

// 学生校服购买记录（与数据库表字段匹配）
export interface StudentUniform extends Timestamps {
    id: number;
    student_id: number; // 关联学生ID
    school_uniform_id: number; // 关联校服配置ID（school_uniforms.id）
    quantity: number; // 购买数量
    size: string; // 购买尺码
    uniform_type: UniformType; // 校服类型
    total_amount: number;
    payment_status: PaymentStatus; // 付款状态（paid/unpaid/pending）
}

// 校服购买统计结果接口
export interface UniformStatistic {
    uniform_type: UniformType; // 校服类型
    total_quantity: number; // 总数量
    paid_quantity: number; // 已付款数量
    unpaid_quantity: number; // 未付款数量
}