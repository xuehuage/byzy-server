// src/types/school.types.ts
import { Timestamps, Status, Manufacturer, PaymentStatus } from './database.types';
import { Class, Grade } from './gradeClass.types';

/**
 * 学校信息类型（与数据库表结构一致）
 * 关联厂商通过manufacturer_id实现
 */
export interface School extends Timestamps {
  id: number;
  name: string;
  uniform_contact: string; // 校服联系人
  uniform_phone: string; // 校服联系电话
  manufacturer_id: number; // 关联的厂商ID
  status: Status; // 学校状态（复用通用状态枚举）
  education_years: number; // 学年为几年
  type: number; // 0-幼儿园；1-小学；2-初中；3-高中
  grades?: Grade[]; // 新增年级数组
  classes?: Class[]; // 新增班级数组
}

export enum UniformType {
  SUMMER_SET = 1, // 夏装
  SPRING_AUTUMN_SET = 2, // 春秋装
  WINTER_SET = 3, // 冬装
  SUMMER_TOP = 4, // 夏装上衣
  SPRING_AUTUMN_TOP = 5 // 春秋装上衣
}

export interface FrontendGradeInput {
  grade: string; // 前端传来的年级标识（如"25"）
  class: string; // 前端传来的班级名称（如"2班"）
}

/**
 * 创建学校的请求参数类型
 */
export type CreateSchoolDto = Omit<School, 'id' | 'manufacturer_id' | 'created_at' | 'updated_at'> & {
  grades?: FrontendGradeInput[]; // 接收前端格式的年级班级数据
  manufacturer_id?: number; // 超级管理员创建时需指定
};

/**
 * 学校查询参数类型
 * 用于筛选、分页等查询场景
 */
export interface SchoolQueryParams {
  name?: string; // 按学校名称模糊查询
  manufacturer_id?: number; // 按厂商ID筛选
  status?: Status; // 按状态筛选
  page?: number; // 页码
  pageSize?: number; // 每页条数
}



// 学生 (Students)
export interface Student extends Timestamps {
  id: number;
  name: string;
  id_card: string;
  student_id: string; // 学号
  class_id: number;
  uniform_size: string; // 校服尺寸
  payment_status: PaymentStatus;
  // 关联查询时可能需要的字段
  class?: Class;
}





/**
 * 更新学校的请求参数类型
 */
export type UpdateSchoolDto = Partial<Omit<School, 'id' | 'manufacturer_id' | 'created_at' | 'updated_at'>> & {
  grades?: Omit<Grade, 'school_id'>[]; // 更新时无需指定school_id
};