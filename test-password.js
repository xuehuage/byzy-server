const bcrypt = require('bcryptjs');
const plainPassword = 'admin@123'; // 明文密码
bcrypt.hash(plainPassword, 10, (err, newHash) => {
  if (err) throw err;
  console.log('新的加密密码：', newHash); // 复制这个值
});