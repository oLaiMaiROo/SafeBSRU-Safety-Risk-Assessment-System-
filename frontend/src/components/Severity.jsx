import { SEVERITY_LEVELS, getSeverity, getSeverityLabel } from '../utils/severity';
import './severity.css';

// จุดสีแบน ๆ แทนอีโมจิ 🟢🟡🔴
export const SeverityDot = ({ color, size = 10 }) => (
  <span
    aria-hidden="true"
    style={{ display: 'inline-block', width: size, height: size, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }}
  />
);

const BADGE_SIZES = {
  sm: { fontSize: '12px', padding: '5px 10px' },
  md: { fontSize: '13px', padding: '6px 12px' },
  lg: { fontSize: '14px', padding: '8px 16px' },
};

export const SeverityBadge = ({ value, size = 'md' }) => {
  const s = getSeverity(value);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '8px', borderRadius: '999px', fontWeight: 600,
      backgroundColor: s.bg, color: s.text, whiteSpace: 'nowrap', ...BADGE_SIZES[size],
    }}>
      <SeverityDot color={s.color} size={8} />
      {getSeverityLabel(value)}
    </span>
  );
};

// ตัวเลือกระดับความรุนแรง 4 ระดับ (ใช้ radio จริง จึงกด Tab/ลูกศรได้)
export const SeverityPicker = ({ name, value, onChange }) => {
  const current = getSeverity(value).level;
  return (
    <div role="radiogroup" aria-label="ระดับความรุนแรง" className="severity-picker">
      {SEVERITY_LEVELS.map(s => {
        const checked = current === s.level;
        return (
          <label
            key={s.level}
            className="severity-option"
            style={checked ? { borderColor: s.color, backgroundColor: s.bg, boxShadow: `0 0 0 1px ${s.color}` } : undefined}
          >
            <input type="radio" name={name} value={s.value} checked={checked} onChange={onChange} />
            <span className="severity-option-title" style={{ color: checked ? s.text : '#1e293b' }}>
              <SeverityDot color={s.color} /> ระดับ {s.level} · {s.name}
            </span>
            <span className="severity-option-desc">{s.description}</span>
          </label>
        );
      })}
    </div>
  );
};
