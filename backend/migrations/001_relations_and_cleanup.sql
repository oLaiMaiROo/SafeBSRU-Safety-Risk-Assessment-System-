-- 001_relations_and_cleanup.sql  (9 พ.ย. 2569)
-- ปรับโครงสร้างฐานข้อมูล safety_db ให้มีความสัมพันธ์ระหว่างตารางและข้อมูลถูกต้องขึ้น
--
--   departments      ตารางใหม่: รายชื่อคณะ / สำนัก / หน่วยงาน (เดิมเขียนไว้ในโค้ดหน้าเว็บ)
--   severity_levels  ตารางใหม่: ระดับความรุนแรง 1-4 ตามตารางที่ 4
--   report_images    ตารางใหม่: รูปประกอบรายงาน 1 แถวต่อ 1 รูป (เดิมเก็บชื่อไฟล์คั่นด้วยจุลภาคในคอลัมน์เดียว)
--   reports          + incident_date, reporter_type, student_year, position,
--                      department_id (FK), severity_level (FK), handled_by (FK -> admins)
--                    - reporter_role, faculty, severity_color, image_path (ย้ายข้อมูลไปคอลัมน์/ตารางใหม่แล้ว)
--   admins           เก็บรหัสผ่านแบบเข้ารหัส bcrypt ในคอลัมน์ password_hash แทนข้อความธรรมดา
--
-- ทั้งไฟล์อยู่ใน transaction เดียว ถ้าคำสั่งไหนผิด ฐานข้อมูลจะกลับเป็นเหมือนเดิมทั้งหมด
-- วิธีย้อนกลับหลังรันสำเร็จ: กู้จากไฟล์ backup ใน db-backups/ (ดู migrations/README.md)

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------
-- 1. หน่วยงาน
-- ---------------------------------------------------------------
CREATE TABLE departments (
    id          SERIAL       PRIMARY KEY,
    name        VARCHAR(150) NOT NULL UNIQUE,
    group_name  VARCHAR(100) NOT NULL,
    sort_order  SMALLINT     NOT NULL DEFAULT 0
);

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

-- ชื่อหน่วยงานในรายงานเก่าที่ไม่อยู่ในรายการ: เพิ่มเป็นหน่วยงานใหม่ ไม่ทิ้งข้อมูล
INSERT INTO departments (name, group_name, sort_order)
SELECT DISTINCT trim(faculty), 'อื่นๆ (ข้อมูลเดิม)', 900
FROM reports
WHERE trim(coalesce(faculty, '')) <> ''
  AND trim(faculty) NOT IN (SELECT name FROM departments);

-- ---------------------------------------------------------------
-- 2. ระดับความรุนแรง (ตารางที่ 4)
-- ---------------------------------------------------------------
CREATE TABLE severity_levels (
    level        SMALLINT     PRIMARY KEY CHECK (level BETWEEN 1 AND 4),
    name         VARCHAR(50)  NOT NULL UNIQUE,
    description  VARCHAR(255) NOT NULL
);

INSERT INTO severity_levels (level, name, description) VALUES
    (1, 'เล็กน้อย', 'มีการบาดเจ็บเล็กน้อยในระดับปฐมพยาบาล'),
    (2, 'ปานกลาง', 'มีการบาดเจ็บที่ต้องได้รับการรักษาทางการแพทย์'),
    (3, 'สูง',      'มีการบาดเจ็บหรือเจ็บป่วยที่รุนแรง'),
    (4, 'สูงมาก',   'ทุพพลภาพหรือเสียชีวิต');

