const express = require('express');
const cors = require('cors');
const multer = require('multer'); // ตัวช่วยรับไฟล์รูป
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const pool = require('./db'); // การเชื่อมต่อฐานข้อมูล (ค่าอยู่ในไฟล์ .env)

const app = express();
const port = Number(process.env.PORT) || 5000;

app.use(cors());
app.use(express.json());
// Express 5 ไม่สร้าง req.body ถ้าคำขอไม่มี body กันไม่ให้ handler พังตอนอ่านค่า
app.use((req, res, next) => {
    if (req.body === undefined) req.body = {};
    next();
});

// โฟลเดอร์เก็บรูปภาพ อ้างอิงจากตำแหน่งไฟล์นี้ จึงรันเซิร์ฟเวอร์จากโฟลเดอร์ไหนก็ได้
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

// เปิดให้ Frontend โหลดรูปในโฟลเดอร์ uploads ไปแสดงผลได้
app.use('/uploads', express.static(UPLOAD_DIR));

// ตั้งชื่อไฟล์ไม่ให้ซ้ำกัน
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, UPLOAD_DIR); },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

pool.query('SELECT 1')
    .then(() => console.log(`✅ เชื่อมต่อฐานข้อมูล PostgreSQL (${process.env.DB_NAME || 'safety_db'}) สำเร็จแล้ว!`))
    .catch((err) => console.error('❌ เชื่อมต่อฐานข้อมูลไม่สำเร็จ:', err.message));

// ========================================
// 🔑 การยืนยันตัวตนผู้ดูแลระบบ (token แบบ JWT)
// ========================================

// กุญแจเซ็น token อยู่ใน .env (JWT_SECRET) ถ้าไม่ได้ตั้งไว้ จะสุ่มใหม่ทุกครั้งที่เปิดเซิร์ฟเวอร์ (แอดมินต้องล็อกอินใหม่หลังรีสตาร์ต)
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(48).toString('hex');
if (!process.env.JWT_SECRET) {
    console.warn('⚠️ ยังไม่ได้ตั้ง JWT_SECRET ในไฟล์ .env ระบบสุ่มกุญแจชั่วคราวให้ แอดมินต้องล็อกอินใหม่ทุกครั้งที่รีสตาร์ตเซิร์ฟเวอร์');
}
const TOKEN_LIFETIME = '8h';

const signToken = (admin) => jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: TOKEN_LIFETIME });

const readToken = (req) => {
    const header = req.headers.authorization || '';
    const match = /^Bearer\s+(.+)$/i.exec(header);
    if (!match) return null;
    try {
        return jwt.verify(match[1], JWT_SECRET);
    } catch {
        return null;
    }
};

// ใช้กับ API ที่เฉพาะผู้ดูแลระบบเรียกได้ (ตรวจด้วยว่าบัญชียังอยู่ในระบบ)
const requireAdmin = async (req, res, next) => {
    const payload = readToken(req);
    if (!payload) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
    try {
        const found = await pool.query('SELECT id, username FROM admins WHERE id = $1', [payload.id]);
        if (found.rows.length === 0) return res.status(401).json({ error: 'ไม่พบบัญชีผู้ดูแลระบบนี้ กรุณาเข้าสู่ระบบใหม่' });
        req.admin = found.rows[0];
        next();
    } catch (err) {
        console.error('Auth Error:', err.message);
        res.status(500).json({ error: 'ตรวจสอบการเข้าสู่ระบบไม่สำเร็จ' });
    }
};

// ========================================
// ตัวช่วยทั่วไป
// ========================================

// ข้อความว่าง/ช่องว่างล้วน ให้เป็น null
const text = (value) => {
    if (value === undefined || value === null) return null;
    const trimmed = String(value).trim();
    return trimmed === '' ? null : trimmed;
};

// ตัวเลขจำนวนเต็มบวก ถ้าไม่ใช่ให้เป็น null
const int = (value) => {
    const t = text(value);
    return t !== null && /^\d+$/.test(t) ? Number(t) : null;
};

