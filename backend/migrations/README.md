# การปรับโครงสร้างฐานข้อมูล (migrations)

ไฟล์ `.sql` ในโฟลเดอร์นี้คือการเปลี่ยนโครงสร้างฐานข้อมูล `safety_db` รันตามลำดับเลข ไฟล์ละครั้งเดียว

| ไฟล์ | สิ่งที่ทำ |
|---|---|
| `001_relations_and_cleanup.sql` | เพิ่มตาราง `departments`, `severity_levels`, `report_images` และ foreign key ของ `reports`, เพิ่ม `incident_date` และ `handled_by`, แยกข้อมูลผู้แจ้ง, เข้ารหัสรหัสผ่านแอดมินด้วย bcrypt, ลบคอลัมน์เดิมที่ย้ายข้อมูลแล้ว |

แผนภาพและพจนานุกรมข้อมูลอยู่ที่ `docs/er-diagram.png`

## ก่อนรัน: สำรองฐานข้อมูล

ทุกไฟล์รันใน transaction เดียว ถ้าคำสั่งไหนผิด ฐานข้อมูลจะไม่ถูกเปลี่ยนเลย แต่ถ้ารันสำเร็จแล้วอยากย้อนกลับ ต้องใช้ไฟล์ backup
(โปรแกรมจะถามรหัสผ่าน PostgreSQL)

```bash
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -Fc -d safety_db -f db-backups\safety_db_backup.dump
```

โฟลเดอร์ `db-backups/` ไม่ขึ้น git เพราะมีข้อมูลจริง

## รัน migration

ในโฟลเดอร์ `backend` (ค่าการเชื่อมต่ออ่านจาก `backend/.env`):

```bash
node migrate.js migrations/001_relations_and_cleanup.sql
```

## ย้อนกลับ

1. หยุด backend
2. สร้างฐานข้อมูลใหม่จากไฟล์ backup:

```bash
"C:\Program Files\PostgreSQL\18\bin\dropdb.exe" -U postgres safety_db
"C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres safety_db
"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -d safety_db db-backups\safety_db_before_redesign_2026-11-09.dump
```

3. ย้อนโค้ดกลับเป็นเวอร์ชันก่อนปรับฐานข้อมูลด้วย git (โค้ดใหม่ใช้กับโครงสร้างเดิมไม่ได้)

รหัสผ่านแอดมินในไฟล์ backup เป็นแบบเดิม (ยังไม่เข้ารหัส) จึงใช้ล็อกอินกับโค้ดเวอร์ชันเดิมได้ทันที
