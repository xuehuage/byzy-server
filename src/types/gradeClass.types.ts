import { Timestamps } from './database.types';

/**
 * 年级类型（与数据库表grades对应）
 */
export interface Grade extends Timestamps {
  id: number;
  name: string; // 年级名称（如"一年级"）
  school_id: number; // 关联学校ID
  classes?: Class[]; // 新增：关联的班级数组（非数据库字段）
}

/**
 * 创建年级：必须包含 school_id（指定归属）
 */
export type CreateGradeDto = Omit<Grade, 'id' | 'created_at' | 'updated_at'>;

/**
 * 更新年级：排除 school_id（禁止修改归属）
 */
export type UpdateGradeDto = Partial<Omit<Grade, 'id' | 'school_id' | 'created_at' | 'updated_at'>>;

/**
 * 班级类型（与数据库表classes对应）
 */
export interface Class extends Timestamps {
  id: number;
  name: string;
  class_order: number; // 班级序号，如 1班、2班
  grade_id: number;
  // 关联查询时可能需要的字段
  grade?: Grade;
}

/**
 * 年级自动升级任务的配置类型
 */
export interface GradeUpgradeConfig {
  checkInterval: string; // cron表达式，如"0 0 0 1 9 *"（每年9月1日0点执行）
}