// วันที่ของวันนี้ตามเวลาเครื่อง ในรูปแบบ YYYY-MM-DD
const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const removeFiles = (fileNames) => {
    fileNames.forEach((name) => {
        const fullPath = path.join(UPLOAD_DIR, path.basename(name));
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    });
};

// แปลง error จาก PostgreSQL ที่เกิดจากข้อมูลผิด ให้เป็นข้อความที่บอกผู้ใช้ได้ (HTTP 400)
const DB_ERROR_MESSAGES = {
    '23502': 'กรอกข้อมูลที่จำเป็นไม่ครบ',
    '23503': 'ข้อมูลอ้างอิงไม่ถูกต้อง (หน่วยงาน หรือระดับความรุนแรง)',
    '23505': 'ข้อมูลนี้มีอยู่ในระบบแล้ว',
    '23514': 'ข้อมูลไม่อยู่ในรูปแบบที่ระบบรับได้',
    '22007': 'รูปแบบวันที่ไม่ถูกต้อง',
    '22008': 'รูปแบบวันที่ไม่ถูกต้อง',
    '22P02': 'รูปแบบข้อมูลไม่ถูกต้อง',
};
const sendError = (res, err, fallback) => {
    const message = DB_ERROR_MESSAGES[err.code];
    if (message) return res.status(400).json({ error: message });
    console.error(fallback, err.message);
    return res.status(500).json({ error: fallback });
};

// ========================================
// 🔐 ระบบจัดการ Admin (รหัสผ่านเก็บแบบเข้ารหัส bcrypt ด้วย pgcrypto)
// ========================================

// API 1: สำหรับล็อกอิน (Login) + ตั้งสถานะเป็น Online
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await pool.query(
            'SELECT id, username, full_name FROM admins WHERE username = $1 AND password_hash = crypt($2, password_hash)',
            [text(username), String(password ?? '')]
        );

        if (result.rows.length > 0) {
            const adminData = result.rows[0];
            await pool.query('UPDATE admins SET is_online = true WHERE id = $1', [adminData.id]);
            // token ใช้แนบไปกับทุกคำขอของหน้าแอดมิน (Authorization: Bearer <token>)
            res.json({ success: true, admin: adminData, token: signToken(adminData), message: 'เข้าสู่ระบบสำเร็จ' });
        } else {
            res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});

// API 1.5: สำหรับล็อกเอาต์ (Logout) + ตั้งสถานะเป็น Offline
// token หมดอายุแล้วก็ออกจากระบบได้ ตั้ง offline ให้เฉพาะเมื่อ token ยังใช้ได้
app.post('/api/logout', async (req, res) => {
    try {
        const payload = readToken(req);
        if (payload) {
            await pool.query('UPDATE admins SET is_online = false WHERE id = $1', [payload.id]);
        }
        res.json({ success: true, message: 'ออกจากระบบสำเร็จ' });
    } catch (err) {
        console.error("Logout Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการออกจากระบบ' });
    }
});

// API 2: ดึงรายชื่อ Admin ทั้งหมด (พร้อมสถานะออนไลน์)
app.get('/api/admins', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, username, full_name, is_online, created_at FROM admins ORDER BY is_online DESC, id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error("Get Admins Error:", err.message);
        res.status(500).json({ error: 'ดึงข้อมูลไม่สำเร็จ' });
    }
});

// API 3: สำหรับเพิ่ม Admin ใหม่
app.post('/api/admins', requireAdmin, async (req, res) => {
    try {
        const username = text(req.body.username);
        const password = String(req.body.password ?? '');
        const fullName = text(req.body.full_name);
        if (!username || password.trim() === '') {
            return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
        }

        const checkExist = await pool.query('SELECT 1 FROM admins WHERE username = $1', [username]);
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว โปรดใช้ชื่ออื่น' });
        }

        const result = await pool.query(
            "INSERT INTO admins (username, password_hash, full_name) VALUES ($1, crypt($2, gen_salt('bf', 10)), $3) RETURNING id, username, full_name",
            [username, password, fullName]
        );
        res.json({ success: true, admin: result.rows[0], message: 'สร้างบัญชีแอดมินใหม่สำเร็จ' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว โปรดใช้ชื่ออื่น' });
        }
        console.error("Add Admin Error:", err.message);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างบัญชี' });
    }
});

