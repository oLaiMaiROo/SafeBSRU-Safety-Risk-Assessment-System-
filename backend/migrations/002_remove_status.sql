-- 002_remove_status.sql  (9 พ.ย. 2569)
-- ลบระบบสถานะการดำเนินการและผู้รับเรื่องออก เพราะไม่ได้ใช้งาน
--   reports.status      (และ CHECK reports_status_check)
--   reports.handled_by  (และ foreign key ไป admins กับ index reports_handled_by_idx)
-- ข้อบังคับและ index ของคอลัมน์ที่ลบ จะถูกลบตามอัตโนมัติ
-- หลังรันไฟล์นี้ ตาราง admins ใช้สำหรับเข้าสู่ระบบอย่างเดียว ไม่เชื่อมกับ reports แล้ว

BEGIN;

ALTER TABLE reports
    DROP COLUMN handled_by,
    DROP COLUMN status;

COMMIT;
