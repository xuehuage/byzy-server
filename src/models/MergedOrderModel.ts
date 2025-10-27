import { executeQuery } from '../config/database';

class MergedOrderModel {
    /** 检查商户订单号是否存在 */
    static async exists(clientSn: string): Promise<boolean> {
        const sql = 'SELECT id FROM merged_orders WHERE client_sn = ? LIMIT 1';
        const rows = await executeQuery(sql, [clientSn]);
        return rows.length > 0;
    }
}

export default MergedOrderModel;