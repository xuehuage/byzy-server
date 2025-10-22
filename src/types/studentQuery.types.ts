import { PaymentStatus } from './database.types';
import { Student } from './student.types';

import { StudentUniform } from './studentUniform.types';

export interface StudentOrder extends StudentUniform {
    uniform_name: string;
    unit_price: number;
    total_price: number;
    // 补充PaymentStatus类型约束
    payment_status: PaymentStatus;
}

// 身份证查询结果
export interface StudentByIdCardResult {
    student: Student;
    orders: StudentOrder[];
}