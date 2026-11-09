import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, MapPin, AlertCircle, CalendarClock, ShieldAlert, Edit, FileText, X, UserCheck } from 'lucide-react';
import { SeverityBadge } from '../components/Severity';
import { StatusBadge } from '../components/ReportStatus';
import { getSeverity } from '../utils/severity';
import { REPORT_STATUSES } from '../utils/reportStatus';
import { API_URL, imageUrl, readApiError } from '../utils/api';
import { formatThaiDate } from '../utils/date';

const ReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loadState, setLoadState] = useState('loading'); // loading | ready | notfound | error

  const [selectedImage, setSelectedImage] = useState(null);

  // การเปลี่ยนสถานะ: แอดมินที่กดบันทึกจะถูกบันทึกเป็นผู้รับเรื่อง
  const [statusDraft, setStatusDraft] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/reports/${id}`)
      .then(res => {
        if (res.status === 404) throw new Error('notfound');
        if (!res.ok) throw new Error('error');
        return res.json();
      })
      .then(data => {
        setReport(data);
        setStatusDraft(data.status);
        setLoadState('ready');
      })
      .catch(err => {
        if (err.message !== 'notfound') console.error('Error:', err);
        setLoadState(err.message === 'notfound' ? 'notfound' : 'error');
      });
  }, [id]);

  if (!report) {
    const message = loadState === 'loading' ? 'กำลังโหลดข้อมูล...'
      : loadState === 'notfound' ? `ไม่พบรายงาน ID ${id}` : 'โหลดข้อมูลไม่สำเร็จ โปรดตรวจสอบว่าเซิร์ฟเวอร์ทำงานอยู่';
    return <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>{message}</div>;
  }

  const handleExportPDF = () => {
    window.print();
  };

  const handleStatusSave = async () => {
    setSavingStatus(true);
    setStatusMsg(null);
    try {
      const adminUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');
      const response = await fetch(`${API_URL}/api/reports/${report.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDraft, admin_id: adminUser.id })
      });
      if (!response.ok) throw new Error(await readApiError(response, 'อัปเดตสถานะไม่สำเร็จ'));
      const updated = await response.json();
      setReport(updated);
      setStatusDraft(updated.status);
      setStatusMsg({ type: 'success', text: 'อัปเดตสถานะแล้ว' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message === 'Failed to fetch' ? 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้' : err.message });
    } finally {
      setSavingStatus(false);
    }
  };

  const severity = getSeverity(report.severity_level);
  const handlerName = report.handled_by_name || report.handled_by_username;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; }
            .print-container { box-shadow: none !important; border: none !important; padding: 0 !important; }
          }
        `}
      </style>

      <motion.div className="no-print" animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }} transition={{ repeat: Infinity, duration: 15 }} style={{ position: 'absolute', top: '5%', right: '10%', width: '300px', height: '300px', backgroundColor: '#e9d5ff', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5, zIndex: 0 }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', padding: 0 }}>
            <ArrowLeft size={18} /> กลับไปหน้าภาพรวม
          </button>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              onClick={() => navigate(`/report-edit/${report.id}`)} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}
            >
              <Edit size={16} /> แก้ไขข้อมูล
            </button>
            <button 
              onClick={handleExportPDF} 
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: '#3b82f6', border: 'none', borderRadius: '8px', cursor: 'pointer', color: 'white', fontSize: '14px', fontWeight: '500', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)', transition: 'all 0.2s' }}
            >
              <FileText size={16} /> Export PDF
            </button>
          </div>
        </div>

        <div className="print-container" style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: 'clamp(20px, 5vw, 40px)', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', backdropFilter: 'blur(10px)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '25px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert color="#7e22ce" size={28} /> รายละเอียดการแจ้งเหตุ (ID: {report.id})
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px', flexWrap: 'wrap' }}>
                <CalendarClock size={16} /> วันที่เกิดเหตุ {formatThaiDate(report.incident_date, { year: 'numeric', month: 'long', day: 'numeric' })}
                <span style={{ color: '#cbd5e1' }}>|</span> บันทึกเมื่อ {new Date(report.created_at).toLocaleString('th-TH')}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', textAlign: 'right', maxWidth: '260px' }}>
              <SeverityBadge value={report.severity_level} size="lg" />
              {severity.description && <span style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{severity.description}</span>}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', marginBottom: '25px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '14px', color: '#475569' }}>
              <span style={{ fontWeight: 600 }}>สถานะ</span>
              <StatusBadge status={report.status} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <UserCheck size={16} color="#64748b" /> <span style={{ whiteSpace: 'nowrap' }}>ผู้รับเรื่อง:</span> <strong style={{ color: '#0f172a' }}>{handlerName || 'ยังไม่มี'}</strong>
              </span>
            </div>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <label htmlFor="status-select" style={{ fontSize: '13px', color: '#64748b' }}>เปลี่ยนสถานะ</label>
              <select id="status-select" value={statusDraft} onChange={(e) => { setStatusDraft(e.target.value); setStatusMsg(null); }} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: 'white', color: '#1e293b' }}>
                {REPORT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={handleStatusSave} disabled={savingStatus || statusDraft === report.status} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', fontSize: '14px', fontWeight: 600, color: 'white', backgroundColor: '#7e22ce', cursor: savingStatus || statusDraft === report.status ? 'not-allowed' : 'pointer', opacity: savingStatus || statusDraft === report.status ? 0.5 : 1 }}>
                {savingStatus ? 'กำลังบันทึก...' : 'บันทึกสถานะ'}
              </button>
            </div>
            {statusMsg && (
              <div className="no-print" role="status" style={{ flexBasis: '100%', fontSize: '13px', color: statusMsg.type === 'success' ? '#047857' : '#b91c1c' }}>
                {statusMsg.text}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            
            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontWeight: '600' }}>
                <User size={16} /> ข้อมูลผู้แจ้ง
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>ชื่อ-นามสกุล</div>
                  <div style={{ color: '#0f172a', fontWeight: '600', fontSize: '15px', marginTop: '2px' }}>{report.reporter_name || 'ไม่ระบุ'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>รหัสประจำตัว</div>
                  <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '15px', marginTop: '2px' }}>{report.student_id || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>สถานะ / ชั้นปี</div>
                  <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '15px', marginTop: '2px' }}>{report.reporter_role || '-'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>สังกัด / หน่วยงาน</div>
                  <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '15px', marginTop: '2px' }}>{report.department_name || '-'}</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>สาขา / แผนก</div>
                  <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '15px', marginTop: '2px' }}>{report.major || '-'}</div>
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', fontWeight: '600' }}>
                <MapPin size={16} /> สถานที่เกิดเหตุ
              </div>
              <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '16px', lineHeight: '1.5' }}>
                {report.location}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <div style={{ color: '#64748b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontWeight: '600' }}>
              <AlertCircle size={16} /> ลักษณะอุบัติเหตุ และ รายละเอียด
            </div>
            <div style={{ fontWeight: '600', color: '#7e22ce', marginBottom: '8px', fontSize: '16px' }}>{report.risk_category}</div>
            <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', color: '#334155', lineHeight: '1.6', fontSize: '15px' }}>
              {report.description || 'ไม่มีรายละเอียดเพิ่มเติมถูกบันทึกไว้'}
            </div>
          </div>

          <div>
            <div style={{ color: '#64748b', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>รูปภาพประกอบ (คลิกเพื่อดูภาพขยาย):</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
              {report.images?.length > 0 ? (
                report.images.map((imgName, index) => (
                  <motion.img
                    layoutId={`image-${imgName}`}
                    key={imgName}
                    src={imageUrl(imgName)}
                    alt={`ภาพประกอบ ${index+1}`}
                    onClick={() => setSelectedImage(imgName)}
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}
                    whileTap={{ scale: 0.95 }}
                    style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: '12px', border: '1px solid #cbd5e1', cursor: 'pointer', transition: 'box-shadow 0.2s' }} 
                  />
                ))
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '14px', padding: '20px', backgroundColor: '#f1f5f9', borderRadius: '12px', textAlign: 'center', gridColumn: '1 / -1' }}>
                  ไม่มีรูปภาพแนบสำหรับรายงานนี้
                </div>
              )}
            </div>
          </div>

        </div>
      </motion.div>

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="no-print"
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'zoom-out' }}
          >
            <motion.button
              initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0 }}
              style={{ position: 'absolute', top: '30px', right: '30px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '50%', padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={24} />
            </motion.button>

            <motion.img
              layoutId={`image-${selectedImage}`}
              src={imageUrl(selectedImage)}
              alt="ภาพขยาย"
              style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '16px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()} 
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ReportDetail;