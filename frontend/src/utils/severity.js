// ระดับความรุนแรงของเหตุการณ์ที่ส่งผลกระทบต่อบุคคล (ตารางที่ 4)
// ฐานข้อมูลเก็บเป็นเลขระดับในคอลัมน์ reports.severity_level ซึ่งอ้างอิงตาราง severity_levels
// ชื่อและคำอธิบายด้านล่างต้องตรงกับตาราง severity_levels ส่วนสีเป็นเรื่องการแสดงผลจึงอยู่ที่หน้าเว็บ
// color = สีจุด/กราฟ, bg = พื้นหลังป้าย, text = สีตัวอักษรบนพื้นหลังนั้น
export const SEVERITY_LEVELS = [
  { level: 1, name: 'เล็กน้อย', description: 'มีการบาดเจ็บเล็กน้อยในระดับปฐมพยาบาล', color: '#16a34a', bg: '#dcfce7', text: '#166534' },
  { level: 2, name: 'ปานกลาง', description: 'มีการบาดเจ็บที่ต้องได้รับการรักษาทางการแพทย์', color: '#eab308', bg: '#fef9c3', text: '#854d0e' },
  { level: 3, name: 'สูง', description: 'มีการบาดเจ็บหรือเจ็บป่วยที่รุนแรง', color: '#ea580c', bg: '#ffedd5', text: '#9a3412' },
  { level: 4, name: 'สูงมาก', description: 'ทุพพลภาพหรือเสียชีวิต', color: '#991b1b', bg: '#fee2e2', text: '#991b1b' },
].map(s => ({ ...s, label: `ระดับ ${s.level} · ${s.name}` }));

export const UNKNOWN_SEVERITY = {
  level: 0, name: 'ไม่ระบุ', label: 'ไม่ระบุ', description: '',
  color: '#94a3b8', bg: '#f1f5f9', text: '#475569',
};

export const DEFAULT_SEVERITY_LEVEL = 1;

// รับเลขระดับ (1-4) เป็นตัวเลขหรือข้อความ เช่น 3 หรือ "3"
export const getSeverity = (level) => SEVERITY_LEVELS.find(s => s.level === Number(level)) || UNKNOWN_SEVERITY;

export const getSeverityLabel = (level) => getSeverity(level).label;
