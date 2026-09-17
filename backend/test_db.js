const mysql = require('mysql2/promise');
async function test() {
  const conn = await mysql.createConnection({
    host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
    port: 4000,
    user: '3f2NbV8vWW6DGsq.root',
    password: 'dsdVPJyyEzTDGz6b',
    database: 'pms',
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
  });
  console.log("Successfully connected to AWS TiDB Cloud database 'pms'!");
  const [tables] = await conn.execute("SHOW TABLES;");
  console.log("Tables in pms:", tables);
  conn.end();
}
test();
