import { Student, StudentOrder } from './student.types';



// 身份证查询结果
export interface StudentByIdCardResult {
    student: Student;
    orders: StudentOrder[];
}