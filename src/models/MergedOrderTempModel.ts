// src/models/MergedOrderTempModel.ts
import { executeQuery, executeWrite } from '../config/database';
import { MergedOrderTemp, MergedOrderItem } from '../types/mergedOrder.types';

class MergedOrderTempModel {
    /** 检查商户订单号是否存在 */
    static async exists(clientSn: string): Promise<boolean> {
        const sql = 'SELECT id FROM merged_orders_temp WHERE client_sn = ? LIMIT 1';
        const rows = await executeQuery(sql, [clientSn]);
        return rows.length > 0;
    }

    /** 按商户订单号查询 */
    static async findByClientSn(clientSn: string): Promise<MergedOrderTemp | null> {
        const sql = 'SELECT * FROM merged_orders_temp WHERE client_sn = ? LIMIT 1';
        const rows = await executeQuery(sql, [clientSn]);
        return rows[0] as Promise<MergedOrderTemp | null> || null;
    }

    /** 查询子项 */
    static async findItems(mergedOrderId: number): Promise<MergedOrderItem[]> {
        const sql = 'SELECT * FROM merged_order_items_temp WHERE merged_order_id = ?';
        return executeQuery(sql, [mergedOrderId]);
    }

    /** 更新二维码 */
    static async updateQrCode(clientSn: string, qrCode: string) {
        const sql = 'UPDATE merged_orders_temp SET qr_code = ? WHERE client_sn = ?';
        return executeWrite(sql, [qrCode, clientSn]);
    }

    /** 删除过期订单 */
    static async deleteExpired(now: Date) {
        const sql = 'DELETE FROM merged_orders_temp WHERE expire_at < ?';
        return executeWrite(sql, [now]);
    }
}

export default MergedOrderTempModel;