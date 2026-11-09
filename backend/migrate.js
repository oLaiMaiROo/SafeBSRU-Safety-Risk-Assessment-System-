// รันไฟล์ migration (SQL) กับฐานข้อมูล
// วิธีใช้ (ในโฟลเดอร์ backend):  node migrate.js migrations/001_relations_and_cleanup.sql
// ไฟล์ SQL ต้องครอบด้วย BEGIN; ... COMMIT; ถ้าคำสั่งไหนผิด ฐานข้อมูลจะไม่ถูกเปลี่ยนเลย
const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function main() {
    const file = process.argv[2];
    if (!file) {
        console.error('ระบุไฟล์ migration เช่น: node migrate.js migrations/001_relations_and_cleanup.sql');
        process.exitCode = 1;
        return;
    }

    const fromCwd = path.resolve(process.cwd(), file);
    const fullPath = fs.existsSync(fromCwd) ? fromCwd : path.resolve(__dirname, file);
    const sql = fs.readFileSync(fullPath, 'utf8');

    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log(`migration สำเร็จ: ${path.basename(fullPath)}`);
    } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        console.error(`migration ไม่สำเร็จ ฐานข้อมูลยังเหมือนเดิม: ${err.message}`);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

main();
