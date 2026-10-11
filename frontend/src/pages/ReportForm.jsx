import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Send, CheckCircle2, ImagePlus, X, User, MapPin, GraduationCap, Briefcase, ListChecks } from 'lucide-react';

const bsruDepartments = [
  {
    group: "คณะและวิทยาลัย",
    items: [
      "คณะวิทยาศาสตร์และเทคโนโลยี", "คณะครุศาสตร์", "คณะมนุษยศาสตร์และสังคมศาสตร์", 
      "คณะวิทยาการจัดการ", "คณะวิศวกรรมศาสตร์และเทคโนโลยีอุตสาหกรรม", 
      "วิทยาลัยการดนตรี", "คณะสหเวชศาสตร์", "คณะพยาบาลศาสตร์"
    ]
  },
  {
    group: "สำนักงานอธิการบดี",
    items: [
      "สำนักงานอธิการบดี กองบริหารงานบุคคล",
      "สำนักงานอธิการบดี กองกลาง",
      "สำนักงานอธิการบดี กองอาคารสถานที่และสิ่งแวดล้อม",
      "สำนักงานอธิการบดี กองนโยบายและแผน (งานประกันคุณภาพการศึกษา)",
      "สำนักงานอธิการบดี กองคลัง (งานพัสดุ)"
    ]
  },
  {
    group: "สำนักและหน่วยงาน",
    items: [
      "สำนักส่งเสริมวิชาการและงานทะเบียน", "สำนักวิทยบริการและเทคโนโลยีสารสนเทศ",
      "สำนักบริหารกิจการนักศึกษา", "สำนักคอมพิวเตอร์", "สำนักประชาสัมพันธ์และสารสนเทศ",
      "สำนักวิเทศสัมพันธ์และเครือข่ายอาเซียน", "สำนักศิลปะและวัฒนธรรม",
      "สถาบันวิจัยและพัฒนา", "สำนักงานสภามหาวิทยาลัย", "หน่วยงานตรวจสอบภายใน"
    ]
  },
  {
    group: "สถาบัน ศูนย์ และสภา",
    items: [
      "สถาบันขงจื่อ", "สภาวิชาการ", "สภาคณาจารย์และข้าราชการ",
      "ศูนย์ส่งเสริมการเรียนรู้และถ่ายทอดนวัตกรรม (PLI BSRU)",
      "ศูนย์สหกิจศึกษาและการศึกษาเชิงบูรณาการกับการทำงาน (CWIE)",
      "ศูนย์ประสานงานรับสมัครนักศึกษาต่างชาติ (IACC)",
      "ศูนย์สร้างสรรค์ภาพลักษณ์ มรภ.บ้านสมเด็จเจ้าพระยา",
      "อื่นๆ"
    ]
  }
];

