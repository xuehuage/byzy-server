import mariadb, { Pool, PoolConfig, PoolConnection, UpsertResult } from 'mariadb';
import dotenv from 'dotenv';

// 拆分类型：查询结果为行数据数组，写操作结果为UpsertResult
export type QueryResult<T> = T[]; // SELECT等查询操作返回的结果集
export type WriteResult = UpsertResult; // INSERT/UPDATE/DELETE等写操作返回的结果

// 创建连接池
export const pool: Pool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '!fyh3759MYSQL',
  database: process.env.DB_NAME || 'byzy',
  connectionLimit: 5
});

// 执行查询（明确返回查询结果数组）
export const executeQuery = async <T>(sql: string, params: any[] = []): Promise<QueryResult<T>> => {
  try {
    const result = await pool.execute<T[]>(sql, params);
    return result as QueryResult<T>;
  } catch (error) {
    console.error('Query error:', error);
    throw new Error(`Query failed: ${(error as Error).message}`);
  }
};

// 执行写操作（明确返回UpsertResult）
export const executeWrite = async (sql: string, params: any[] = []): Promise<WriteResult> => {
  try {
    const result = await pool.execute<UpsertResult>(sql, params);
    return result as WriteResult;
  } catch (error) {
    console.error('Write operation error:', error);
    throw new Error(`Write failed: ${(error as Error).message}`);
  }
};

// 事务处理（同时支持查询和写操作）
export const executeTransaction = async (
  queries: Array<{ sql: string; params: any[]; isWrite?: boolean }>
): Promise<(QueryResult<any> | WriteResult)[]> => {
  const connection: PoolConnection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const results: (QueryResult<any> | WriteResult)[] = [];
    for (const query of queries) {
      const result = query.isWrite
        ? await connection.execute<UpsertResult>(query.sql, query.params)
        : await connection.execute<any[]>(query.sql, query.params);
      results.push(result);
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

// 测试连接
export const testConnection = async (): Promise<boolean> => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    throw error;
  } finally {
    if (connection) connection.release();
  }
};