// API 4: สำหรับดึงข้อมูลโปรไฟล์แอดมินมาแสดง (รายคน)
app.get('/api/admins/:id', requireAdmin, async (req, res) => {
    try {
        const id = int(req.params.id);
        if (!id) return res.status(404).json({ message: 'ไม่พบข้อมูลผู้ดูแลระบบ' });
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

// API 5: สำหรับแก้ไขโปรไฟล์แอดมิน (อัปเดตชื่อ หรือ เปลี่ยนรหัสผ่าน) แก้ได้เฉพาะบัญชีของตัวเอง
app.put('/api/admins/:id', requireAdmin, async (req, res) => {
    try {
        const id = int(req.params.id);
        const fullName = text(req.body.full_name);
        const password = String(req.body.password ?? '');
        if (!id) return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการแก้ไข" });
        if (id !== req.admin.id) return res.status(403).json({ message: 'แก้ไขได้เฉพาะโปรไฟล์ของตัวเอง' });

        let result;
        if (password.trim() !== '') {
            result = await pool.query(
                "UPDATE admins SET full_name = $1, password_hash = crypt($2, gen_salt('bf', 10)) WHERE id = $3 RETURNING id, username, full_name",
                [fullName, password, id]
            );
        } else {
            result = await pool.query('UPDATE admins SET full_name = $1 WHERE id = $2 RETURNING id, username, full_name', [fullName, id]);
        }

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
// 🏢 ข้อมูลอ้างอิง
// ========================================

app.get('/api/departments', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, group_name FROM departments ORDER BY sort_order, id');
        res.json(result.rows);
    } catch (err) {
        sendError(res, err, 'ดึงรายชื่อหน่วยงานไม่สำเร็จ');
    }
});

app.get('/api/severity-levels', async (req, res) => {
    try {
        const result = await pool.query('SELECT level, name, description FROM severity_levels ORDER BY level');
        res.json(result.rows);
    } catch (err) {
        sendError(res, err, 'ดึงระดับความรุนแรงไม่สำเร็จ');
    }
});

// ========================================
// 📝 ระบบรายงานอุบัติเหตุ
// ========================================

// ข้อมูลรายงานพร้อมชื่อหน่วยงาน ระดับความรุนแรง และรายชื่อไฟล์รูป
const REPORT_SELECT = `
    SELECT r.id, r.reporter_name, r.reporter_type, r.student_id, r.student_year, r.position,
           CASE WHEN r.reporter_type = 'student'
                THEN 'นักศึกษา' || COALESCE('ชั้นปี ' || r.student_year, '')
                ELSE COALESCE(r.position, 'บุคลากร') END AS reporter_role,
           r.department_id, d.name AS department_name, d.group_name AS department_group, r.major,
           r.incident_date, r.location, r.risk_category, r.description,
           r.severity_level, s.name AS severity_name,
           r.created_at,
           COALESCE((SELECT json_agg(i.file_name ORDER BY i.id) FROM report_images i WHERE i.report_id = r.id), '[]'::json) AS images
    FROM reports r
    JOIN departments d ON d.id = r.department_id
    JOIN severity_levels s ON s.level = r.severity_level`;

const findReport = async (id) => {
    const result = await pool.query(`${REPORT_SELECT} WHERE r.id = $1`, [id]);
    return result.rows[0];
};

// ตรวจข้อมูลจากฟอร์มแจ้งเหตุ/แก้ไข คืนค่า { data } หรือ { error }
const readReportForm = (body) => {
    const reporterType = body.reporter_type === 'personnel' ? 'personnel' : 'student';
    const data = {
        reporter_name: text(body.reporter_name),
        reporter_type: reporterType,
        student_id: reporterType === 'student' ? text(body.student_id) : null,
        student_year: reporterType === 'student' ? int(body.student_year) : null,
        position: reporterType === 'personnel' ? text(body.position) : null,
        department_id: int(body.department_id),
        major: text(body.major),
        incident_date: text(body.incident_date),
        location: text(body.location),
        risk_category: text(body.risk_category),
        description: text(body.description),
        severity_level: int(body.severity_level),
    };

    if (!data.reporter_name) return { error: 'กรุณากรอกชื่อ-นามสกุลผู้แจ้ง' };
    if (reporterType === 'personnel' && !data.position) return { error: 'กรุณากรอกตำแหน่งของบุคลากร' };
    if (data.student_year !== null && (data.student_year < 1 || data.student_year > 8)) return { error: 'ชั้นปีต้องอยู่ระหว่าง 1 ถึง 8' };
    if (!data.department_id) return { error: 'กรุณาเลือกหน่วยงานที่สังกัด' };
    if (!data.incident_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.incident_date)) return { error: 'กรุณาระบุวันที่เกิดเหตุ' };
    if (data.incident_date > todayISO()) return { error: 'วันที่เกิดเหตุต้องไม่เกินวันนี้' };
    if (!data.location) return { error: 'กรุณากรอกสถานที่เกิดเหตุ' };
    if (!data.risk_category) return { error: 'กรุณากรอกลักษณะอุบัติเหตุ' };
    if (!data.severity_level) return { error: 'กรุณาเลือกระดับความรุนแรง' };
    return { data };
};

const REPORT_COLUMNS = [
    'reporter_name', 'reporter_type', 'student_id', 'student_year', 'position', 'department_id', 'major',
    'incident_date', 'location', 'risk_category', 'description', 'severity_level',
];

// ทุก API ของรายงาน ยกเว้นการส่งฟอร์มแจ้งเหตุ ต้องเข้าสู่ระบบเป็นผู้ดูแลระบบก่อน

// 1. API ดึงข้อมูลทั้งหมด
app.get('/api/reports', requireAdmin, async (req, res) => {
    try {
        const result = await pool.query(`${REPORT_SELECT} ORDER BY r.created_at DESC, r.id DESC`);
        res.json(result.rows);
    } catch (err) {
        sendError(res, err, 'ดึงข้อมูลรายงานไม่สำเร็จ');
    }
});

// 1.5 API ดึงรายงานรายการเดียว
app.get('/api/reports/:id', requireAdmin, async (req, res) => {
    try {
        const id = int(req.params.id);
        const report = id ? await findReport(id) : null;
        if (!report) return res.status(404).json({ error: 'ไม่พบรายงานนี้' });
        res.json(report);
    } catch (err) {
        sendError(res, err, 'ดึงข้อมูลรายงานไม่สำเร็จ');
    }
});

// 2. API สร้างข้อมูลใหม่ (พร้อมอัปโหลดรูปสูงสุด 5 รูป) ไม่ต้องเข้าสู่ระบบ เพราะเป็นฟอร์มแจ้งเหตุสาธารณะ
app.post('/api/reports', upload.array('images', 5), async (req, res) => {
    const uploaded = (req.files || []).map((file) => file.filename);
    const { data, error } = readReportForm(req.body);
    if (error) {
        removeFiles(uploaded);
        return res.status(400).json({ error });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const placeholders = REPORT_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
        const inserted = await client.query(
            `INSERT INTO reports (${REPORT_COLUMNS.join(', ')}) VALUES (${placeholders}) RETURNING id`,
            REPORT_COLUMNS.map((column) => data[column])
        );
        const reportId = inserted.rows[0].id;
        for (const fileName of uploaded) {
            await client.query('INSERT INTO report_images (report_id, file_name) VALUES ($1, $2)', [reportId, fileName]);
        }
        await client.query('COMMIT');
        res.status(201).json(await findReport(reportId));
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        removeFiles(uploaded);
        sendError(res, err, 'บันทึกรายงานไม่สำเร็จ');
    } finally {
        client?.release();
    }
});

// 3. API สำหรับลบข้อมูล (แถวใน report_images ถูกลบตามอัตโนมัติด้วย ON DELETE CASCADE)
app.delete('/api/reports/:id', requireAdmin, async (req, res) => {
    try {
        const id = int(req.params.id);
        if (!id) return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });

        const images = await pool.query('SELECT file_name FROM report_images WHERE report_id = $1', [id]);
        const deleted = await pool.query('DELETE FROM reports WHERE id = $1', [id]);
        if (deleted.rowCount === 0) {
            return res.status(404).json({ message: "ไม่พบข้อมูลที่ต้องการลบ" });
        }

        removeFiles(images.rows.map((row) => row.file_name));
        res.json({ message: 'ลบข้อมูลและรูปภาพที่เกี่ยวข้องสำเร็จ' });
    } catch (err) {
        sendError(res, err, 'เกิดข้อผิดพลาดในการลบข้อมูล');
    }
});

// 4. API สำหรับแก้ไข/อัปเดตข้อมูล (ถ้าอัปโหลดรูปใหม่ รูปเดิมจะถูกแทนที่และลบไฟล์ทิ้ง)
// ตรวจการเข้าสู่ระบบก่อนรับไฟล์ จะได้ไม่มีไฟล์ค้างจากคำขอที่ไม่ได้รับอนุญาต
app.put('/api/reports/:id', requireAdmin, upload.array('images', 5), async (req, res) => {
    const uploaded = (req.files || []).map((file) => file.filename);
    const id = int(req.params.id);
    const { data, error } = readReportForm(req.body);
    if (!id || error) {
        removeFiles(uploaded);
        return res.status(id ? 400 : 404).json({ error: error || 'ไม่พบรายงานที่ต้องการแก้ไข' });
    }

    let client;
    try {
        client = await pool.connect();
        await client.query('BEGIN');
        const assignments = REPORT_COLUMNS.map((column, i) => `${column} = $${i + 1}`).join(', ');
        const updated = await client.query(
            `UPDATE reports SET ${assignments} WHERE id = $${REPORT_COLUMNS.length + 1}`,
            [...REPORT_COLUMNS.map((column) => data[column]), id]
        );
        if (updated.rowCount === 0) {
            await client.query('ROLLBACK');
            removeFiles(uploaded);
            return res.status(404).json({ error: 'ไม่พบรายงานที่ต้องการแก้ไข' });
        }

        let replacedFiles = [];
        if (uploaded.length > 0) {
            const old = await client.query('DELETE FROM report_images WHERE report_id = $1 RETURNING file_name', [id]);
            replacedFiles = old.rows.map((row) => row.file_name);
            for (const fileName of uploaded) {
                await client.query('INSERT INTO report_images (report_id, file_name) VALUES ($1, $2)', [id, fileName]);
            }
        }
        await client.query('COMMIT');
        removeFiles(replacedFiles);
        res.json({ message: 'อัปเดตข้อมูลสำเร็จ', data: await findReport(id) });
    } catch (err) {
        if (client) await client.query('ROLLBACK').catch(() => {});
        removeFiles(uploaded);
        sendError(res, err, 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
    } finally {
        client?.release();
    }
});

// รับ error ที่หลุดมา เช่น อัปโหลดรูปเกิน 5 รูป
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        const message = err.code === 'LIMIT_UNEXPECTED_FILE' ? 'อัปโหลดรูปได้สูงสุด 5 รูป' : 'อัปโหลดไฟล์ไม่สำเร็จ';
        return res.status(400).json({ error: message });
    }
    console.error('Unhandled Error:', err.message);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในเซิร์ฟเวอร์' });
});

app.listen(port, () => {
    console.log(`🚀 Backend Server รันอยู่บนพอร์ต http://localhost:${port}`);
});
