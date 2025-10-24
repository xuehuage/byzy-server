// src/models/User.ts
import { executeQuery, executeWrite, QueryResult, WriteResult } from '../config/database';
import { User, Status, UserRole, UserWithoutPassword } from '../types';
import bcrypt from 'bcryptjs';


interface UserRow extends User { }

// 保留完整User的映射（用于确实需要password的场景）
const mapRowToUser = (row: UserRow): User => {
  if (!row.password) {
    throw new Error('Password field is required for User type');
  }
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    realname: row.realname,
    phone: row.phone,
    email: row.email,
    role: row.role,
    role_id: row.role_id,
    manufacturer_id: row.manufacturer_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at,
  };
};

export const mapRowToUserWithoutPassword = (row: UserRow): UserWithoutPassword => {
  return {
    id: row.id,
    username: row.username,
    realname: row.realname,
    phone: row.phone,
    email: row.email,
    role: row.role,
    role_id: row.role_id,
    manufacturer_id: row.manufacturer_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_login_at: row.last_login_at,
  };
};




const UserModel = {
  /**
   * 创建新用户（注册）
   */
  async create(userData: Omit<User, 'id' | 'created_at' | 'updated_at' | 'last_login_at'>): Promise<UserWithoutPassword> {
    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const query = `
      INSERT INTO users 
        (username, password, realname, phone, email, role, manufacturer_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      userData.username,
      hashedPassword,
      userData.realname,
      userData.phone,
      userData.email,
      userData.role,
      userData.manufacturer_id || null, // 厂商ID可为空（超管无厂商）
      userData.status || Status.ACTIVE
    ];

    try {
      const result: WriteResult = await executeWrite(query, params);
      const insertId = result.insertId as number;

      // 查询新创建的用户（不含密码）
      const newUser = await this.findById(insertId);
      if (!newUser) {
        throw new Error('Failed to retrieve new user');
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  },

  /**
   * 通过ID查询用户
   */
  async findById(id: number): Promise<UserWithoutPassword | null> {
    const query = `
      SELECT id, username, realname, phone, email, role, manufacturer_id, 
             status, created_at, updated_at, last_login_at
      FROM users 
      WHERE id = ?
    `;

    try {
      // 明确断言为UserRow数组
      const [rows] = await executeQuery(query, [id]) as [UserRow[]];
      if (rows.length === 0) return null;
      return mapRowToUserWithoutPassword(rows[0]);
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw new Error('Failed to find user');
    }
  },

  /**
   * 通过用户名查询用户（用于登录）
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT * FROM users WHERE username = ?
    `;

    try {

      const rows = await executeQuery<UserRow>(query, [username]);
      if (rows.length === 0) return null;
      return rows[0];
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw new Error('Failed to find user');
    }
  },

  /**
   * 根据厂商ID查询关联用户（厂商管理员和职员）
   */
  async findByManufacturerId(manufacturerId: number): Promise<User[]> {
    const query = `
      SELECT id, username, realname, phone, email, role, 
             status, created_at, updated_at
      FROM users 
      WHERE manufacturer_id = ? 
        AND role IN ('manufacturer_admin', 'staff')
    `;

    try {
      const rows: QueryResult<UserRow> = await executeQuery<UserRow>(query, [manufacturerId]);
      return rows.map(mapRowToUser);
    } catch (error) {
      console.error('Error finding users by manufacturer:', error);
      throw new Error('Failed to find associated users');
    }
  },

  /**
   * 更新用户信息
   */
  async update(id: number, data: Partial<Omit<User, 'id' | 'created_at'>>): Promise<UserWithoutPassword | null> {
    // 构建动态更新字段（排除空值）
    const updates = Object.entries(data)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key]) => `${key} = ?`);

    if (updates.length === 0) {
      return this.findById(id); // 无更新内容，直接返回当前用户
    }

    // 处理密码加密（如果更新密码）
    const params: any[] = [];
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    // 收集参数
    params.push(...Object.values(data).filter(v => v !== undefined && v !== null));
    params.push(id); // 最后一个参数是用户ID

    const query = `
      UPDATE users 
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = ?
    `;

    try {
      await executeWrite(query, params);
      return this.findById(id); // 返回更新后的用户信息
    } catch (error) {
      console.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  },

  /**
   * 删除用户
   */
  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';

    try {
      const result: WriteResult = await executeWrite(query, [id]);
      return result.affectedRows === 1;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  },

  /**
   * 更新用户最后登录时间
   */
  async updateLastLogin(id: number): Promise<void> {
    const query = 'UPDATE users SET last_login_at = NOW() WHERE id = ?';

    try {
      await executeWrite(query, [id]);
    } catch (error) {
      console.error('Error updating last login:', error);
      // 登录成功但更新时间失败，不阻断主流程，仅日志记录
    }
  },

  /**
 * 根据用户名查询用户的角色 ID（role_id）
  *@param username - 用户名
  *@returns 角色 ID（number）或 null（用户不存在时）
*/
  async getUserRoleId(username: string): Promise<number | null> {
    try {
      const user = await this.findByUsername(username);
      // 若用户不存在，返回 null；存在则返回其 role_id
      return user ? user.role_id : null;
    } catch (error) {
      console.error('Error getting user role ID:', error);
      throw new Error('Failed to get user role ID');
    }
  },
  /**
  * 根据角色名称（如 'super_admin'）查询对应的角色 ID
  * 从 users 表中查询（因为用户表中已存储 role 和 role_id 关联）
  */
  async getRoleIdByRoleName(role: UserRole): Promise<number | null> {
    try {
      // 查询任意一个拥有该角色的用户，获取其 role_id（角色与 role_id 是一对一映射）
      const query = `
        SELECT DISTINCT role_id 
        FROM users 
        WHERE role = ? 
        LIMIT 1
      `;

      const result: QueryResult<{ role_id: number }> = await executeQuery(query, [role]);
      return result.length > 0 ? result[0].role_id : null;
    } catch (error) {
      console.error('Error getting role ID by role name:', error);
      throw new Error('Failed to get role ID');
    }
  }
};

export default UserModel;
