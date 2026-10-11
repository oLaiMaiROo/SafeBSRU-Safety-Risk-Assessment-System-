import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Calendar, FileSearch, Trash2, Download, FileText, CheckSquare, Filter, User, Building, Hash } from 'lucide-react';

const bsruFaculties = [
  "คณะวิทยาศาสตร์และเทคโนโลยี", "คณะครุศาสตร์", "คณะมนุษยศาสตร์และสังคมศาสตร์", 
  "คณะวิทยาการจัดการ", "คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม", 
  "วิทยาลัยการดนตรี", "คณะสหเวชศาสตร์", "คณะพยาบาลศาสตร์", "สำนักงานอธิการบดี"
];

const ReportList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  
  const [searchName, setSearchName] = useState(''); 
  const [searchId, setSearchId] = useState(''); 
  const [filterFaculty, setFilterFaculty] = useState(''); 
  const [filterDate, setFilterDate] = useState(''); 
  const [filterSeverity, setFilterSeverity] = useState(''); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  const [selectedIds, setSelectedIds] = useState([]);
  const [printMode, setPrintMode] = useState('all');

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
      .then(res => res.json())
      .then(data => setReports(data))
      .catch(err => console.error('Error:', err));
  }, []);

  const getSeverityBadge = (severityStr) => {
    const str = severityStr || '';
    if (str.includes('🔴')) return { label: '🔴 ระดับวิกฤต', bg: '#fee2e2', text: '#ef4444' };
    if (str.includes('🟡')) return { label: '🟡 ระดับเฝ้าระวัง', bg: '#fef3c7', text: '#d97706' };
    if (str.includes('🟢')) return { label: '🟢 ระดับต่ำ', bg: '#d1fae5', text: '#059669' };
    return { label: str || 'ไม่ระบุ', bg: '#f1f5f9', text: '#64748b' };
  };

  const filteredReports = reports.filter(report => {
    const matchName = (report.reporter_name || '').toLowerCase().includes(searchName.toLowerCase());
    const matchId = (report.student_id || '').toLowerCase().includes(searchId.toLowerCase());
    const matchFaculty = filterFaculty === '' || (report.faculty || '').includes(filterFaculty);
    
    let matchDate = true;
    if (filterDate) {
      const reportDate = new Date(report.created_at).toISOString().split('T')[0];
      matchDate = reportDate === filterDate;
    }

    const matchSeverity = filterSeverity === '' || (report.severity_color || '').includes(filterSeverity);

    return matchName && matchId && matchFaculty && matchDate && matchSeverity;
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredReports.slice(indexOfFirstItem, indexOfLastItem);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageIds = currentItems.map(item => item.id);
      setSelectedIds(prev => [...new Set([...prev, ...currentPageIds])]);
    } else {
      const currentPageIds = currentItems.map(item => item.id);
      setSelectedIds(prev => prev.filter(id => !currentPageIds.includes(id)));
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการแจ้งเหตุนี้? (ลบแล้วกู้คืนไม่ได้นะ)')) {
      try {
        const response = await fetch(`http://localhost:5000/api/reports/${id}`, { method: 'DELETE' });
        if (response.ok) {
          setReports(prev => prev.filter(report => report.id !== id));
          setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        } else {
          alert('เกิดข้อผิดพลาด: ไม่สามารถลบข้อมูลได้');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
  };

  // 🌟 ฟังก์ชันปรับปรุงรูปแบบไฟล์ Excel ให้สะอาด เป็นระเบียบ อ่านง่าย
  const generateExcel = (dataList, filename) => {
    // ใส่ \uFEFF บังคับให้ Excel เปิดไฟล์เป็น UTF-8 เสมอ จะได้ไม่เจอภาษาไทยเพี้ยนเป็นตัวยึกยือ
    let csvContent = "\uFEFF"; 

    // ใส่หัวเรื่องด้านบนตารางเพื่อความสวยงาม
    csvContent += "รายงานข้อมูลรายการแจ้งอุบัติเหตุ (BSRU)\n";
    csvContent += `วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}\n\n`;

    // หัวตาราง (ตัดคอลัมน์ที่ไม่จำเป็น และเรียงใหม่ให้เป็นสัดส่วน)
    csvContent += "ID แจ้งเหตุ,วันที่แจ้ง,เวลาที่แจ้ง,รหัสประจำตัว,ชื่อ-นามสกุล,สถานะ/ตำแหน่ง,หน่วยงานสังกัด,สาขา/แผนก,ลักษณะอุบัติเหตุ,ระดับผลกระทบ,สถานที่เกิดเหตุ,รายละเอียด\n";

    dataList.forEach(r => {
      // จัดการวันที่และเวลา
      const fullDate = new Date(r.created_at);
      const dateStr = fullDate.toLocaleDateString('th-TH');
      const timeStr = fullDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      // ทำความสะอาดข้อความ เพื่อไม่ให้คอมม่า (,) ในข้อความไปตัดคอลัมน์ Excel พัง
      // โดยการเอา "ครอบข้อความ" ไว้ (CSV Standard)
      const cleanStr = (str) => str ? `"${String(str).replace(/"/g, '""')}"` : '"-"';

      // ดึงระดับความรุนแรงมาสั้นๆ เช่น "ระดับวิกฤต", "ระดับต่ำ" 
      let cleanSeverity = r.severity_color || '';
      if(cleanSeverity.includes('วิกฤต')) cleanSeverity = "ระดับวิกฤต";
      else if(cleanSeverity.includes('เฝ้าระวัง')) cleanSeverity = "ระดับเฝ้าระวัง";
      else if(cleanSeverity.includes('ต่ำ')) cleanSeverity = "ระดับต่ำ";

      // นำข้อมูลเรียงต่อกันตามหัวตาราง
      csvContent += `${r.id},${dateStr},${timeStr},${cleanStr(r.student_id)},${cleanStr(r.reporter_name)},${cleanStr(r.reporter_role)},${cleanStr(r.faculty)},${cleanStr(r.major)},${cleanStr(r.risk_category)},${cleanSeverity},${cleanStr(r.location)},${cleanStr(r.description)}\n`;
    });

    // ดาวน์โหลดไฟล์
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const handleExportExcelAll = () => generateExcel(filteredReports, "รายงานอุบัติเหตุ_ทั้งหมด.csv");
  const handleExportExcelSelected = () => {
    const dataToExport = reports.filter(r => selectedIds.includes(r.id));
    generateExcel(dataToExport, "รายงานอุบัติเหตุ_เลือกเฉพาะ.csv");
  };

  const handleExportPDFAll = () => {
    setPrintMode('all');
    setTimeout(() => window.print(), 100);
  };

  const handleExportPDFSelected = () => {
    setPrintMode('selected');
    setTimeout(() => window.print(), 100);
  };

  const dataToPrint = printMode === 'all' 
    ? filteredReports 
    : reports.filter(r => selectedIds.includes(r.id));

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', color: '#1e293b', position: 'relative' }}>
      <div className="no-print" style={{ maxWidth: '1300px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', marginBottom: '10px', padding: 0 }}>
              <ArrowLeft size={18} /> กลับไปหน้าสรุปสถิติ
            </button>
            <h1 style={{ margin: 0, fontSize: '26px', fontWeight: '700', color: '#0f172a' }}>จัดการข้อมูลรายการแจ้งเหตุ</h1>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportExcelAll} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.2)' }}>
              <Download size={18} /> Export (Excel)
            </button>
            <button onClick={handleExportPDFAll} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.2)' }}>
              <FileText size={18} /> Export (PDF)
            </button>
          </div>
        </div>

        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '20px' }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '15px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={18} color="#8b5cf6" /> ตัวกรองข้อมูล
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            
            <div style={{ position: 'relative' }}>
              <label style={filterLabelStyle}>ค้นหารหัสประจำตัว</label>
              <Hash size={16} color="#94a3b8" style={filterIconStyle} />
              <input type="text" placeholder="ระบุรหัสประจำตัว" value={searchId} onChange={(e) => {setSearchId(e.target.value); setCurrentPage(1);}} style={filterInputStyle} />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={filterLabelStyle}>ค้นหาชื่อ-นามสกุล</label>
              <User size={16} color="#94a3b8" style={filterIconStyle} />
              <input type="text" placeholder="ระบุชื่อผู้แจ้ง" value={searchName} onChange={(e) => {setSearchName(e.target.value); setCurrentPage(1);}} style={filterInputStyle} />
            </div>

            <div style={{ position: 'relative' }}>
              <label style={filterLabelStyle}>กรองตามคณะ/หน่วยงาน</label>
              <Building size={16} color="#94a3b8" style={filterIconStyle} />
              <select value={filterFaculty} onChange={(e) => {setFilterFaculty(e.target.value); setCurrentPage(1);}} style={{...filterInputStyle, appearance: 'none', backgroundColor: '#fff'}}>
                <option value="">ทั้งหมด</option>
                {bsruFaculties.map(fac => <option key={fac} value={fac}>{fac}</option>)}
              </select>
            </div>

            <div>
              <label style={filterLabelStyle}>วันที่แจ้งเหตุ</label>
              <input type="date" value={filterDate} onChange={(e) => {setFilterDate(e.target.value); setCurrentPage(1);}} style={{...filterInputStyle, paddingLeft: '12px'}} />
            </div>

            <div>
              <label style={filterLabelStyle}>ระดับผลกระทบ</label>
              <select value={filterSeverity} onChange={(e) => {setFilterSeverity(e.target.value); setCurrentPage(1);}} style={{...filterInputStyle, paddingLeft: '12px', backgroundColor: 'white'}}>
                <option value="">ทุกระดับ (แสดงทั้งหมด)</option>
                <option value="🟢">🟢 ผลกระทบระดับต่ำ</option>
                <option value="🟡">🟡 ผลกระทบระดับเฝ้าระวัง</option>
                <option value="🔴">🔴 ผลกระทบระดับวิกฤต</option>
              </select>
            </div>

          </div>
        </div>

        <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569', fontSize: '13px', whiteSpace: 'nowrap' }}>
                  <th style={{ padding: '15px', width: '50px', textAlign: 'center' }}>
                    <input type="checkbox" onChange={handleSelectAll} checked={currentItems.length > 0 && currentItems.every(item => selectedIds.includes(item.id))} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                  </th>
                  <th style={{ padding: '15px' }}>วันที่แจ้ง</th>
                  <th style={{ padding: '15px' }}>รหัสประจำตัว</th>
                  <th style={{ padding: '15px' }}>ชื่อผู้แจ้ง</th>
                  <th style={{ padding: '15px' }}>สังกัด / สาขา</th>
                  <th style={{ padding: '15px' }}>สถานที่</th>
                  <th style={{ padding: '15px' }}>ลักษณะเหตุ</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>ระดับผลกระทบ</th>
                  <th style={{ padding: '15px', textAlign: 'center' }}>แอ็กชัน</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map((report) => {
                  const badge = getSeverityBadge(report.severity_color);
                  return (
                    <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9', transition: 'background-color 0.2s', backgroundColor: selectedIds.includes(report.id) ? '#f0fdf4' : 'transparent' }}>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <input type="checkbox" checked={selectedIds.includes(report.id)} onChange={() => handleSelectOne(report.id)} style={{ transform: 'scale(1.2)', cursor: 'pointer' }} />
                      </td>
                      <td style={{ padding: '15px', color: '#475569', fontSize: '13px' }}>
                        {new Date(report.created_at).toLocaleDateString('th-TH')}
                      </td>
                      <td style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>
                        {report.student_id || '-'}
                      </td>
                      <td style={{ padding: '15px', color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>
                        {report.reporter_name || 'ไม่ระบุ'}
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 'normal' }}>{report.reporter_role || '-'}</div>
                      </td>
                      <td style={{ padding: '15px', color: '#475569', fontSize: '13px' }}>
                        <div style={{ fontWeight: '500', color: '#334155' }}>{report.faculty || '-'}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{report.major || '-'}</div>
                      </td>
                      <td style={{ padding: '15px', color: '#475569', fontSize: '13px' }}>{report.location}</td>
                      <td style={{ padding: '15px', color: '#475569', fontSize: '13px' }}>{report.risk_category}</td>
                      
                      <td style={{ padding: '15px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          display: 'inline-block', padding: '6px 12px', borderRadius: '50px', fontSize: '12px', fontWeight: '600',
                          backgroundColor: badge.bg, color: badge.text, whiteSpace: 'nowrap'
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      
                      <td style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button onClick={() => navigate(`/report-detail/${report.id}`)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6', fontSize: '12px', fontWeight: '600' }}><FileSearch size={14} /> เปิดดู</button>
                          <button onClick={() => handleDelete(report.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 10px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontWeight: '600' }}><Trash2 size={14} /> ลบ</button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>ไม่พบข้อมูลที่ค้นหา</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <span style={{ fontSize: '14px', color: '#64748b' }}>แสดงหน้า {currentPage} จาก {totalPages} (ทั้งหมด {filteredReports.length} รายการ)</span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === 1 ? '#f1f5f9' : 'white', color: currentPage === 1 ? '#94a3b8' : '#334155', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}>ก่อนหน้า</button>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: currentPage === totalPages ? '#f1f5f9' : 'white', color: currentPage === totalPages ? '#94a3b8' : '#334155', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}>ถัดไป</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>
        {`
          .print-only-container { display: none; }
          @media print {
            .no-print { display: none !important; }
            .print-only-container { display: block !important; }
            body { background-color: white !important; margin: 0; padding: 0; }
            .print-table { width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 12px; }
            .print-table th, .print-table td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            .print-table th { background-color: #f1f5f9 !important; -webkit-print-color-adjust: exact; font-weight: bold; }
          }
        `}
      </style>
      <div className="print-only-container">
        <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
          รายงานข้อมูลการแจ้งอุบัติเหตุ (BSRU) <br/>
          <span style={{fontSize: '14px', fontWeight: 'normal'}}>
            {printMode === 'selected' ? `(เฉพาะรายการที่เลือก: ${dataToPrint.length} รายการ)` : `(ทั้งหมด: ${dataToPrint.length} รายการ)`}
          </span>
        </h2>
        <table className="print-table">
          <thead>
            <tr>
              <th>วันที่แจ้ง</th>
              <th>รหัสประจำตัว</th>
              <th>ผู้แจ้ง/สถานะ</th>
              <th>สังกัด/สาขา</th>
              <th>สถานที่</th>
              <th>ลักษณะอุบัติเหตุ</th>
              <th>ระดับผลกระทบ</th>
            </tr>
          </thead>
          <tbody>
            {dataToPrint.map(report => {
              const badge = getSeverityBadge(report.severity_color);
              return (
                <tr key={report.id}>
                  <td>{new Date(report.created_at).toLocaleDateString('th-TH')}</td>
                  <td>{report.student_id || '-'}</td>
                  <td>{report.reporter_name || 'ไม่ระบุชื่อ'} <br/><span style={{fontSize:'10px', color:'#666'}}>{report.reporter_role}</span></td>
                  <td>{report.faculty || '-'}<br/><span style={{fontSize:'10px', color:'#666'}}>{report.major || '-'}</span></td>
                  <td>{report.location}</td>
                  <td>{report.risk_category}</td>
                  <td>{badge.label}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div 
            className="no-print"
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            style={{ position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', padding: '15px 25px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '20px', zIndex: 100 }}
          >
            <div style={{ color: 'white', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckSquare size={18} color="#10b981" /> เลือกไว้แล้ว {selectedIds.length} รายการ
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#334155' }}></div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleExportExcelSelected} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#10b981', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                <Download size={16} /> Export เฉพาะที่เลือก (Excel)
              </button>
              <button onClick={handleExportPDFSelected} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '14px' }}>
                <FileText size={16} /> Export เฉพาะที่เลือก (PDF)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

const filterLabelStyle = { display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '6px', fontWeight: '600' };
const filterInputStyle = { width: '100%', padding: '10px 10px 10px 35px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' };
const filterIconStyle = { position: 'absolute', left: '10px', top: '32px' };

export default ReportList;