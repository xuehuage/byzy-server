// 学生相关类型定义
import { Timestamps } from './database.types';
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
    payment_status: string; // 整体付款状态（预留）
}

