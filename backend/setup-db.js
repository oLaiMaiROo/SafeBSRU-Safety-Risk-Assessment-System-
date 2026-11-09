// ติดตั้งฐานข้อมูลบนเครื่องใหม่: สร้างฐานข้อมูล (ถ้ายังไม่มี) แล้วสร้างตารางจาก schema.sql
// วิธีใช้ (ในโฟลเดอร์ backend):  node setup-db.js
// ใช้ค่าการเชื่อมต่อจาก backend/.env และจะไม่แตะฐานข้อมูลที่มีตารางอยู่แล้ว
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { dbConfig } = require('./db');

async function main() {
    const dbName = dbConfig.database;

    // 1. สร้างฐานข้อมูล ถ้ายังไม่มี (ต้องเชื่อมต่อผ่านฐานข้อมูลระบบ "postgres")
    const server = new Client({ ...dbConfig, database: 'postgres' });
    await server.connect();
    try {
        const found = await server.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
        if (found.rowCount === 0) {
            await server.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
            console.log(`สร้างฐานข้อมูล ${dbName} แล้ว`);
        } else {
            console.log(`มีฐานข้อมูล ${dbName} อยู่แล้ว`);
        }
    } finally {
        await server.end();
    }

    // 2. สร้างตาราง ถ้ายังไม่มี
    const db = new Client(dbConfig);
    await db.connect();
    try {
        const existing = await db.query("SELECT to_regclass('public.reports') AS reports");
        if (existing.rows[0].reports) {
            console.log(`ฐานข้อมูล ${dbName} มีตารางอยู่แล้ว ไม่ได้เปลี่ยนอะไร`);
            console.log('ถ้าเป็นฐานข้อมูลโครงสร้างเดิม ให้ใช้ migration แทน (ดู backend/DATABASE.md)');
            return;
        }
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        try {
            await db.query(sql);
        } catch (err) {
            await db.query('ROLLBACK').catch(() => {});
            throw err;
        }
        console.log('สร้างตารางครบ 5 ตาราง พร้อมรายชื่อหน่วยงานและระดับความรุนแรงแล้ว');
        console.log('ขั้นต่อไป สร้างแอดมินคนแรก:  node create-admin.js <ชื่อผู้ใช้> <รหัสผ่าน> "<ชื่อ-นามสกุล>"');
    } finally {
        await db.end();
    }
}

main().catch((err) => {
    console.error('ติดตั้งฐานข้อมูลไม่สำเร็จ:', err.message);
    if (err.code === '28P01') console.error('รหัสผ่าน PostgreSQL ไม่ถูกต้อง ตรวจค่า DB_PASSWORD ในไฟล์ backend/.env');
    if (err.code === 'ECONNREFUSED') console.error('เชื่อมต่อ PostgreSQL ไม่ได้ ตรวจว่าติดตั้งและเปิดบริการ PostgreSQL แล้ว');
    process.exitCode = 1;
});