-- ---------------------------------------------------------------
-- 3. รูปประกอบรายงาน (1 แถวต่อ 1 รูป)
-- ---------------------------------------------------------------
CREATE TABLE report_images (
    id          SERIAL       PRIMARY KEY,
    report_id   INTEGER      NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO report_images (report_id, file_name)
SELECT r.id, trim(f.file_name)
FROM reports r
CROSS JOIN LATERAL unnest(string_to_array(r.image_path, ',')) WITH ORDINALITY AS f(file_name, ord)
WHERE trim(coalesce(r.image_path, '')) <> ''
  AND trim(f.file_name) <> ''
ORDER BY r.id, f.ord;

-- ---------------------------------------------------------------
-- 4. reports: คอลัมน์ใหม่ + ย้ายข้อมูลเดิม
-- ---------------------------------------------------------------
ALTER TABLE reports
    ADD COLUMN reporter_type  VARCHAR(20),
    ADD COLUMN student_year   SMALLINT,
    ADD COLUMN position       VARCHAR(100),
    ADD COLUMN department_id  INTEGER,
    ADD COLUMN incident_date  DATE,
    ADD COLUMN severity_level SMALLINT,
    ADD COLUMN handled_by     INTEGER;

UPDATE reports SET
    -- reporter_role เดิมเก็บรวมกัน เช่น "นักศึกษาชั้นปี 3" หรือชื่อตำแหน่งของบุคลากร
    reporter_type = CASE WHEN reporter_role LIKE 'นักศึกษา%' THEN 'student' ELSE 'personnel' END,
    student_year  = CASE WHEN reporter_role ~ '^นักศึกษาชั้นปี\s*[1-8]$'
                         THEN substring(reporter_role FROM '([1-8])$')::SMALLINT END,
    position      = CASE WHEN reporter_role LIKE 'นักศึกษา%' THEN NULL
                         ELSE NULLIF(NULLIF(trim(reporter_role), ''), 'บุคลากร') END,
    -- ฟอร์มเดิมไม่ได้บันทึกวันที่เกิดเหตุ ใช้วันที่บันทึกรายงานแทน
    incident_date = created_at::DATE,
    -- ระดับเดิมแบบอีโมจิ 3 ระดับ: ต่ำ -> 1, เฝ้าระวัง -> 2, วิกฤต -> 3
    severity_level = CASE
        WHEN severity_color ~ 'ระดับ\s*[1-4]' THEN substring(severity_color FROM 'ระดับ\s*([1-4])')::SMALLINT
        WHEN severity_color LIKE '%🔴%' OR severity_color LIKE '%วิกฤต%' THEN 3
        WHEN severity_color LIKE '%🟡%' THEN 2
        WHEN severity_color LIKE '%🟢%' OR severity_color LIKE '%ต่ำ%' THEN 1
        WHEN severity_color LIKE '%เฝ้าระวัง%' THEN 2
        ELSE 1
    END;

UPDATE reports r SET department_id = d.id
FROM departments d
WHERE d.name = trim(r.faculty);

-- รายงานที่ไม่มีหน่วยงานเลย จัดไว้ที่ "อื่นๆ"
UPDATE reports SET department_id = (SELECT id FROM departments WHERE name = 'อื่นๆ')
WHERE department_id IS NULL;

-- บุคลากรไม่มีรหัสนักศึกษา/ชั้นปีแล้ว (ช่องรหัสบุคลากรถูกเอาออกจากฟอร์ม)
UPDATE reports SET student_id = NULL, student_year = NULL WHERE reporter_type = 'personnel';
UPDATE reports SET student_id = NULLIF(trim(student_id), ''), major = NULLIF(trim(major), '');

UPDATE reports SET status = 'รอดำเนินการ'
WHERE status IS NULL OR status NOT IN ('รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น');
UPDATE reports SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

-- ---------------------------------------------------------------
-- 5. reports: ข้อบังคับ (constraint) และความสัมพันธ์
-- ---------------------------------------------------------------
ALTER TABLE reports
    ALTER COLUMN reporter_name  SET NOT NULL,
    ALTER COLUMN reporter_type  SET NOT NULL,
    ALTER COLUMN department_id  SET NOT NULL,
    ALTER COLUMN incident_date  SET NOT NULL,
    ALTER COLUMN incident_date  SET DEFAULT CURRENT_DATE,
    ALTER COLUMN severity_level SET NOT NULL,
    ALTER COLUMN status         SET NOT NULL,
    ALTER COLUMN created_at     SET NOT NULL,
    ADD CONSTRAINT reports_reporter_type_check
        CHECK (reporter_type IN ('student', 'personnel')),
    ADD CONSTRAINT reports_student_year_check
        CHECK (student_year BETWEEN 1 AND 8),
    ADD CONSTRAINT reports_reporter_fields_check CHECK (
        (reporter_type = 'student'   AND position IS NULL) OR
        (reporter_type = 'personnel' AND student_id IS NULL AND student_year IS NULL)
    ),
    ADD CONSTRAINT reports_status_check
        CHECK (status IN ('รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น')),
    ADD CONSTRAINT reports_department_id_fkey
        FOREIGN KEY (department_id) REFERENCES departments(id),
    ADD CONSTRAINT reports_severity_level_fkey
        FOREIGN KEY (severity_level) REFERENCES severity_levels(level),
    ADD CONSTRAINT reports_handled_by_fkey
        FOREIGN KEY (handled_by) REFERENCES admins(id) ON DELETE SET NULL;

ALTER TABLE reports
    DROP COLUMN reporter_role,
    DROP COLUMN faculty,
    DROP COLUMN severity_color,
    DROP COLUMN image_path;

CREATE INDEX reports_department_id_idx   ON reports (department_id);
CREATE INDEX reports_severity_level_idx  ON reports (severity_level);
CREATE INDEX reports_handled_by_idx      ON reports (handled_by);
CREATE INDEX reports_incident_date_idx   ON reports (incident_date);
CREATE INDEX report_images_report_id_idx ON report_images (report_id);

-- ---------------------------------------------------------------
-- 6. admins: เข้ารหัสรหัสผ่านด้วย bcrypt
-- ---------------------------------------------------------------
ALTER TABLE admins ADD COLUMN password_hash VARCHAR(100);
UPDATE admins SET password_hash = crypt(password, gen_salt('bf', 10));

-- ตรวจว่ารหัสผ่านเดิมทุกบัญชียังเข้าสู่ระบบได้ ก่อนลบคอลัมน์เดิม
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM admins
        WHERE password_hash IS NULL OR crypt(password, password_hash) <> password_hash
    ) THEN
        RAISE EXCEPTION 'เข้ารหัสรหัสผ่านไม่สำเร็จ ยกเลิกการเปลี่ยนแปลงทั้งหมด';
    END IF;
END
$$;

UPDATE admins SET is_online = false WHERE is_online IS NULL;
UPDATE admins SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL;

ALTER TABLE admins
    ALTER COLUMN password_hash SET NOT NULL,
    ALTER COLUMN is_online     SET NOT NULL,
    ALTER COLUMN created_at    SET NOT NULL,
    DROP COLUMN password;

COMMIT;
