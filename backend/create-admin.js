// เพิ่มบัญชีผู้ดูแลระบบจาก command line (ใช้สร้างแอดมินคนแรกบนเครื่องใหม่ แอดมินคนต่อไปเพิ่มจากหน้าเว็บได้)
// วิธีใช้ (ในโฟลเดอร์ backend):  node create-admin.js <ชื่อผู้ใช้> <รหัสผ่าน> "<ชื่อ-นามสกุล>"
// รหัสผ่านถูกเก็บแบบเข้ารหัส bcrypt ไม่เก็บตัวจริง
const pool = require('./db');

async function main() {
    const [username, password, fullName] = process.argv.slice(2);
    if (!username || !password) {
        console.error('วิธีใช้: node create-admin.js <ชื่อผู้ใช้> <รหัสผ่าน> "<ชื่อ-นามสกุล>"');
        process.exitCode = 1;
        return;
    }

    try {
        const result = await pool.query(
            "INSERT INTO admins (username, password_hash, full_name) VALUES ($1, crypt($2, gen_salt('bf', 10)), $3) RETURNING id, username",
            [username.trim(), password, fullName ? fullName.trim() : null]
        );
        const admin = result.rows[0];
        console.log(`สร้างแอดมิน "${admin.username}" แล้ว (id ${admin.id}) เข้าสู่ระบบจากหน้าเว็บได้เลย`);
    } catch (err) {
        if (err.code === '23505') console.error(`มีชื่อผู้ใช้ "${username}" อยู่แล้ว เลือกชื่ออื่น`);
        else if (err.code === '42P01') console.error('ยังไม่มีตาราง admins ให้รัน node setup-db.js ก่อน');
        else console.error('สร้างแอดมินไม่สำเร็จ:', err.message);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

main();
