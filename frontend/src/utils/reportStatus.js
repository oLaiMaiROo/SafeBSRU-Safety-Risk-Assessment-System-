// สถานะการดำเนินการของรายงาน (ต้องตรงกับ CHECK constraint ของคอลัมน์ reports.status)
export const REPORT_STATUSES = ['รอดำเนินการ', 'กำลังดำเนินการ', 'เสร็จสิ้น'];
export const DEFAULT_REPORT_STATUS = REPORT_STATUSES[0];
