// src/utils/studentDataProcessor.ts
import { StudentRawRecord, MergedStudent, StudentOrder } from '../types/student.types';

/**
 * 合并同一学生的多条订单记录，将订单信息整合为数组
 * @param originalData 原始查询结果（可能包含同一学生的多条记录）
 * @returns 合并后的学生数组（每个学生含orders数组）
 */
export function mergeStudentOrders(originalData: StudentRawRecord[]): MergedStudent[] {
    const studentMap = new Map<number, MergedStudent>();

    for (const item of originalData) {
        const studentId = item.student_id;

        // 初始化学生基础信息（仅第一次出现时）
        if (!studentMap.has(studentId)) {
            const baseInfo: MergedStudent = {
                // 学生信息
                student_id: item.student_id,
                student_name: item.student_name,
                gender: item.gender,
                student_class_id: item.student_class_id,
                student_no: item.student_no,
                id_card: item.id_card,
                source: item.source,
                student_created_at: item.student_created_at,
                student_updated_at: item.student_updated_at,

                // 班级信息
                class_id: item.class_id,
                class_name: item.class_name,
                class_order: item.class_order,
                class_grade_id: item.class_grade_id,
                class_school_id: item.class_school_id,

                // 年级信息
                grade_id: item.grade_id,
                grade_name: item.grade_name,
                grade_level: item.grade_level,
                grade_school_id: item.grade_school_id,

                // 学校信息
                school_id: item.school_id,
                school_name: item.school_name,
                school_type: item.school_type,
                school_status: item.school_status,

                // 初始化订单数组
                orders: []
            };
            studentMap.set(studentId, baseInfo);
        }

        // 提取订单信息（仅当存在order_id时）
        if (item.order_id) {
            const orderInfo: StudentOrder = {
                order_id: item.order_id,
                order_type: item.order_type!,
                payment_status: item.payment_status!,
                payment_time: item.payment_time!,
                quantity: item.quantity!,
                size: item.size!,
                total_amount: item.total_amount!,
                school_uniform_id: item.school_uniform_id!,
                order_created_at: item.order_created_at!,
                order_updated_at: item.order_updated_at!,
                uniform_id: item.uniform_id!,
                uniform_type: item.uniform_type!,
                uniform_gender: item.uniform_gender!,
                uniform_price: item.uniform_price!,
                is_online: item.is_online!,
                uniform_status: item.uniform_status!,
                uniform_school_id: item.uniform_school_id!
            };

            // 添加到学生的订单数组
            studentMap.get(studentId)!.orders.push(orderInfo);
        }
    }

    return Array.from(studentMap.values());
}