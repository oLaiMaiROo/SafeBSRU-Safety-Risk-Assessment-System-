import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, ShieldCheck, Circle, AlertCircle } from 'lucide-react';

const AdminList = () => {
  const navigate = useNavigate();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // 🌟 ดึงข้อมูลตัวเองจาก Session เพื่อเอามาเช็คว่าแถวไหนคือเรา
  const currentUser = JSON.parse(sessionStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/');
    } else {
      fetchAdmins();
    }
  }, [navigate]);

  const fetchAdmins = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admins');
      const data = await response.json();
      
      // ดักจับ Error เผื่อลืมรัน SQL หรือลืมรีสตาร์ทเซิร์ฟเวอร์
      if (Array.isArray(data)) {
        setAdmins(data);
      } else {
        setErrorMsg('ดึงข้อมูลไม่ได้ (โปรดตรวจสอบว่ารีสตาร์ท Backend หรือยัง)');
      }
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      setErrorMsg('ไม่สามารถเชื่อมต่อฐานข้อมูลได้');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '40px 20px', position: 'relative' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '15px', marginBottom: '20px', padding: 0 }}>
          <ArrowLeft size={18} /> กลับไปหน้าแดชบอร์ด
        </button>

        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 10px 40px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #f1f5f9', paddingBottom: '20px' }}>
            <div style={{ backgroundColor: '#eff6ff', padding: '15px', borderRadius: '50%' }}>
              <Users color="#3b82f6" size={32} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a' }}>ผู้ดูแลระบบทั้งหมดในระบบ</h1>
              <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '14px' }}>รายชื่อผู้ใช้งานและสถานะการออนไลน์</p>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: '#64748b' }}>กำลังโหลดข้อมูล...</p>
          ) : errorMsg ? (
            <div style={{ backgroundColor: '#fee2e2', color: '#ef4444', padding: '15px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} /> {errorMsg}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '14px' }}>
                    <th style={{ padding: '15px 10px' }}>สถานะ</th>
                    <th style={{ padding: '15px 10px' }}>ชื่อผู้ใช้ (Username)</th>
                    <th style={{ padding: '15px 10px' }}>ชื่อ - นามสกุล</th>
                    <th style={{ padding: '15px 10px' }}>สิทธิ์</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length > 0 ? admins.map((admin) => {
                    const isMe = admin.id === currentUser.id; // เช็คว่าบรรทัดนี้คือเราไหม
                    return (
                      <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: isMe ? '#f8fafc' : 'transparent' }}>
                        <td style={{ padding: '15px 10px' }}>
                          {admin.is_online ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '14px', fontWeight: '600', backgroundColor: '#d1fae5', padding: '6px 12px', borderRadius: '50px', width: 'fit-content' }}>
                              <Circle size={10} fill="#10b981" /> ออนไลน์
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '14px', fontWeight: '500', backgroundColor: '#f1f5f9', padding: '6px 12px', borderRadius: '50px', width: 'fit-content' }}>
                              <Circle size={10} /> ออฟไลน์
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '15px 10px', color: '#0f172a', fontWeight: '600' }}>
                          {admin.username}
                          {/* 🌟 ถ้าเป็นชื่อเรา ให้โชว์ป้ายกำกับ (คุณ) */}
                          {isMe && <span style={{ marginLeft: '10px', fontSize: '12px', backgroundColor: '#dbeafe', color: '#2563eb', padding: '3px 8px', borderRadius: '12px' }}>(คุณ)</span>}
                        </td>
                        <td style={{ padding: '15px 10px', color: '#475569' }}>{admin.full_name || 'ไม่ได้ระบุ'}</td>
                        <td style={{ padding: '15px 10px' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#7e22ce', fontSize: '13px', fontWeight: '600' }}>
                            <ShieldCheck size={16} /> Admin
                          </span>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ยังไม่มีข้อมูลผู้ใช้งาน</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AdminList;