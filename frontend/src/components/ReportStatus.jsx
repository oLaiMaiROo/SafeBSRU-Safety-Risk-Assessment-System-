import { Clock, Loader, CheckCircle2 } from 'lucide-react';
import { DEFAULT_REPORT_STATUS } from '../utils/reportStatus';

// สถานะใช้ไอคอน + ข้อความ ให้แยกจากป้ายระดับความรุนแรงที่ใช้จุดสี
const STATUS_STYLES = {
  'รอดำเนินการ': { Icon: Clock, bg: '#f1f5f9', text: '#475569' },
  'กำลังดำเนินการ': { Icon: Loader, bg: '#dbeafe', text: '#1d4ed8' },
  'เสร็จสิ้น': { Icon: CheckCircle2, bg: '#d1fae5', text: '#047857' },
};

const SIZES = {
  sm: { fontSize: '12px', padding: '4px 10px', icon: 13 },
  md: { fontSize: '13px', padding: '6px 12px', icon: 14 },
};

export const StatusBadge = ({ status, size = 'md' }) => {
  const label = STATUS_STYLES[status] ? status : DEFAULT_REPORT_STATUS;
  const { Icon, bg, text } = STATUS_STYLES[label];
  const s = SIZES[size];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '999px', fontWeight: 600,
      fontSize: s.fontSize, padding: s.padding, backgroundColor: bg, color: text, whiteSpace: 'nowrap',
    }}>
      <Icon size={s.icon} aria-hidden="true" /> {label}
    </span>
  );
};
