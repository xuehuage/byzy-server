// src/config/database.ts
import mysql from 'mysql2';
import { Pool, PoolOptions, PoolConnection, OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 定义数据库查询可能的返回类型
export type MySqlResult =
  | OkPacket
  | OkPacket[]
  | ResultSetHeader
  | ResultSetHeader[]
  | RowDataPacket[]
  | RowDataPacket[][]
  | RowDataPacket;

// 定义数据库连接配置接口
export interface DatabaseConfig extends PoolOptions {
  host: string;
  user: string;
  password: string;
  database: string;
  waitForConnections?: boolean;
  connectionLimit?: number;
  queueLimit?: number;
}

// 从环境变量获取数据库配置，提供默认值
const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'byzy',
  waitForConnections: true,
  connectionLimit: 10, // 连接池中的最大连接数
  queueLimit: 0, // 没有限制
};

// 创建连接池
const pool: Pool = mysql.createPool(dbConfig).promise();

// 测试数据库连接
export const testConnection = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    connection.release();
  } catch (error) {
    console.error('Database connection failed:', error);
    throw new Error('Unable to connect to the database');
  }
};

/**
 * 执行SQL查询（修复核心：正确返回rows数组）
 * @param sql SQL语句
 * @param params 查询参数
 * @returns 对于SELECT返回rows数组；对于INSERT/UPDATE/DELETE返回结果对象
 */
export async function executeQuery<T>(sql: string, params: any[] = []): Promise<T> {
  try {
    const [result] = await pool.execute(sql, params); // ✅ 解构出result（rows或ResultSetHeader）
    // console.log('SQL执行结果:', result); // 调试用：查看返回格式
    return result as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw new Error(`Database query failed: ${(error as Error).message}`);
  }
}

// 执行事务的辅助函数
export const executeTransaction = async (
  queries: Array<{ sql: string; params: any[] }>
): Promise<MySqlResult[]> => { // 明确返回 MySqlResult 数组
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const results: MySqlResult[] = []; // 定义结果数组类型
    for (const query of queries) {
      const [result] = await connection.execute(query.sql, query.params);
      results.push(result as MySqlResult);
    }
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// 导出连接池和配置
export { pool, dbConfig };
export default pool;