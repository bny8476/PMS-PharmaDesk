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
  const [rows] = await conn.execute("SELECT po_number, total_value, subtotal, gst_amount FROM purchase_orders ORDER BY created_at DESC LIMIT 5;");
  console.log(rows);
  conn.end();
}
test();
