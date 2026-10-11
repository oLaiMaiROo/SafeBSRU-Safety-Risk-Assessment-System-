import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, UserPlus, Lock, User, CheckCircle2, ShieldAlert } from 'lucide-react';

const AddAdmin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '', full_name: '' });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ ตรวจสอบสิทธิ์ (แอดมินเท่านั้นถึงจะเพิ่มคนอื่นได้)
  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: 'กำลังสร้างบัญชี...', type: 'info' });

    try {
      const response = await fetch('http://localhost:5000/api/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ text: 'เพิ่มผู้ดูแลระบบคนใหม่สำเร็จ!', type: 'success' });
        setFormData({ username: '', password: '', full_name: '' }); // ล้างฟอร์ม
      } else {
        setMessage({ text: data.message || 'เกิดข้อผิดพลาด', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', position: 'relative' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={18} /> กลับไปหน้าแดชบอร์ด
        </button>

        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <div style={{ backgroundColor: '#dbeafe', padding: '15px', borderRadius: '50%' }}>
              <UserPlus color="#3b82f6" size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>เพิ่มผู้ดูแลระบบ (Admin)</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>สร้างบัญชีผู้ใช้งานใหม่สำหรับเจ้าหน้าที่</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={labelStyle}>ชื่อผู้ใช้ (Username) <span style={{color:'#ef4444'}}>*</span></label>
              <div style={{ position: 'relative' }}>
                <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" name="username" required value={formData.username} onChange={handleChange} placeholder="เช่น admin_somchai" style={{ ...inputStyle, paddingLeft: '40px' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>รหัสผ่าน (Password) <span style={{color:'#ef4444'}}>*</span></label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" name="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: '40px' }} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>ชื่อ - นามสกุล</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="เช่น นายสมชาย ใจดี" style={inputStyle} />
            </div>

            <AnimatePresence>
              {message.text && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '12px', borderRadius: '8px', fontSize: '14px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: message.type === 'success' ? '#d1fae5' : message.type === 'error' ? '#fee2e2' : '#e0e7ff', color: message.type === 'success' ? '#059669' : message.type === 'error' ? '#ef4444' : '#4f46e5' }}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <ShieldAlert size={16} />} {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px', padding: '14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <UserPlus size={20} /> {isSubmitting ? 'กำลังสร้างบัญชี...' : 'สร้างบัญชีผู้ดูแลระบบ'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '14px', color: '#475569', fontWeight: '600' };
const inputStyle = { width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' };

export default AddAdmin;