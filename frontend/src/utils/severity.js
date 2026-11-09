// ระดับความรุนแรงของเหตุการณ์ที่ส่งผลกระทบต่อบุคคล (ตารางที่ 4)
// ค่าที่บันทึกลงฐานข้อมูล (คอลัมน์ severity_color) คือ `value` เช่น "ระดับ 2 - ปานกลาง"
// color = สีจุด/กราฟ, bg = พื้นหลังป้าย, text = สีตัวอักษรบนพื้นหลังนั้น
export const SEVERITY_LEVELS = [
  { level: 1, name: 'เล็กน้อย', description: 'มีการบาดเจ็บเล็กน้อยในระดับปฐมพยาบาล', color: '#16a34a', bg: '#dcfce7', text: '#166534' },
  { level: 2, name: 'ปานกลาง', description: 'มีการบาดเจ็บที่ต้องได้รับการรักษาทางการแพทย์', color: '#eab308', bg: '#fef9c3', text: '#854d0e' },
  { level: 3, name: 'สูง', description: 'มีการบาดเจ็บหรือเจ็บป่วยที่รุนแรง', color: '#ea580c', bg: '#ffedd5', text: '#9a3412' },
  { level: 4, name: 'สูงมาก', description: 'ทุพพลภาพหรือเสียชีวิต', color: '#991b1b', bg: '#fee2e2', text: '#991b1b' },
].map(s => ({
  ...s,
  label: `ระดับ ${s.level} · ${s.name}`,
  value: `ระดับ ${s.level} - ${s.name}`,
}));

export const UNKNOWN_SEVERITY = {
  level: 0, name: 'ไม่ระบุ', label: 'ไม่ระบุ', value: '', description: '',
  color: '#94a3b8', bg: '#f1f5f9', text: '#475569',
};

export const DEFAULT_SEVERITY_VALUE = SEVERITY_LEVELS[0].value;

// ข้อมูลเก่า (ระบบ 3 ระดับแบบอีโมจิ) แปลงเป็นระดับใหม่: ต่ำ → 1, เฝ้าระวัง → 2, วิกฤต → 3
// ลำดับสำคัญ: ข้อความเก่าของระดับต่ำมีคำว่า "เฝ้าระวัง" อยู่ด้วย จึงต้องเช็คอีโมจิก่อน
const LEGACY_KEYS = [
  ['\u{1F534}', 3], ['\u{1F7E1}', 2], ['\u{1F7E2}', 1],
  ['วิกฤต', 3], ['ต่ำ', 1], ['เฝ้าระวัง', 2],
];

export const getSeverity = (raw) => {
  const str = String(raw || '');
  const match = str.match(/ระดับ\s*([1-4])/);
  if (match) return SEVERITY_LEVELS[Number(match[1]) - 1];
  const legacy = LEGACY_KEYS.find(([key]) => str.includes(key));
  return legacy ? SEVERITY_LEVELS[legacy[1] - 1] : UNKNOWN_SEVERITY;
};

// ข้อความสำหรับแสดงผล/Export: ถ้าอ่านระดับไม่ได้ ให้แสดงค่าดิบที่บันทึกไว้
export const getSeverityLabel = (raw) => {
  const s = getSeverity(raw);
  return s.level ? s.label : (raw || UNKNOWN_SEVERITY.label);
};

// ใช้ตอนโหลดข้อมูลเข้าฟอร์มแก้ไข ให้ค่าเก่ากลายเป็นค่ารูปแบบใหม่
export const normalizeSeverityValue = (raw) => getSeverity(raw).value || DEFAULT_SEVERITY_VALUE;
