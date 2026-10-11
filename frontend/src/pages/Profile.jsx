import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Lock, Save, ShieldCheck, CheckCircle2, KeyRound, X, ArrowRight, Eye, EyeOff } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState(null);
  
  const [fullName, setFullName] = useState('');
  
  // State ควบคุมสเต็ปการเปลี่ยนรหัสผ่าน
  const [passwordStep, setPasswordStep] = useState(0);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // 🌟 State ควบคุมการแสดงรหัสผ่าน (เปิด/ปิด ตา)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
  const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });

  // ตรวจสอบสิทธิ์
  useEffect(() => {
    const isAdmin = sessionStorage.getItem('isAdmin');
    const storedAdmin = JSON.parse(sessionStorage.getItem('adminUser'));
    
    if (isAdmin !== 'true' || !storedAdmin) {
      navigate('/');
    } else {
      setAdminData(storedAdmin);
      setFullName(storedAdmin.full_name || '');
    }
  }, [navigate]);

  // ฟังก์ชัน 1: บันทึกเฉพาะข้อมูลโปรไฟล์ (ชื่อ)
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMsg({ text: 'กำลังบันทึกข้อมูล...', type: 'info' });

    try {
      const response = await fetch(`http://localhost:5000/api/admins/${adminData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName }) 
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setProfileMsg({ text: 'อัปเดตชื่อโปรไฟล์สำเร็จ!', type: 'success' });
        sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
        setTimeout(() => setProfileMsg({ text: '', type: '' }), 3000);
      } else {
        setProfileMsg({ text: data.message || 'เกิดข้อผิดพลาด', type: 'error' });
      }
    } catch (err) {
      setProfileMsg({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
    }
  };

  // ฟังก์ชัน 2: ยืนยันรหัสผ่านเดิม (Step 1 -> 2)
  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword) {
      setPasswordMsg({ text: 'โปรดระบุรหัสผ่านปัจจุบัน', type: 'error' });
      return;
    }
    setPasswordMsg({ text: 'กำลังตรวจสอบ...', type: 'info' });

    try {
      const res = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminData.username, password: currentPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setPasswordMsg({ text: '', type: '' });
        setPasswordStep(2); 
      } else {
        setPasswordMsg({ text: 'รหัสผ่านปัจจุบันไม่ถูกต้อง!', type: 'error' });
      }
    } catch (err) {
      setPasswordMsg({ text: 'ระบบมีปัญหา ไม่สามารถตรวจสอบได้', type: 'error' });
    }
  };

  // ฟังก์ชัน 3: บันทึกรหัสผ่านใหม่ (Step 2 -> เสร็จสิ้น)
  const handleSaveNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setPasswordMsg({ text: 'โปรดกรอกรหัสผ่านใหม่ให้ครบถ้วน', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน!', type: 'error' });
      return;
    }

    setPasswordMsg({ text: 'กำลังบันทึกรหัสผ่านใหม่...', type: 'info' });

    try {
      const response = await fetch(`http://localhost:5000/api/admins/${adminData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, password: newPassword })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPasswordMsg({ text: 'เปลี่ยนรหัสผ่านสำเร็จ!', type: 'success' });
        
        // ล้างข้อมูลและกลับไปสเต็ป 0
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowCurrentPassword(false);
        setShowNewPassword(false);
        setShowConfirmPassword(false);
        
        setTimeout(() => {
          setPasswordStep(0);
          setPasswordMsg({ text: '', type: '' });
        }, 2000);
      } else {
        setPasswordMsg({ text: data.message || 'เกิดข้อผิดพลาด', type: 'error' });
      }
    } catch (err) {
      setPasswordMsg({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
    }
  };

  const cancelPasswordChange = () => {
    setPasswordStep(0);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setPasswordMsg({ text: '', type: '' });
  };

  if (!adminData) return null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', position: 'relative' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '650px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={18} /> กลับไปหน้าแดชบอร์ด
        </button>

        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <div style={{ backgroundColor: '#f3e8ff', padding: '15px', borderRadius: '50%' }}>
              <ShieldCheck color="#7e22ce" size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>ตั้งค่าโปรไฟล์และรหัสผ่าน</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>แก้ไขชื่อแสดงผล หรือเปลี่ยนรหัสผ่านเพื่อความปลอดภัย</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '35px' }}>
            <div>
              <label style={labelStyle}>ชื่อผู้ใช้ (Username) - ไม่สามารถแก้ไขได้</label>
              <input type="text" disabled value={adminData.username} style={{ ...inputStyle, backgroundColor: '#f1f5f9', color: '#94a3b8', cursor: 'not-allowed' }} />
            </div>

            <div>
              <label style={labelStyle}>ชื่อ - นามสกุล (แสดงผลในระบบ)</label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ ...inputStyle, paddingLeft: '40px' }} />
              </div>
            </div>

            <AnimatePresence>
              {profileMsg.text && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: profileMsg.type === 'success' ? '#d1fae5' : '#fee2e2', color: profileMsg.type === 'success' ? '#059669' : '#ef4444', marginTop: '5px' }}>
                    {profileMsg.type === 'success' && <CheckCircle2 size={16} />} {profileMsg.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" style={{ alignSelf: 'flex-start', padding: '10px 20px', backgroundColor: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s' }} onMouseOver={e=>e.currentTarget.style.backgroundColor='#e2e8f0'} onMouseOut={e=>e.currentTarget.style.backgroundColor='#f1f5f9'}>
              <Save size={16} /> บันทึกชื่อโปรไฟล์
            </button>
          </form>

          <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '0 0 30px 0' }}></div>

          {/* 🌟 โซนเปลี่ยนรหัสผ่าน (Step-by-Step UI) */}
          <div style={{ backgroundColor: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <KeyRound size={20} color="#8b5cf6" /> ความปลอดภัยของบัญชี
            </h3>

            <AnimatePresence mode="wait">
              
              {/* สเต็ป 0: ปุ่มเริ่มต้น */}
              {passwordStep === 0 && (
                <motion.div key="step0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                  <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#64748b' }}>
                    รหัสผ่านของคุณถูกเข้ารหัสอย่างปลอดภัย หากต้องการตั้งรหัสผ่านใหม่ โปรดยืนยันตัวตน
                  </p>
                  <button onClick={() => setPasswordStep(1)} type="button" style={{ padding: '10px 20px', backgroundColor: '#white', color: '#7e22ce', border: '1px solid #7e22ce', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e=>{e.currentTarget.style.backgroundColor='#7e22ce'; e.currentTarget.style.color='white';}} onMouseOut={e=>{e.currentTarget.style.backgroundColor='transparent'; e.currentTarget.style.color='#7e22ce';}}>
                    เปลี่ยนรหัสผ่าน
                  </button>
                </motion.div>
              )}

              {/* สเต็ป 1: ถามรหัสผ่านเดิม พร้อมปุ่มดูรหัส */}
              {passwordStep === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                  <label style={{...labelStyle, color: '#ef4444'}}>ยืนยันรหัสผ่านปัจจุบันก่อนดำเนินการ</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    
                    {/* 🌟 ช่องกรอกรหัสเดิมแบบมีปุ่มตา */}
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input 
                        type={showCurrentPassword ? "text" : "password"} 
                        autoFocus 
                        value={currentPassword} 
                        onChange={(e) => setCurrentPassword(e.target.value)} 
                        placeholder="พิมพ์รหัสผ่านปัจจุบันของคุณ..." 
                        style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '45px' }} 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                      >
                        {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    <button onClick={handleVerifyCurrentPassword} type="button" style={{ padding: '12px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      ตรวจสอบ <ArrowRight size={16} />
                    </button>
                    <button onClick={cancelPasswordChange} type="button" style={{ padding: '12px', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <X size={20} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* สเต็ป 2: ตั้งรหัสผ่านใหม่ พร้อมปุ่มดูรหัส */}
              {passwordStep === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ padding: '10px 15px', backgroundColor: '#d1fae5', color: '#059669', borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> ยืนยันตัวตนสำเร็จ กรุณาตั้งรหัสผ่านใหม่
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    
                    {/* 🌟 ช่องกรอกรหัสใหม่แบบมีปุ่มตา */}
                    <div>
                      <label style={labelStyle}>รหัสผ่านใหม่</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type={showNewPassword ? "text" : "password"} 
                          autoFocus 
                          value={newPassword} 
                          onChange={(e) => setNewPassword(e.target.value)} 
                          placeholder="••••••••" 
                          style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '45px' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowNewPassword(!showNewPassword)} 
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* 🌟 ช่องยืนยันรหัสใหม่แบบมีปุ่มตา */}
                    <div>
                      <label style={labelStyle}>ยืนยันรหัสผ่านใหม่อีกครั้ง</label>
                      <div style={{ position: 'relative' }}>
                        <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          value={confirmPassword} 
                          onChange={(e) => setConfirmPassword(e.target.value)} 
                          placeholder="••••••••" 
                          style={{ ...inputStyle, paddingLeft: '40px', paddingRight: '45px' }} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)} 
                          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                    <button onClick={handleSaveNewPassword} type="button" style={{ flex: 1, padding: '12px', backgroundColor: '#7e22ce', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Save size={18} /> บันทึกรหัสผ่านใหม่
                    </button>
                    <button onClick={cancelPasswordChange} type="button" style={{ padding: '12px 20px', backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                      ยกเลิก
                    </button>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>

            {/* แจ้งเตือนของระบบเปลี่ยนรหัส */}
            <AnimatePresence>
              {passwordMsg.text && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto', marginTop: 15 }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '10px 12px', borderRadius: '8px', fontSize: '13px', textAlign: 'center', backgroundColor: passwordMsg.type === 'success' ? '#d1fae5' : passwordMsg.type === 'error' ? '#fee2e2' : '#e0e7ff', color: passwordMsg.type === 'success' ? '#059669' : passwordMsg.type === 'error' ? '#ef4444' : '#4f46e5' }}>
                    {passwordMsg.text}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

        </div>
      </motion.div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '13px', color: '#475569', fontWeight: '600' };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

export default Profile;