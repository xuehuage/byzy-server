// 学生相关类型定义
import { PaymentStatus, Timestamps } from './database.types';
import { UniformType } from './school.types';

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


/** 原始查询结果中的单条记录（包含学生+订单+校服信息） */
export interface StudentRawRecord {
    // 学生基础信息
    student_id: number;
    student_name: string;
    gender: number;
    student_class_id: number;
    student_no: string;
    id_card: string;
    source: number;
    student_created_at: string;
    student_updated_at: string;

    // 班级信息
    class_id: number;
    class_name: string;
    class_order: number;
    class_grade_id: number;
    class_school_id: number | null;

    // 年级信息
    grade_id: number;
    grade_name: string;
    grade_level: number;
    grade_school_id: number;

    // 学校信息
    school_id: number;
    school_name: string;
    school_type: number;
    school_status: number;

    // 订单信息（可能为null，无订单时）
    order_id?: number;
    order_type?: number;
    payment_status?: number;
    payment_time?: string | null;
    quantity?: number;
    size?: string;
    total_amount?: string;
    school_uniform_id?: number;
    order_created_at?: string;
    order_updated_at?: string;

    // 校服信息（可能为null，无订单时）
    uniform_id?: number;
    uniform_type?: UniformType; // 1=夏装，2=春秋装，3=冬装
    uniform_gender?: string;
    uniform_price?: string;
    is_online?: number;
    uniform_status?: number;
    uniform_school_id?: number;
}

/** 合并后的订单信息（包含对应的校服信息） */
export interface StudentOrder {
    id?: number //继承自uniform_orders
    order_id: number;
    order_type: number;
    payment_status: number;
    payment_time: string | null;
    quantity: number;
    size: string;
    total_amount: string;
    school_uniform_id: number;
    order_created_at: string;
    order_updated_at: string;
    uniform_id: number;
    uniform_type: UniformType;
    uniform_gender: string;
    uniform_price: string;
    is_online: number;
    uniform_status: number;
    uniform_school_id: number;
}

/** 合并后的学生信息（含订单数组） */
export interface MergedStudent {
    // 学生基础信息
    student_id: number;
    student_name: string;
    gender: number;
    student_class_id: number;
    student_no: string;
    id_card: string;
    source: number;
    student_created_at: string;
    student_updated_at: string;

    // 班级信息
    class_id: number;
    class_name: string;
    class_order: number;
    class_grade_id: number;
    class_school_id: number | null;

    // 年级信息
    grade_id: number;
    grade_name: string;
    grade_level: number;
    grade_school_id: number;

    // 学校信息
    school_id: number;
    school_name: string;
    school_type: number;
    school_status: number;

    // 订单数组（无订单时为空数组）
    orders: StudentOrder[];
}
