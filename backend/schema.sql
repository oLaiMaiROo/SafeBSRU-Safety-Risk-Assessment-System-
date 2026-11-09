-- schema.sql  โครงสร้างฐานข้อมูล safety_db ทั้งหมด สำหรับติดตั้งบนเครื่องใหม่ (ฐานข้อมูลว่าง)
--
-- วิธีใช้ (ในโฟลเดอร์ backend):  node setup-db.js
--   สคริปต์จะสร้างฐานข้อมูลถ้ายังไม่มี แล้วรันไฟล์นี้ จากนั้นสร้างแอดมินคนแรกด้วย node create-admin.js
--   ขั้นตอนเต็มอยู่ใน backend/DATABASE.md
--
-- ไฟล์นี้ตรงกับโครงสร้างหลังรัน migrations/001_relations_and_cleanup.sql
-- ถ้าเพิ่ม migration ใหม่ ต้องแก้ไฟล์นี้ให้ตรงกันด้วย
-- ทั้งไฟล์อยู่ใน transaction เดียว ถ้ามีตารางอยู่แล้วจะหยุดทั้งหมดโดยไม่เปลี่ยนอะไร

BEGIN;

-- ใช้ฟังก์ชัน crypt() / gen_salt() เข้ารหัสรหัสผ่านแบบ bcrypt
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------
-- ผู้ดูแลระบบ
-- ---------------------------------------------------------------
CREATE TABLE admins (
    id             SERIAL       PRIMARY KEY,
    username       VARCHAR(50)  NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,            -- bcrypt: crypt(รหัสผ่าน, gen_salt('bf', 10))
    full_name      VARCHAR(100),
    is_online      BOOLEAN      NOT NULL DEFAULT false,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------
-- หน่วยงาน (นักศึกษาเลือกได้เฉพาะกลุ่ม "คณะและวิทยาลัย")
-- ---------------------------------------------------------------
CREATE TABLE departments (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    group_name  VARCHAR(100) NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

-- ---------------------------------------------------------------
-- ระดับความรุนแรง (ตารางที่ 4)
-- ---------------------------------------------------------------
CREATE TABLE severity_levels (
    level        SMALLINT     PRIMARY KEY CHECK (level BETWEEN 1 AND 4),
    name         VARCHAR(50)  NOT NULL UNIQUE,
    description  VARCHAR(255) NOT NULL
);

-- ---------------------------------------------------------------
-- รายการแจ้งเหตุ
-- ---------------------------------------------------------------
CREATE TABLE reports (
    id              SERIAL       PRIMARY KEY,
    reporter_name   VARCHAR(100) NOT NULL,
    reporter_type   VARCHAR(20)  NOT NULL,            -- student | personnel
    student_id      VARCHAR(50),                      -- เฉพาะนักศึกษา
    student_year    SMALLINT,                         -- เฉพาะนักศึกษา
    "position"      VARCHAR(100),                     -- เฉพาะบุคลากร
    department_id   INTEGER      NOT NULL,
    major           VARCHAR(255),
    incident_date   DATE         NOT NULL DEFAULT CURRENT_DATE,
    location        VARCHAR(255) NOT NULL,
    risk_category   VARCHAR(100) NOT NULL,
    description     TEXT,
    severity_level  SMALLINT     NOT NULL,
    status          VARCHAR(50)  NOT NULL DEFAULT 'รอดำเนินการ',
    handled_by      INTEGER,                          -- แอดมินที่รับเรื่อง
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT reports_reporter_type_check
        CHECK (reporter_type IN ('student', 'personnel')),
    CONSTRAINT reports_student_year_check
        CHECK (student_year BETWEEN 1 AND 8),
    CONSTRAINT reports_reporter_fields_check CHECK (
        (reporter_type = 'student'   AND position IS NULL) OR
        (reporter_type = 'personnel' AND student_id IS NULL AND student_year IS NULL)
    ),
    CONSTRAINT reports_status_check
        CHECK (status IN ('รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น')),
    CONSTRAINT reports_department_id_fkey
        FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT reports_severity_level_fkey
        FOREIGN KEY (severity_level) REFERENCES severity_levels(level),
    CONSTRAINT reports_handled_by_fkey
        FOREIGN KEY (handled_by) REFERENCES admins(id) ON DELETE SET NULL
);

-- ---------------------------------------------------------------
-- รูปประกอบรายงาน (1 แถวต่อ 1 รูป ไฟล์อยู่ใน backend/uploads)
-- ---------------------------------------------------------------
CREATE TABLE report_images (
    id          SERIAL       PRIMARY KEY,
    report_id   INTEGER      NOT NULL,
    file_name   VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT report_images_report_id_fkey
        FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

CREATE INDEX reports_department_id_idx   ON reports (department_id);
CREATE INDEX reports_severity_level_idx  ON reports (severity_level);
CREATE INDEX reports_handled_by_idx      ON reports (handled_by);
CREATE INDEX reports_incident_date_idx   ON reports (incident_date);
CREATE INDEX report_images_report_id_idx ON report_images (report_id);

-- ---------------------------------------------------------------
-- ข้อมูลเริ่มต้น
-- ---------------------------------------------------------------
INSERT INTO severity_levels (level, name, description) VALUES
    (1, 'เล็กน้อย', 'มีการบาดเจ็บเล็กน้อยในระดับปฐมพยาบาล'),
    (2, 'ปานกลาง', 'มีการบาดเจ็บที่ต้องได้รับการรักษาทางการแพทย์'),
    (3, 'สูง',      'มีการบาดเจ็บหรือเจ็บป่วยที่รุนแรง'),
    (4, 'สูงมาก',   'ทุพพลภาพหรือเสียชีวิต');

INSERT INTO departments (name, group_name, sort_order) VALUES
    ('คณะวิทยาศาสตร์และเทคโนโลยี',                         'คณะและวิทยาลัย',        1),
    ('คณะครุศาสตร์',                                       'คณะและวิทยาลัย',        2),
    ('คณะมนุษยศาสตร์และสังคมศาสตร์',                        'คณะและวิทยาลัย',        3),
    ('คณะวิทยาการจัดการ',                                   'คณะและวิทยาลัย',        4),
    ('คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม',              'คณะและวิทยาลัย',        5),
    ('วิทยาลัยการดนตรี',                                    'คณะและวิทยาลัย',        6),
    ('คณะสหเวชศาสตร์',                                      'คณะและวิทยาลัย',        7),
    ('คณะพยาบาลศาสตร์',                                     'คณะและวิทยาลัย',        8),
    ('สำนักงานอธิการบดี กองบริหารงานบุคคล',                  'สำนักงานอธิการบดี',      9),
    ('สำนักงานอธิการบดี กองกลาง',                            'สำนักงานอธิการบดี',     10),
    ('สำนักงานอธิการบดี กองอาคารสถานที่และสิ่งแวดล้อม',         'สำนักงานอธิการบดี',     11),
    ('สำนักงานอธิการบดี กองนโยบายและแผน (งานประกันคุณภาพการศึกษา)', 'สำนักงานอธิการบดี', 12),
    ('สำนักงานอธิการบดี กองคลัง (งานพัสดุ)',                   'สำนักงานอธิการบดี',     13),
    ('สำนักส่งเสริมวิชาการและงานทะเบียน',                     'สำนักและหน่วยงาน',      14),
    ('สำนักวิทยบริการและเทคโนโลยีสารสนเทศ',                   'สำนักและหน่วยงาน',      15),
    ('สำนักบริหารกิจการนักศึกษา',                             'สำนักและหน่วยงาน',      16),
    ('สำนักคอมพิวเตอร์',                                     'สำนักและหน่วยงาน',      17),
    ('สำนักประชาสัมพันธ์และสารสนเทศ',                         'สำนักและหน่วยงาน',      18),
    ('สำนักวิเทศสัมพันธ์และเครือข่ายอาเซียน',                   'สำนักและหน่วยงาน',      19),
    ('สำนักศิลปะและวัฒนธรรม',                                'สำนักและหน่วยงาน',      20),
    ('สถาบันวิจัยและพัฒนา',                                  'สำนักและหน่วยงาน',      21),
    ('สำนักงานสภามหาวิทยาลัย',                               'สำนักและหน่วยงาน',      22),
    ('หน่วยงานตรวจสอบภายใน',                                 'สำนักและหน่วยงาน',      23),
    ('สถาบันขงจื่อ',                                         'สถาบัน ศูนย์ และสภา',    24),
    ('สภาวิชาการ',                                          'สถาบัน ศูนย์ และสภา',    25),
    ('สภาคณาจารย์และข้าราชการ',                               'สถาบัน ศูนย์ และสภา',    26),
    ('ศูนย์ส่งเสริมการเรียนรู้และถ่ายทอดนวัตกรรม (PLI BSRU)',      'สถาบัน ศูนย์ และสภา',    27),
    ('ศูนย์สหกิจศึกษาและการศึกษาเชิงบูรณาการกับการทำงาน (CWIE)',   'สถาบัน ศูนย์ และสภา',    28),
    ('ศูนย์ประสานงานรับสมัครนักศึกษาต่างชาติ (IACC)',              'สถาบัน ศูนย์ และสภา',    29),
    ('ศูนย์สร้างสรรค์ภาพลักษณ์ มรภ.บ้านสมเด็จเจ้าพระยา',          'สถาบัน ศูนย์ และสภา',    30),
    ('อื่นๆ',                                               'สถาบัน ศูนย์ และสภา',    31);

COMMIT;
