import ClassModel from '../models/Class';
import GradeModel from '../models/Grade';
import SchoolModel from '../models/School';
import { Class } from '../types/gradeClass.types';

class ClassService {
  //   /**
  //    * 为年级添加单个班级
  //    */
  //   static async createClass(classData: Omit<Class, 'id' | 'created_at' | 'updated_at'>, manufacturerId: number): Promise<Class> {
  //     // 验证年级归属
  //     const grade = await GradeModel.findById(classData.grade_id);
  //     if (!grade) {
  //       throw new Error('Grade not found');
  //     }

  //     // 验证学校归属
  //     const school = await SchoolModel.findByIdAndManufacturer(grade.school_id, manufacturerId);
  //     if (!school) {
  //       throw new Error('Unauthorized to add class to this grade');
  //     }

  //     return ClassModel.create(classData);
  //   }

  //   /**
  //    * 查询年级下的所有班级
  //    */
  //   static async getClassesByGrade(gradeId: number, manufacturerId: number): Promise<Class[]> {
  //     const grade = await GradeModel.findById(gradeId);
  //     if (!grade) {
  //       throw new Error('Grade not found');
  //     }

  //     const school = await SchoolModel.findByIdAndManufacturer(grade.school_id, manufacturerId);
  //     if (!school) {
  //       throw new Error('Unauthorized to access classes for this grade');
  //     }

  //     return ClassModel.findByGradeId(gradeId);
  //   }

  //   /**
  //    * 更新班级
  //    */
  //   static async updateClass(classId: number, updateData: Partial<Omit<Class, 'id' | 'grade_id' | 'created_at' | 'updated_at'>>, manufacturerId: number): Promise<Class | null> {
  //     const cls = await ClassModel.findById(classId);
  //     if (!cls) {
  //       throw new Error('Class not found');
  //     }

  //     const grade = await GradeModel.findById(cls.grade_id);
  //     if (!grade) {
  //       throw new Error('Associated grade not found');
  //     }

  //     const school = await SchoolModel.findByIdAndManufacturer(grade.school_id, manufacturerId);
  //     if (!school) {
  //       throw new Error('Unauthorized to update this class');
  //     }

  //     return ClassModel.update(classId, updateData);
  //   }

  //   /**
  //    * 删除班级
  //    */
  //   static async deleteClass(classId: number, manufacturerId: number): Promise<boolean> {
  //     const cls = await ClassModel.findById(classId);
  //     if (!cls) {
  //       throw new Error('Class not found');
  //     }

  //     const grade = await GradeModel.findById(cls.grade_id);
  //     if (!grade) {
  //       throw new Error('Associated grade not found');
  //     }

  //     const school = await SchoolModel.findByIdAndManufacturer(grade.school_id, manufacturerId);
  //     if (!school) {
  //       throw new Error('Unauthorized to delete this class');
  //     }

  //     return ClassModel.delete(classId);
  //   }
}

export default ClassService;
