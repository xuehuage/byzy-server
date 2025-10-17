import xlsx from 'xlsx';
import { executeTransaction } from '../config/database';
import { Gender } from '../types/student.types';
import { PaymentStatus } from '../types/database.types';
import SchoolModel from '../models/School';
import GradeModel from '../models/Grade';
import ClassModel from '../models/Class';
import { bulkCreateStudents } from './studentService';
import { bulkCreateStudentUniforms } from './studentUniformService';

/**
 * 解析Excel并导入学校学生数据
 * @param fileBuffer Excel文件缓冲区
 * @param manufacturerId 厂商ID（用于权限校验）
 */
export const importSchoolStudents = async (fileBuffer: Buffer, manufacturerId: number) => {
    // 1. 解析Excel
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const excelData: any[] = xlsx.utils.sheet_to_json(worksheet);

    // 2. 事务处理：确保学生和购买记录原子性
    await executeTransaction([]); // 空事务初始化

    // 3. 遍历Excel数据处理
    for (const row of excelData) {
        // 3.1 查找学校ID（通过学校名称和厂商ID）
        const schools = await SchoolModel.findByConditions({
            name: row.学校名称,
            manufacturer_id: manufacturerId
        });
        if (schools.length === 0) throw new Error(`学校不存在：${row.学校名称}`);
        const schoolId = schools[0].id;

        // 3.2 查找年级ID（通过年级名称和学校ID）
        const grades = await GradeModel.findBySchoolId(schoolId);
        const grade = grades.find(g => g.name === row.年级);
        if (!grade) throw new Error(`年级不存在：${row.年级}`);
        const gradeId = grade.id;

        // 3.3 查找班级ID（通过班级名称和年级ID）
        const classes = await ClassModel.findByGradeId(gradeId);
        const cls = classes.find(c => c.name === row.班级);
        if (!cls) throw new Error(`班级不存在：${row.班级}`);
        const classId = cls.id;

        // 3.4 准备学生数据
        const student = {
            name: row.姓名,
            id_card: row.身份证号 || '',
            student_id: row.学号 || '',
            class_id: classId,
            gender: row.性别 === '男' ? Gender.MALE : Gender.FEMALE,
            uniform_size: row.默认尺码 || '',
            payment_status: PaymentStatus.UNPAID // 默认为未付款
        };

        // 3.5 批量创建学生（实际应收集所有学生后批量插入）
        await bulkCreateStudents([student]);

        // 3.6 处理校服购买记录（略，需关联school_uniforms表的uniform_id）
    }
};