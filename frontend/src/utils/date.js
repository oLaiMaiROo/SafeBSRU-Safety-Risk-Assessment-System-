// วันที่แบบไม่มีเวลา ('YYYY-MM-DD') ต้องสร้างเป็นเวลาท้องถิ่น
// ถ้าใช้ new Date('2026-09-22') ตรง ๆ จะได้เวลา UTC และวันที่อาจเลื่อนตามโซนเวลา
export const parseDateOnly = (value) => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatThaiDate = (value, options) => {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString('th-TH', options) : '-';
};

const pad = (n) => String(n).padStart(2, '0');

// วันนี้ตามเวลาเครื่องผู้ใช้ (toISOString() ให้วันที่ตามเวลา UTC ซึ่งช่วงตี 0-7 ในไทยจะเป็นวันก่อนหน้า)
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
