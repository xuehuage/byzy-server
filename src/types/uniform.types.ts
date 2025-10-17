import { Timestamps } from './database.types';
import { Student } from './school.types';

// 校服类型
export enum UniformTypeEnum {
    SUMMER_SET = 'summer_set',
    SPRING_AUTUMN_SET = 'spring_autumn_set',
    WINTER_SET = 'winter_set',
    SUMMER_TOP = 'summer_top',
    SPRING_AUTUMN_TOP = 'spring_autumn_top'
}

// 校服款式
export enum UniformStyleEnum {
    MALE = 'male',
    FEMALE = 'female',
    UNISEX = 'unisex'
}

// 校服类型表
export interface UniformType extends Timestamps {
    id: number;
    school_id: number;
    type: UniformTypeEnum;
    price: number;
}

// 校服款式表
export interface UniformStyle extends Timestamps {
    id: number;
    uniform_type_id: number;
    style: UniformStyleEnum;
    size_range: string;
}

// 学生购买记录
export interface StudentUniform extends Timestamps {
    id: number;
    student_id: number;
    uniform_type_id: number;
    style_id: number;
    size: string;
    quantity: number;
    payment_status: string;
    // 关联信息
    student?: Student;
    uniform_type?: UniformType;
}

// 统计结果类型
export interface GenderCount {
    total: number;
    male: number;
    female: number;
}

export interface UniformPurchaseStats {
    total: number;
    paid: number;
    unpaid: number;
    pending: number;
    type_stats: Record<UniformTypeEnum, {
        total: number;
        paid: number;
        unpaid: number;
        pending: number;
    }>;
}