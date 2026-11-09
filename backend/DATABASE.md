# ฐานข้อมูล safety_db

PostgreSQL มี 5 ตาราง: `reports` (ตารางหลัก), `departments`, `severity_levels`, `admins` และ `report_images`
แผนภาพอยู่ที่ [`docs/er-diagram.png`](../docs/er-diagram.png)

## ติดตั้งบนเครื่องใหม่

1. ติดตั้ง PostgreSQL (จำรหัสผ่านของผู้ใช้ `postgres` ที่ตั้งตอนติดตั้ง) และ Node.js
2. ในโฟลเดอร์ `backend` รัน `npm install`
3. คัดลอก `.env.example` เป็น `.env` แล้วใส่รหัสผ่าน PostgreSQL ที่ `DB_PASSWORD`
4. สร้างฐานข้อมูลและตารางทั้งหมด (พร้อมรายชื่อหน่วยงานและระดับความรุนแรง):

```bash
node setup-db.js
```

5. สร้างแอดมินคนแรก (แอดมินคนต่อไปเพิ่มจากหน้าเว็บได้):

```bash
node create-admin.js admin รหัสผ่านที่ต้องการ "ชื่อ-นามสกุล"
```

6. เปิด backend ด้วย `npm start` แล้วเปิด frontend (ในโฟลเดอร์ `frontend` รัน `npm install` และ `npm run dev`)

`setup-db.js` จะไม่แตะฐานข้อมูลที่มีตารางอยู่แล้ว รันซ้ำได้โดยไม่เสียหาย

## อัปเดตฐานข้อมูลเดิม

ใช้เฉพาะฐานข้อมูลที่สร้างก่อน พ.ย. 2569 (โครงสร้างเดิมมีแค่ `reports` กับ `admins`) สำรองข้อมูลก่อน (ดูหัวข้อถัดไป) แล้วรัน:

```bash
node migrate.js migrations/001_relations_and_cleanup.sql
```

แต่ละ migration รันใน transaction เดียว ถ้าคำสั่งไหนผิด ฐานข้อมูลจะไม่ถูกเปลี่ยนเลย

## สำรองข้อมูลและย้อนกลับ

โปรแกรมจะถามรหัสผ่าน PostgreSQL ส่วนเลข `18` ในคำสั่งคือเวอร์ชัน PostgreSQL ที่ติดตั้งในเครื่อง

สำรอง:

```bash
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -Fc -d safety_db -f db-backups\safety_db_backup.dump
```

ย้อนกลับจากไฟล์สำรอง (หยุด backend ก่อน):

```bash
"C:\Program Files\PostgreSQL\18\bin\dropdb.exe" -U postgres safety_db
"C:\Program Files\PostgreSQL\18\bin\createdb.exe" -U postgres safety_db
"C:\Program Files\PostgreSQL\18\bin\pg_restore.exe" -U postgres -d safety_db db-backups\safety_db_backup.dump
```

ถ้าย้อนไปก่อนการปรับโครงสร้าง ใช้ไฟล์ `db-backups/safety_db_before_redesign_2026-11-09.dump` และย้อนโค้ดด้วย git ไปที่ commit ก่อนปรับฐานข้อมูลด้วย เพราะโค้ดใหม่ใช้กับโครงสร้างเดิมไม่ได้
โฟลเดอร์ `db-backups/` ไม่ขึ้น git เพราะมีข้อมูลจริง

## ไฟล์ที่เกี่ยวข้อง

| ไฟล์ | ใช้ทำอะไร |
|---|---|
| `schema.sql` | โครงสร้างทั้งหมดสำหรับฐานข้อมูลว่าง (`setup-db.js` ใช้ไฟล์นี้) |
| `migrations/` | การเปลี่ยนโครงสร้างของฐานข้อมูลที่มีข้อมูลอยู่แล้ว รันตามลำดับเลข ไฟล์ละครั้ง |
| `setup-db.js` | สร้างฐานข้อมูลและตารางบนเครื่องใหม่ |
| `create-admin.js` | เพิ่มบัญชีแอดมินจาก command line |
| `migrate.js` | รันไฟล์ migration |
| `db.js` | การเชื่อมต่อฐานข้อมูลที่ทุกไฟล์ใช้ร่วมกัน |
| `.env` / `.env.example` | ค่าการเชื่อมต่อ (`.env` ไม่ขึ้น git) |

ถ้าเพิ่ม migration ใหม่ ต้องแก้ `schema.sql` ให้ได้โครงสร้างเดียวกันด้วย
