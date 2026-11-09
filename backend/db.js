// การเชื่อมต่อฐานข้อมูล PostgreSQL ใช้ร่วมกันทั้ง server.js และ migrate.js
// ค่าการเชื่อมต่ออยู่ในไฟล์ backend/.env (ดูตัวอย่างใน .env.example)
const path = require('path');
const { Pool, types } = require('pg');

require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

// คอลัมน์ชนิด DATE (เช่น incident_date) ให้ส่งออกเป็นข้อความ 'YYYY-MM-DD' ตรง ๆ
// ถ้าปล่อยให้แปลงเป็น Date ของ JavaScript วันที่จะเลื่อนไปหนึ่งวันเพราะโซนเวลา
types.setTypeParser(types.builtins.DATE, (value) => value);

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'safety_db',
};

const pool = new Pool(dbConfig);

module.exports = pool;
// ค่าการเชื่อมต่อ ให้ setup-db.js ใช้สร้างฐานข้อมูลตอนที่ยังไม่มี
module.exports.dbConfig = dbConfig;
