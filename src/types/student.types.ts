// 学生相关类型定义
import { PaymentStatus, Timestamps } from './database.types';
import { Class } from './gradeClass.types';

// 性别枚举
export enum Gender {
    MALE = 1,
    FEMALE = 2
}

// 学生基础接口（与数据库表字段匹配）
export interface Student extends Timestamps {
    id: number;
    name: string;
    id_card: string; // 身份证号
    student_id: string; // 学号
    class_id: number; // 关联班级ID
    gender: Gender; // 性别（1=男，2=女）
    uniform_size: string; // 默认校服尺码
    payment_status: PaymentStatus; // 整体付款状态（预留）
}

/**
 * 学生级联查询参数类型
 * 用于约束查询学生列表时的筛选条件、级联条件和分页参数
 */
export interface StudentQueryParams {
    /** 学校ID（级联条件） */
    schoolId?: number;

    /** 年级ID（级联条件，优先级高于schoolId） */
    gradeId?: number;

    /** 班级ID（级联条件，优先级高于gradeId） */
    classId?: number;

    /** 校服类型（筛选条件，对应school_uniforms.uniform_type） */
    uniformType?: number; // 1=夏装，2=春秋装，3=冬装（与数据库枚举一致）

    /** 支付状态（筛选条件，对应student_uniform_orders.payment_status） */
    paymentStatus?: PaymentStatus | 0 | 1; // 0=未付款，1=已付款（兼容枚举或数字）

    /** 页码（分页参数，默认1） */
    page?: number;

    /** 每页条数（分页参数，默认10） */
    pageSize?: number;
}

