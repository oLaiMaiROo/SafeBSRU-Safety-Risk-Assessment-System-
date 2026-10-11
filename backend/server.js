const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const multer = require('multer'); // ตัวช่วยรับไฟล์รูป
const fs = require('fs');
const path = require('path');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// สร้างโฟลเดอร์ชื่อ uploads ไว้เก็บรูปภาพ (ถ้ายังไม่มี)
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// เปิดให้ Frontend สามารถเข้ามาโหลดรูปในโฟลเดอร์ uploads ไปแสดงผลได้
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ตั้งค่าที่เก็บไฟล์และชื่อไฟล์ (ไม่ให้ชื่อซ้ำกัน)
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, './uploads') },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage }); // รองรับการอัปโหลด

// ----------------------------------------
// ตั้งค่า Database
// ----------------------------------------
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'safety_db',     
    password: '06062547', // รหัสผ่านของคุณปลาย
    port: 5432,
});

pool.connect((err) => {
    if (err) console.error('❌ เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.stack);
    else console.log('✅ เชื่อมต่อฐานข้อมูล PostgreSQL (safety_db) สำเร็จแล้ว!');
});

// ========================================
// 🔐 ระบบจัดการ Admin (อัปเดตระบบ Online)
// ========================================

// API 1: สำหรับล็อกอิน (Login) + ตั้งสถานะเป็น Online
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        // เช็คว่ามีไอดีและรหัสตรงกันใน Database ไหม
        const result = await pool.query(
            'SELECT id, username, full_name FROM admins WHERE username = $1 AND password = $2',
            [username, password]
        );

        if (result.rows.length > 0) {
            const adminData = result.rows[0];
            // 🌟 อัปเดตสถานะเป็นออนไลน์
            await pool.query('UPDATE admins SET is_online = true WHERE id = $1', [adminData.id]);
            res.json({ success: true, admin: adminData, message: 'เข้าสู่ระบบสำเร็จ' });
        } else {
            res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// API 1.5: สำหรับล็อกเอาต์ (Logout) + ตั้งสถานะเป็น Offline
app.post('/api/logout', async (req, res) => {
    try {
        const { id } = req.body;
        if (id) {
            // 🌟 อัปเดตสถานะเป็นออฟไลน์
            await pool.query('UPDATE admins SET is_online = false WHERE id = $1', [id]);
        }
        res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
    } catch (err) {
        console.error("Logout Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการออกจากระบบ' });
    }
});

// API 2: ดึงรายชื่อ Admin ทั้งหมด (พร้อมสถานะออนไลน์)
app.get('/api/admins', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, is_online, created_at FROM admins ORDER BY is_online DESC, id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Get Admins Error:", err.message);
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
    }
});

// API 3: สำหรับเพิ่ม Admin ใหม่
app.post('/api/admins', async (req, res) => {
    try {
        const { username, password, full_name } = req.body;
        
        // เช็คก่อนว่ามี username นี้ในระบบหรือยัง
        const checkExist = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว โปรดใช้ชื่ออื่น' });
        }

        const result = await pool.query(
            'INSERT INTO admins (username, password, full_name) VALUES ($1, $2, $3) RETURNING id, username, full_name',
            [username, password, full_name]
        );
        res.json({ success: true, admin: result.rows[0], message: 'สร้างบัญชีแอดมินใหม่สำเร็จ' });
    } catch (err) {
        console.error("Add Admin Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
    }
});

// API 4: สำหรับดึงข้อมูลโปรไฟล์แอดมินมาแสดง (รายคน)
app.get('/api/admins/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT id, username, full_name, created_at FROM admins WHERE id = $1', [id]);
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).json({ message: 'ไม่พบข้อมูลผู้ดูแลระบบ' });
        }
    } catch (err) {
        console.error("Get Profile Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// API 5: สำหรับแก้ไขโปรไฟล์แอดมิน (อัปเดตชื่อ หรือ เปลี่ยนรหัสผ่าน)
app.put('/api/admins/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, password } = req.body;
        
        let updateQuery;
        let queryParams;

        // ถ้ามีการส่งรหัสผ่านใหม่มาด้วย ให้เปลี่ยนรหัสผ่านด้วย
        if (password && password.trim() !== "") {
            updateQuery = 'UPDATE admins SET full_name = $1, password = $2 WHERE id = $3 RETURNING id, username, full_name';
            queryParams = [full_name, password, id];
        } else {
            // ถ้าไม่ส่งรหัสผ่านมา ให้เปลี่ยนแค่ชื่อ
            updateQuery = 'UPDATE admins SET full_name = $1 WHERE id = $2 RETURNING id, username, full_name';
            queryParams = [full_name, id];
        }

        const result = await pool.query(updateQuery, queryParams);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
        }
        res.json({ success: true, admin: result.rows[0], message: 'อัปเดตข้อมูลโปรไฟล์สำเร็จ' });
    } catch (err) {
        console.error("Update Profile Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' });
    }
});

