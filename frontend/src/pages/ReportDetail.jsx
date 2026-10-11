import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, MapPin, AlertCircle, CalendarClock, ShieldAlert, Edit, FileText, X } from 'lucide-react';

const ReportDetail = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
      .then(res => res.json())
      .then(data => {
        const foundReport = data.find(r => r.id === parseInt(id));
        setReport(foundReport);
      })
      .catch(err => console.error('Error:', err));
  }, [id]);

  const getSeverityBadge = (severityStr) => {
    const str = severityStr || '';
    if (str.includes('🔴')) return { label: '🔴 ระดับวิกฤต', bg: '#fee2e2', text: '#ef4444' };
    if (str.includes('🟡')) return { label: '🟡 ระดับเฝ้าระวัง', bg: '#fef3c7', text: '#d97706' };
    if (str.includes('🟢')) return { label: '🟢 ระดับต่ำ', bg: '#d1fae5', text: '#059669' };
    return { label: str || 'ไม่ระบุ', bg: '#f1f5f9', text: '#64748b' };
  };

  if (!report) {
    return <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>กำลังโหลดข้อมูล... หรือไม่พบข้อมูลนี้</div>;
  }

  const handleExportPDF = () => {
    window.print();
  };

  const badge = getSeverityBadge(report.severity_color);

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

        <div className="print-container" style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', backdropFilter: 'blur(10px)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px', marginBottom: '25px' }}>
            <div>
              <h1 style={{ margin: '0 0 10px 0', fontSize: '24px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldAlert color="#7e22ce" size={28} /> รายละเอียดการแจ้งเหตุ (ID: {report.id})
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '14px' }}>
                <CalendarClock size={16} /> {new Date(report.created_at).toLocaleString('th-TH')}
              </div>
            </div>
            
            <span style={{ padding: '8px 16px', borderRadius: '50px', fontSize: '14px', fontWeight: '600', backgroundColor: badge.bg, color: badge.text }}>
              {badge.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '30px' }}>
            
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
                  <div style={{ color: '#0f172a', fontWeight: '500', fontSize: '15px', marginTop: '2px' }}>{report.faculty || '-'}</div>
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
              {report.image_path ? (
                report.image_path.split(',').map((imgName, index) => (
                  <motion.img 
                    layoutId={`image-${imgName}`}
                    key={index} 
                    src={`http://localhost:5000/uploads/${imgName}`} 
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
              src={`http://localhost:5000/uploads/${selectedImage}`}
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