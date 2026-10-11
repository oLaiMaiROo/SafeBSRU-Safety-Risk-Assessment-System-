import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Save, CheckCircle2, ImagePlus, X, User, MapPin, GraduationCap, Briefcase } from 'lucide-react';

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

const ReportEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [reporterType, setReporterType] = useState('student');

  const [formData, setFormData] = useState({
    reporter_name: '', location: '', risk_category: '', 
    description: '', severity_color: '🟢 ผลกระทบระดับต่ำ (เฝ้าระวัง / ปฐมพยาบาล)'
  });

  const [studentData, setStudentData] = useState({ id: '', year: '' });
  const [personnelData, setPersonnelData] = useState({ id: '', position: '' }); 

  const [selectedFaculty, setSelectedFaculty] = useState('');
  const [selectedMajor, setSelectedMajor] = useState('');

  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // 🌟 ดึงข้อมูลเก่ามาใส่ฟอร์ม
  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
      .then(res => res.json())
      .then(data => {
        const report = data.find(r => r.id === parseInt(id));
        if (report) {
          setFormData({
            reporter_name: report.reporter_name || '',
            location: report.location || '',
            risk_category: report.risk_category || '',
            description: report.description || '',
            severity_color: report.severity_color || '🟢 ผลกระทบระดับต่ำ (เฝ้าระวัง / ปฐมพยาบาล)'
          });

          setSelectedFaculty(report.faculty || '');
          setSelectedMajor(report.major || '');

          // 🌟 เช็คว่าเป็นนักศึกษาหรือบุคลากร
          const role = report.reporter_role || '';
          if (role.includes('นักศึกษา')) {
            setReporterType('student');
            // สกัดเอาชั้นปีออกมาจากข้อความเก่า (เช่น "นักศึกษาชั้นปี 3" -> "3")
            const yearMatch = role.match(/ชั้นปี\s*(\d+)/);
            setStudentData({
              id: report.student_id || '',
              year: yearMatch ? yearMatch[1] : ''
            });
          } else {
            setReporterType('personnel');
            setPersonnelData({
              id: report.student_id || '',
              position: role === 'บุคลากร' ? '' : role
            });
          }

          if (report.image_path) {
            setExistingImages(report.image_path.split(','));
          }
        }
      })
      .catch(err => console.error('Error fetching:', err));
  }, [id]);

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
        alert('อัปโหลดรูปรวมได้สูงสุด 5 รูปครับ');
        return;
    }
    setImages(prev => [...prev, ...selectedFiles]);
    const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    setExistingImages([]); // ถ้ารูปใหม่ถูกเลือก จะเคลียร์รูปเก่าทิ้ง (ให้ทับไปเลย)
  };

  const removeNewImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
    setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

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
      const response = await fetch(`http://localhost:5000/api/reports/${id}`, {
        method: 'PUT',
        body: submitData 
      });

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => navigate(`/report-detail/${id}`), 1500);
      } else {
        alert('แก้ไขข้อมูลไม่สำเร็จ โปรดลองอีกครั้ง');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
      <motion.div animate={{ x: [0, 30, -20, 0], y: [0, -30, 20, 0] }} transition={{ repeat: Infinity, duration: 15 }} style={{ position: 'absolute', top: '5%', right: '10%', width: '300px', height: '300px', backgroundColor: '#e9d5ff', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.5, zIndex: 0 }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} style={{ maxWidth: '850px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        <button onClick={() => navigate(`/report-detail/${id}`)} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={18} /> ยกเลิกการแก้ไข
        </button>

        <div style={{ backgroundColor: 'rgba(255,255,255,0.95)', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <ShieldAlert color="#3b82f6" size={32} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>แก้ไขข้อมูลอุบัติเหตุ (ID: {id})</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>เปลี่ยนแปลงข้อมูลหรือสถานะการแจ้งเหตุ</p>
            </div>
          </div>

          {showSuccess ? (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: 'center', padding: '40px 0' }}>
              <CheckCircle2 size={80} color="#3b82f6" style={{ marginBottom: '20px' }} />
              <h2 style={{ color: '#0f172a', margin: '0 0 10px 0' }}>อัปเดตข้อมูลสำเร็จ!</h2>
              <p style={{ color: '#64748b' }}>กำลังพากลับไปยังหน้ารายละเอียด...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              
              {/* 🌟 กล่องที่ 1: ข้อมูลผู้แจ้ง */}
              <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={18} color="#8b5cf6" /> ข้อมูลผู้แจ้งเหตุ
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', alignItems: 'end' }}>
                    <div>
                      <label style={labelStyle}>ชื่อ - นามสกุล <span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" name="reporter_name" required value={formData.reporter_name} onChange={handleChange} style={inputStyle} />
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
                              <input type="text" name="id" value={studentData.id} onChange={handleStudentChange} style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>ชั้นปี</label>
                              <input type="text" name="year" value={studentData.year} onChange={handleStudentChange} style={inputStyle} />
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
                              <input type="text" value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={inputStyle} />
                            </div>
                          </div>

                        </motion.div>
                      ) : (
                        <motion.div key="personnel" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                            <div>
                              <label style={labelStyle}>ตำแหน่ง <span style={{color: '#ef4444'}}>*</span></label>
                              <input type="text" name="position" required value={personnelData.position} onChange={handlePersonnelChange} style={inputStyle} />
                            </div>
                            <div>
                              <label style={labelStyle}>รหัสบุคลากร (ถ้ามี)</label>
                              <input type="text" name="id" value={personnelData.id} onChange={handlePersonnelChange} style={inputStyle} />
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
                              <input type="text" value={selectedMajor} onChange={(e) => setSelectedMajor(e.target.value)} style={inputStyle} />
                            </div>
                          </div>

                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* 🌟 กล่องที่ 2: รายละเอียดอุบัติเหตุ */}
              <div style={{ padding: '0 5px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <MapPin size={18} color="#ef4444" /> รายละเอียดเหตุการณ์
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div>
                    <label style={labelStyle}>สถานที่เกิดเหตุ <span style={{color: '#ef4444'}}>*</span></label>
                    <input type="text" name="location" required value={formData.location} onChange={handleChange} style={inputStyle} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                      <label style={labelStyle}>ลักษณะอุบัติเหตุ <span style={{color: '#ef4444'}}>*</span></label>
                      <input type="text" name="risk_category" required value={formData.risk_category} onChange={handleChange} style={inputStyle} />
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
                    <label style={labelStyle}>
                      แก้ไขรูปภาพประกอบ (หากอัปโหลดใหม่ รูปภาพเดิมจะถูกแทนที่)
                    </label>
                    
                    {existingImages.length > 0 && previewUrls.length === 0 && (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                        {existingImages.map((img, index) => (
                          <div key={index} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0', opacity: '0.8' }}>
                            <img src={`http://localhost:5000/uploads/${img}`} alt={`รูปเดิม ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', bottom: '0', width: '100%', background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', textAlign: 'center', padding: '2px' }}>รูปเดิม</div>
                          </div>
                        ))}
                      </div>
                    )}

                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px', border: '2px dashed #cbd5e1', borderRadius: '12px', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <ImagePlus size={32} color="#94a3b8" style={{ marginBottom: '10px' }} />
                      <span style={{ color: '#64748b', fontSize: '14px' }}>คลิกเพื่อเลือกไฟล์รูปภาพใหม่</span>
                      <input type="file" multiple accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                    </label>

                    {previewUrls.length > 0 && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px', flexWrap: 'wrap' }}>
                        <AnimatePresence>
                          {previewUrls.map((url, index) => (
                            <motion.div key={url} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                              <img src={url} alt={`Preview ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button type="button" onClick={() => removeNewImage(index)} style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(239, 68, 68, 0.9)', border: 'none', color: 'white', borderRadius: '50%', padding: '2px', cursor: 'pointer', display: 'flex' }}><X size={14} /></button>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={labelStyle}>รายละเอียดเหตุการณ์</label>
                    <textarea name="description" rows="3" value={formData.description} onChange={handleChange} style={{...inputStyle, resize: 'vertical'}} />
                  </div>
                </div>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={isSubmitting}
                style={{
                  marginTop: '15px', backgroundColor: '#3b82f6', color: 'white', padding: '16px', borderRadius: '12px', border: 'none',
                  fontSize: '16px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(59,130,246,0.3)'
                }}
              >
                {isSubmitting ? 'กำลังบันทึกการแก้ไข...' : <><Save size={20} /> บันทึกการแก้ไขข้อมูล</>}
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

export default ReportEdit;