// ========================================
// 📝 ระบบรายงานอุบัติเหตุ (โครงสร้างใหม่ แยกฟิลด์ชัดเจน)
// ========================================

// 1. API ดึงข้อมูลทั้งหมด
app.get('/api/reports', async (req, res) => {
    try {
        const allReports = await pool.query('SELECT * FROM reports ORDER BY created_at DESC');
        res.json(allReports.rows);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 2. API สร้างข้อมูลใหม่ (พร้อมอัปโหลดรูป)
app.post('/api/reports', upload.array('images', 5), async (req, res) => {
    try {
        // 🌟 เพิ่มการรับค่า student_id และ major แยกต่างหาก
        const { reporter_name, student_id, reporter_role, faculty, major, location, risk_category, description, severity_color } = req.body;
        
        // เอาชื่อไฟล์รูปทั้งหมดมาต่อกันด้วยลูกน้ำ (,) เพื่อเก็บลง Database คอลัมน์เดียว
        const imageFiles = req.files ? req.files.map(file => file.filename).join(',') : null;

        const newReport = await pool.query(
            `INSERT INTO reports 
            (reporter_name, student_id, reporter_role, faculty, major, location, risk_category, description, severity_color, image_path) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [reporter_name, student_id, reporter_role, faculty, major, location, risk_category, description, severity_color, imageFiles]
        );

        res.json(newReport.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error saving report');
    }
});

// 3. API สำหรับลบข้อมูล
app.delete('/api/reports/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. ดึงข้อมูลก่อนลบ เพื่อเช็คว่ามีไฟล์รูปต้องตามไปลบไหม
        const report = await pool.query('SELECT image_path FROM reports WHERE id = $1', [id]);
        
        if (report.rows.length > 0 && report.rows[0].image_path) {
            const imagePaths = report.rows[0].image_path.split(',');
            // วนลูปเช็คและลบไฟล์รูปภาพในโฟลเดอร์ uploads
            imagePaths.forEach(imgPath => {
                const fullPath = path.join(__dirname, 'uploads', imgPath);
                if (fs.existsSync(fullPath)) {
                    fs.unlinkSync(fullPath); 
                }
            });
        }

        // 2. ลบข้อมูลจาก Database จริงๆ
        const deleteQuery = await pool.query('DELETE FROM reports WHERE id = $1', [id]);
        
        if (deleteQuery.rowCount === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
        }
        
        res.json({ message: 'ลบข้อมูลและรูปภาพที่เกี่ยวข้องสำเร็จ' });
    } catch (err) {
        console.error("Error deleting:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
    }
});

// 4. API สำหรับแก้ไข/อัปเดตข้อมูล (PUT)
app.put('/api/reports/:id', upload.array('images', 5), async (req, res) => {
    try {
        const { id } = req.params;
        // 🌟 เพิ่มการรับค่า student_id และ major แยกต่างหาก
        const { reporter_name, student_id, reporter_role, faculty, major, location, risk_category, description, severity_color } = req.body;
        
        // เช็คว่ามีอัปโหลดรูปภาพใหม่มาด้วยไหม
        const imageFiles = req.files && req.files.length > 0 ? req.files.map(file => file.filename).join(',') : null;

        let updateQuery;
        let queryParams;

        // ถ้ามีรูปใหม่มา ให้ทับรูปเดิม ถ้าไม่มีรูปใหม่ ให้เก็บรูปเดิมไว้
        if (imageFiles) {
            updateQuery = `
                UPDATE reports 
                SET reporter_name=$1, student_id=$2, reporter_role=$3, faculty=$4, major=$5, location=$6, risk_category=$7, description=$8, severity_color=$9, image_path=$10 
                WHERE id=$11 RETURNING *`;
            queryParams = [reporter_name, student_id, reporter_role, faculty, major, location, risk_category, description, severity_color, imageFiles, id];
        } else {
            updateQuery = `
                UPDATE reports 
                SET reporter_name=$1, student_id=$2, reporter_role=$3, faculty=$4, major=$5, location=$6, risk_category=$7, description=$8, severity_color=$9 
                WHERE id=$10 RETURNING *`;
            queryParams = [reporter_name, student_id, reporter_role, faculty, major, location, risk_category, description, severity_color, id];
        }

        const updatedReport = await pool.query(updateQuery, queryParams);

        if (updatedReport.rowCount === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
        }
        res.json({ message: 'อัปเดตข้อมูลสำเร็จ', data: updatedReport.rows[0] });
    } catch (err) {
        console.error("Error updating:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Backend Server รันอยู่บนพอร์ต http://localhost:${port}`);
});