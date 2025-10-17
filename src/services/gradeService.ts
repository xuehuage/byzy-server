import GradeModel from '../models/Grade';
import SchoolModel from '../models/School';
import { User } from '../types';
import { CreateGradeDto, UpdateGradeDto, Grade } from '../types/gradeClass.types';
import { JwtPayload } from '../utils/jwt';

class GradeService {
  /**
   * 创建年级（含权限验证）
   */
  static async createGrade(gradeData: CreateGradeDto, user: JwtPayload): Promise<Grade> {
    // 验证学校归属
    const school = await SchoolModel.findByIdAndManufacturer(gradeData.school_id, user);
    if (!school) {
      throw new Error('Unauthorized to create grade for this school');
    }

    // // 验证年级level不超过学校学制
    // if (gradeData.level > school.education_years) {
    //   throw new Error(`Grade level cannot exceed school education years (${school.education_years})`);
    // }

    return GradeModel.create(gradeData);
  }

  /**
   * 查询学校下的所有年级
   */
  static async getGradesBySchool(schoolId: number, user: JwtPayload): Promise<Grade[]> {
    // 验证学校归属
    const school = await SchoolModel.findByIdAndManufacturer(schoolId, user);
    if (!school) {
      throw new Error('Unauthorized to access grades for this school');
    }

    return GradeModel.findBySchoolId(schoolId);
  }

  /**
   * 更新年级
   */
  static async updateGrade(gradeId: number, updateData: UpdateGradeDto, user: JwtPayload): Promise<Grade | null> {
    // 验证年级存在及归属
    const grade = await GradeModel.findById(gradeId);
    if (!grade) {
      throw new Error('Grade not found');
    }

    const school = await SchoolModel.findByIdAndManufacturer(grade.school_id, user);
    if (!school) {
      throw new Error('Unauthorized to update this grade');
    }

    // // 验证level不超过学制（如果更新了level）
    // if (updateData.level !== undefined && updateData.level > school.education_years) {
    //   throw new Error(`Grade level cannot exceed school education years (${school.education_years})`);
    // }

    return GradeModel.update(gradeId, updateData);
  }

  /**
   * 删除年级
   */
  static async deleteGrade(gradeId: number, user: JwtPayload): Promise<boolean> {
    const grade = await GradeModel.findById(gradeId);
    if (!grade) {
      throw new Error('Grade not found');
    }

    const school = await SchoolModel.findByIdAndManufacturer(grade.school_id, user);
    if (!school) {
      throw new Error('Unauthorized to delete this grade');
    }

    return GradeModel.delete(gradeId);
  }


}

export default GradeService;
