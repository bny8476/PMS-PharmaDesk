const mysql = require('mysql2/promise');
async function test() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.alicloud.tidbcloud.com',
    port: 4000,
    user: '3ZMzEHamXVuJdSt.root',
    password: '16V7qifbKlm4oYas',
    database: 'pms',
    ssl: { minVersion: 'TLSv1.2' }
  });
  const [users] = await conn.execute("SELECT id, username FROM users;");
  const [roles] = await conn.execute("SELECT id, name FROM roles;");
  const [userRoles] = await conn.execute("SELECT user_id, role_id FROM user_roles;");
  console.log('Users:', users);
  console.log('Roles:', roles);
  console.log('User Roles:', userRoles);
  conn.end();
}
test();
