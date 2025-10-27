import { Timestamps } from './database.types';

/**
 * 合并订单基础信息（临时表与正式表共用字段）
 */
interface MergedOrderBase {
    id: number;
    client_sn: string; // 商户唯一订单号（≤32字节）
    student_id: number; // 关联学生ID（students.id）
    total_amount: number; // 总金额（元）
    payway: number; // 支付方式（2=支付宝，3=微信）
    subject: string; // 订单标题（合并的校服信息）
    qr_code?: string; // 第三方支付二维码
    operator: string; // 操作员（固定为byzy_fyh）
}

/**
 * 临时合并订单（预下单未支付）
 */
export interface MergedOrderTemp extends MergedOrderBase, Timestamps {
    status: 'CREATED'; // 临时订单仅预创建状态
    expire_at: Date; // 过期时间
}

/**
 * 正式合并订单（已支付）
 */
export interface MergedOrder extends MergedOrderBase, Timestamps {
    status: 'PAID' | 'REFUNDED'; // 正式订单状态
    paid_at: Date; // 支付时间
    transaction_id?: string; // 第三方支付流水号
}

/**
 * 合并订单子项（关联原始校服订单）
 */
export interface MergedOrderItem {
    id: number;
    merged_order_id: number; // 关联合并订单ID（临时/正式）
    student_uniform_order_id: number; // 关联原始校服订单ID（student_uniform_orders.id）
    created_at: Date; // 创建时间
}