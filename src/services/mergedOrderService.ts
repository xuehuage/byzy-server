import { executeTransaction } from '../config/database';
import MergedOrderModel from '../models/MergedOrderModel';
import MergedOrderTempModel from '../models/MergedOrderTempModel';
import { StudentOrder } from '../types/student.types';

/**
 * 生成唯一商户订单号（同时检查临时表和正式表）
 */
export const generateUniqueClientSn = async (): Promise<string> => {
    let clientSn: string;
    let isExists: boolean;

    do {
        // 生成规则：ORD+时间戳+4位随机数（长度约28字节，符合≤32要求）
        clientSn = `ORD${Date.now()}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        // 双表检查唯一性
        const [tempExists, formalExists] = await Promise.all([
            MergedOrderTempModel.exists(clientSn),
            MergedOrderModel.exists(clientSn)
        ]);
        isExists = tempExists || formalExists;
    } while (isExists);

    return clientSn;
};

/**
 * 创建临时合并订单（预下单）
 * @param params 订单参数
 * @returns 商户订单号
 */
export const createTempMergedOrder = async (params: {
    studentId: number;
    totalAmount: number;
    payway: number;
    subject: string;
    unpaidOrders: StudentOrder[]; // 未付款的原始订单
}) => {
    const clientSn = await generateUniqueClientSn();
    const expireAt = new Date(Date.now() + 30 * 60 * 1000); // 30分钟过期
    console.log('params:', params)
    // 事务：创建临时主订单+子项
    const [orderResult] = await executeTransaction([
        {
            sql: `
        INSERT INTO merged_orders_temp 
          (client_sn, student_id, total_amount, payway, subject, operator, expire_at)
        VALUES (?, ?, ?, ?, ?, 'byzy_fyh', ?)
      `,
            params: [clientSn, params.studentId, params.totalAmount, params.payway, params.subject, expireAt],
            isWrite: true
        }
    ]);
    const tempOrderId = (orderResult as any).insertId;

    // 批量插入子项（关联原始未付款订单）
    if (params.unpaidOrders.length > 0) {
        await executeTransaction([
            {
                sql: `
          INSERT INTO merged_order_items_temp 
            (merged_order_id, student_uniform_order_id)
          VALUES ${params.unpaidOrders.map(() => '(?, ?)').join(',')}
        `,
                params: params.unpaidOrders.flatMap(order => [tempOrderId, order.id]),
                isWrite: true
            }
        ]);
    }

    return clientSn;
};

/**
 * 支付成功后迁移临时订单至正式表
 * @param clientSn 商户订单号
 * @param payTime 支付时间
 * @param transactionId 第三方流水号
 */
export const migrateToFormalOrder = async (
    clientSn: string,
    payTime: Date,
    transactionId?: string
) => {
    // 1. 查询临时订单及子项
    const tempOrder = await MergedOrderTempModel.findByClientSn(clientSn);
    if (!tempOrder) {
        throw new Error(`临时订单不存在或已过期：${clientSn}`);
    }
    const tempItems = await MergedOrderTempModel.findItems(tempOrder.id);

    // 2. 事务：迁移数据+删除临时记录+更新原始订单状态
    await executeTransaction([
        // 插入正式订单
        {
            sql: `
        INSERT INTO merged_orders 
          (client_sn, student_id, total_amount, payway, subject, status, qr_code, 
           operator, created_at, paid_at, transaction_id)
        VALUES (?, ?, ?, ?, ?, 'PAID', ?, 'byzy_fyh', ?, ?, ?)
      `,
            params: [
                tempOrder.client_sn,
                tempOrder.student_id,
                tempOrder.total_amount,
                tempOrder.payway,
                tempOrder.subject,
                tempOrder.qr_code,
                tempOrder.created_at,
                payTime,
                transactionId
            ],
            isWrite: true
        },
        // 插入正式子项
        {
            sql: `
        INSERT INTO merged_order_items 
          (merged_order_id, student_uniform_order_id, created_at)
        SELECT LAST_INSERT_ID(), student_uniform_order_id, created_at 
        FROM merged_order_items_temp 
        WHERE merged_order_id = ?
      `,
            params: [tempOrder.id],
            isWrite: true
        },
        // 更新原始校服订单为已付款
        {
            sql: `
        UPDATE student_uniform_orders 
        SET payment_status = 1, payment_time = ?, updated_at = NOW()
        WHERE id IN (
          SELECT student_uniform_order_id 
          FROM merged_order_items_temp 
          WHERE merged_order_id = ?
        )
      `,
            params: [payTime, tempOrder.id],
            isWrite: true
        },
        // 删除临时订单（级联删除子项）
        {
            sql: 'DELETE FROM merged_orders_temp WHERE id = ?',
            params: [tempOrder.id],
            isWrite: true
        }
    ]);
};