const ReportForm = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // 🌟 State สำหรับควบคุมการเปิด/ปิด Pop-up ยืนยันข้อมูล
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const [reporterType, setReporterType] = useState('student');

  const [formData, setFormData] = useState({
    reporter_name: '', 
    location: '', 
    risk_category: '', 
    description: '', 
    severity_color: '🟢 ผลกระทบระดับต่ำ (เฝ้าระวัง / ปฐมพยาบาล)' 
  });

  const [studentData, setStudentData] = useState({ id: '', year: '' });
  const [personnelData, setPersonnelData] = useState({ id: '', position: '' }); 

  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const handleGoBack = () => {
    if (sessionStorage.getItem('isAdmin') === 'true') {
      navigate('/dashboard'); 
    } else {
      navigate('/'); 
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentChange = (e) => {
    setStudentData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePersonnelChange = (e) => {
    setPersonnelData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTypeToggle = (type) => {
    setReporterType(type);
    setSelectedFaculty('');
    setSelectedMajor('');
  };

  const handleImageChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (images.length + selectedFiles.length > 5) {
        alert('อัปโหลดรูปภาพได้สูงสุด 5 รูปเท่านั้นครับ');
        return;
    }
    setImages(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  // 🌟 ฟังก์ชันที่ 1: กด Submit ฟอร์ม -> เด้ง Pop-up ให้เช็คข้อมูล
  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowConfirmModal(true); // เปิด Pop-up สรุปข้อมูล
  };

  // 🌟 ฟังก์ชันที่ 2: กดยืนยันใน Pop-up -> บันทึกข้อมูลจริงส่งไปหลังบ้าน
  const confirmAndSubmit = async () => {
    setShowConfirmModal(false); // ปิด Pop-up
    setIsSubmitting(true); // ล็อกปุ่มกันกดเบิ้ล

    const submitData = new FormData();

    // ดึงรหัสตามประเภทผู้แจ้ง
    const currentId = reporterType === 'student' ? studentData.id : personnelData.id;
    submitData.append('student_id', currentId || '');

    // ดึงสถานะ/ตำแหน่ง
    let currentRole = '';
    if (reporterType === 'student') {
        currentRole = studentData.year ? `นักศึกษาชั้นปี ${studentData.year}` : 'นักศึกษา';
    } else {
        currentRole = personnelData.position || 'บุคลากร';
    }
    submitData.append('reporter_role', currentRole);

    submitData.append('faculty', selectedFaculty || '');
    submitData.append('major', selectedMajor || '');

    Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
    });

    images.forEach(image => {
        submitData.append('images', image);
    });

    try {
      const response = await fetch('http://localhost:5000/api/reports', {
        method: 'POST',
        body: submitData 
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          if (sessionStorage.getItem('isAdmin') === 'true') {
            navigate('/dashboard');
          } else {
            navigate('/');
          }
        }, 1500);
      } else {
        const errorText = await response.text();
        console.error('Server Error:', errorText);
        alert('เกิดข้อผิดพลาดจากฐานข้อมูล โปรดลองอีกครั้ง');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ โปรดตรวจสอบว่า Node.js รันอยู่หรือไม่');
      setIsSubmitting(false); 
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      
      {/* 🌟 Pop-up ยืนยันข้อมูลก่อนบันทึก */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', boxSizing: 'border-box' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ backgroundColor: 'white', padding: '30px', borderRadius: '24px', maxWidth: '550px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px' }}>
                <div style={{ backgroundColor: '#f3e8ff', padding: '12px', borderRadius: '50%' }}>
                  <ListChecks color="#7e22ce" size={28} />
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#0f172a', fontSize: '20px' }}>ตรวจสอบความถูกต้อง</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>กรุณายืนยันข้อมูลทั้งหมดก่อนบันทึกลงระบบ</p>
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#334155' }}>
                {/* สรุปข้อมูลผู้แจ้ง */}
                <div><span style={{color: '#94a3b8'}}>ผู้แจ้งเหตุ:</span> <strong style={{color: '#1e293b'}}>{formData.reporter_name}</strong> <span style={{fontSize: '12px', color: '#64748b'}}>({reporterType === 'student' ? 'นักศึกษา' : 'บุคลากร'})</span></div>
                
                {reporterType === 'student' ? (
                  <div><span style={{color: '#94a3b8'}}>รหัสนักศึกษา:</span> <strong style={{color: '#1e293b'}}>{studentData.id || '-'}</strong> <span style={{color: '#94a3b8'}}>&nbsp;|&nbsp; ชั้นปี:</span> <strong style={{color: '#1e293b'}}>{studentData.year || '-'}</strong></div>
                ) : (
                  <div><span style={{color: '#94a3b8'}}>รหัสบุคลากร:</span> <strong style={{color: '#1e293b'}}>{personnelData.id || '-'}</strong> <span style={{color: '#94a3b8'}}>&nbsp;|&nbsp; ตำแหน่ง:</span> <strong style={{color: '#1e293b'}}>{personnelData.position || '-'}</strong></div>
                )}
                
                <div><span style={{color: '#94a3b8'}}>สังกัด / หน่วยงาน:</span> <strong style={{color: '#1e293b'}}>{selectedFaculty}</strong></div>
                {selectedMajor && <div><span style={{color: '#94a3b8'}}>สาขา / แผนก:</span> <strong style={{color: '#1e293b'}}>{selectedMajor}</strong></div>}
                
                <div style={{height: '1px', backgroundColor: '#e2e8f0', margin: '5px 0'}}></div>
                
                {/* สรุปข้อมูลเหตุการณ์ */}
                <div><span style={{color: '#94a3b8'}}>สถานที่เกิดเหตุ:</span> <strong style={{color: '#1e293b'}}>{formData.location}</strong></div>
                <div><span style={{color: '#94a3b8'}}>ลักษณะอุบัติเหตุ:</span> <strong style={{color: '#1e293b'}}>{formData.risk_category}</strong></div>
                <div><span style={{color: '#94a3b8'}}>ระดับความรุนแรง:</span> <strong style={{color: formData.severity_color.includes('🔴') ? '#ef4444' : formData.severity_color.includes('🟡') ? '#d97706' : '#10b981'}}>{formData.severity_color}</strong></div>
                {formData.description && (
                  <div>
                    <span style={{color: '#94a3b8', display: 'block', marginBottom: '4px'}}>รายละเอียด:</span> 
                    <div style={{backgroundColor: 'white', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0'}}>{formData.description}</div>
                  </div>
                )}
                <div><span style={{color: '#94a3b8'}}>ไฟล์ภาพประกอบ:</span> <strong style={{color: '#1e293b'}}>{images.length} รูป</strong></div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                <button onClick={() => setShowConfirmModal(false)} type="button" style={{ flex: 1, padding: '14px', backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#f1f5f9'}>
                  กลับไปแก้ไข
                </button>
                <button onClick={confirmAndSubmit} type="button" style={{ flex: 1, padding: '14px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(126, 34, 206, 0.3)' }}>
                  <CheckCircle2 size={18} /> ยืนยันการบันทึก
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* 🌟 จบโซน Pop-up */}


      <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }} transition={{ repeat: Infinity, duration: 15 }} style={{ position: 'absolute', top: '5%', right: '10%', width: '300px', height: '300px', backgroundColor: '#e9d5ff', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5, zIndex: 0 }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 10 }}>

        <button onClick={handleGoBack} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={18} /> ย้อนกลับ
        </button>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <ShieldAlert color="#7e22ce" size={32} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>แบบฟอร์มบันทึกอุบัติเหตุ</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>กรุณากรอกข้อมูลให้ครบถ้วนเพื่อให้เจ้าหน้าที่เข้าช่วยเหลือได้ตรงจุด</p>
            </div>
          </div>

          {showSuccess ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={80} color="#10b981" style={{ marginBottom: '20px' }} />
              <h2 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>บันทึกข้อมูลสำเร็จ!</h2>
              <p style={{ color: '#64748b' }}>กำลังพากลับสู่หน้าหลัก...</p>
            </motion.div>
          ) : (
            // เปลี่ยนจาก onSubmit={handleSubmit} เป็น handleFormSubmit
            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="#8b5cf6" /> ข้อมูลผู้แจ้งเหตุ
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>ชื่อ - นามสกุล <span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" name="reporter_name" required value={formData.reporter_name} onChange={handleChange} placeholder="เช่น นายสมหมาย ใจดี" style={inputStyle} />
                    </div>

                    <div>
                      <label style={labelStyle}>ประเภทผู้แจ้ง</label>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          type="button" 
                          onClick={() => handleTypeToggle('student')}
                          style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', border: reporterType === 'student' ? '2px solid #8b5cf6' : '1px solid #cbd5e1', backgroundColor: reporterType === 'student' ? '#f5f3ff' : 'white', color: reporterType === 'student' ? '#7e22ce' : '#64748b' }}
                        >
                          <GraduationCap size={18} /> นักศึกษา
                        </button>
                        <button 
                          type="button" 
                          onClick={() => handleTypeToggle('personnel')}
                          style={{ flex: 1, padding: '12px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', border: reporterType === 'personnel' ? '2px solid #3b82f6' : '1px solid #cbd5e1', backgroundColor: reporterType === 'personnel' ? '#eff6ff' : 'white', color: reporterType === 'personnel' ? '#2563eb' : '#64748b' }}
                        >
                          <Briefcase size={18} /> บุคลากร
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">
                      {reporterType === 'student' ? (
                        <motion.div key="student" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                              <label style={labelStyle}>รหัสนักศึกษา (ถ้ามี)</label>
                              <input type="text" name="id" value={studentData.id} onChange={handleStudentChange} placeholder="เช่น 651234567" style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>ชั้นปี</label>
                              <input type="text" name="year" value={studentData.year} onChange={handleStudentChange} placeholder="เช่น 1, 2, 3, 4" style={inputStyle} />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                              <label style={labelStyle}>สังกัดคณะ <span style={{color: '#ef4444'}}>*</span></label>
                              <select required value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} style={inputStyle}>
                                <option value="">-- เลือกคณะ --</option>
                                {bsruDepartments[0].items.map(item => (
                                  <option key={item} value={item}>{item}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>สาขาวิชา</label>
                              <input type="text" value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} placeholder="เช่น วิทยาการคอมพิวเตอร์" style={inputStyle} />
                            </div>
                          </div>

                        </motion.div>
                      ) : (
                        <motion.div key="personnel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                              <label style={labelStyle}>ตำแหน่ง <span style={{color: '#ef4444'}}>*</span></label>
                              <input type="text" name="position" required value={personnelData.position} onChange={handlePersonnelChange} placeholder="เช่น อาจารย์, เลขาหลักสูตร" style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>รหัสบุคลากร (ถ้ามี)</label>
                              <input type="text" name="id" value={personnelData.id} onChange={handlePersonnelChange} placeholder="เช่น EMP-12345" style={inputStyle} />
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                              <label style={labelStyle}>สังกัดคณะ | สำนัก | หน่วยงาน <span style={{color: '#ef4444'}}>*</span></label>
                              <select required value={selectedFaculty} onChange={(e) => setSelectedFaculty(e.target.value)} style={inputStyle}>
                                <option value="">-- เลือกหน่วยงานสังกัด --</option>
                                {bsruDepartments.map((group, idx) => (
                                  <optgroup key={idx} label={`--- ${group.group} ---`}>
                                    {group.items.map(item => (
                                      <option key={item} value={item}>{item}</option>
                                    ))}
                                  </optgroup>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={labelStyle}>สาขา / แผนก / งาน</label>
                              <input type="text" value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} placeholder="เช่น กองกลาง, สาขาคณิตศาสตร์" style={inputStyle} />
                            </div>
                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div style={{ padding: '0 5px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#ef4444" /> รายละเอียดเหตุการณ์
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>สถานที่เกิดเหตุ <span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" name="location" required value={formData.location} onChange={handleChange} placeholder="ระบุอาคาร, ชั้น, หรือจุดสังเกต เช่น หน้าห้องแล็บ 302 อาคาร 5" style={inputStyle} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={labelStyle}>ลักษณะอุบัติเหตุ <span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" name="risk_category" required value={formData.risk_category} onChange={handleChange} placeholder="เช่น ลื่นล้ม, ของมีคมบาด, ไฟฟ้าลัดวงจร" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>ระดับผลกระทบ <span style={{color: '#ef4444'}}>*</span></label>
                      <select name="severity_color" value={formData.severity_color} onChange={handleChange} style={inputStyle}>
                        <option>🟢 ผลกระทบระดับต่ำ (เฝ้าระวัง / ปฐมพยาบาล)</option>
                        <option>🟡 ผลกระทบระดับเฝ้าระวัง (กระทบการเรียน / ส่งแพทย์)</option>
                        <option>🔴 ผลกระทบระดับวิกฤต (อันตรายร้ายแรง / ฉุกเฉิน)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>แนบรูปภาพประกอบ <span style={{color: '#94a3b8', fontWeight: 'normal'}}>(อัปโหลดได้สูงสุด 5 รูป)</span></label>
                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', border: '2px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}
                           onMouseOver={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.backgroundColor = '#f5f3ff'; }}
                           onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.backgroundColor = '#f8fafc'; }}>
                      <ImagePlus size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
                      <span style={{ color: '#64748b', fontSize: '14px' }}>คลิกเพื่อเลือกไฟล์รูปภาพ</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>

                    {previewUrls.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                        <AnimatePresence>
                          {previewUrls.map((url, index) => (
                            <motion.div key={url} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                              <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => removeImage(index)} style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: 'white', borderRadius: '50%', padding: '4px', cursor: 'pointer', display: 'flex' }}>
                                <X size={12} />
                              </button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>รายละเอียดเหตุการณ์</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleChange} placeholder="เล่าเหตุการณ์เพิ่มเติม หรือการปฐมพยาบาลเบื้องต้นที่ได้ทำไปแล้ว..." style={{...inputStyle, resize: 'vertical'}} />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={isSubmitting}
                style={{
                  marginTop: '15px', backgroundColor: '#7e22ce', color: 'white', padding: '16px', borderRadius: '12px', border: 'none',
                  fontSize: '16px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(126,34,206,0.3)'
                }}
              >
                {isSubmitting ? 'กำลังจัดเตรียมข้อมูล...' : <><Send size={20} /> บันทึกข้อมูลเข้าระบบ</>}
              </motion.button>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: '#475569', fontWeight: '600' };
const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', 
  backgroundColor: '#fff', fontSize: '15px', color: '#1e293b', boxSizing: 'border-box',
  fontFamily: 'inherit', transition: 'border-color 0.2s', outline: 'none'
};

export default ReportForm;