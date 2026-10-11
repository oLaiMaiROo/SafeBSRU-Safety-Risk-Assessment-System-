import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, ArrowRight, Activity, Lock, User as UserIcon, X } from 'lucide-react';
import AeroShards from './AeroShards';

const Landing = () => {
  const navigate = useNavigate();
  const [isExiting, setIsExiting] = useState(false);
  
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleNavigate = (path) => {
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 800);
  };

  const handleDashboardClick = () => {
    if (sessionStorage.getItem('isAdmin') === 'true') {
      handleNavigate('/dashboard');
    } else {
      setShowLogin(true); 
    }
  };

  // 🌟 เชื่อมต่อ API /api/login เพื่อตรวจสอบกับ PostgreSQL
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // บันทึกสถานะและข้อมูลของแอดมินลง sessionStorage
        sessionStorage.setItem('isAdmin', 'true');
        sessionStorage.setItem('adminUser', JSON.stringify(data.admin));
        
        setShowLogin(false);
        handleNavigate('/dashboard');
      } else {
        setLoginError(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoginError('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ ตรวจสอบว่าเปิด Backend แล้วหรือยัง');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const bgVariants = {
    hidden: { opacity: 0, scale: 1.1 },
    visible: { opacity: 0.8, scale: 1, transition: { duration: 1.5, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 2.5, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } } 
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delayChildren: 0.2, staggerChildren: 0.15 } },
    exit: { opacity: 0, scale: 1.1, filter: 'blur(15px)', transition: { duration: 0.6, ease: 'easeInOut' } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.9, filter: 'blur(10px)' },
    visible: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
      
      {/* 🔮 พื้นหลัง 3D กระจก AeroShards */}
      <motion.div 
        variants={bgVariants}
        initial="hidden"
        animate={isExiting ? "exit" : "visible"}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}
      >
        <AeroShards
          backgroundColor="#f8fafc" 
          shardColor="#c084fc"      
          accentColor="#7e22ce"     
          placement="full"
          flow="stream"
          material="pearl"
          detail="balanced"
          effect="none"
          scale={1.5}               
          spread={1.2}
          depth={1.5}
          speed={1}                 
          interaction="repel"       
          density={1.2}
        />
      </motion.div>

      {/* เนื้อหาหน้าเว็บหลัก */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate={isExiting ? "exit" : "visible"}
        style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center', padding: '0 20px' }}
      >
        <motion.div variants={itemVariants} style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', padding: '20px', borderRadius: '50%', marginBottom: '20px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 30px rgba(126, 34, 206, 0.15)', border: '1px solid #e2e8f0' }}>
          <ShieldAlert color="#7e22ce" size={60} />
        </motion.div>

        <motion.h1 variants={itemVariants} style={{ fontSize: '52px', fontWeight: '800', color: '#0f172a', margin: '0 0 15px 0', letterSpacing: '-1px' }}>
          Safety Risk Assessment
        </motion.h1>
        
        <motion.p variants={itemVariants} style={{ fontSize: '18px', color: '#475569', maxWidth: '700px', lineHeight: '1.6', marginBottom: '40px', backgroundColor: 'rgba(255, 255, 255, 0.75)', padding: '15px 25px', borderRadius: '50px', backdropFilter: 'blur(8px)', border: '1px solid rgba(226, 232, 240, 0.8)' }}>
          ระบบรายงานแจ้งเหตุการเกิดอุบัติเหตุภายในมหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา
        </motion.p>

        <motion.div variants={itemVariants} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => handleNavigate('/report')}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px', fontSize: '16px', fontWeight: '600', color: 'white', backgroundColor: '#7e22ce', border: 'none', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(126, 34, 206, 0.3)', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.transform = 'translateY(-3px)'; e.target.style.boxShadow = '0 15px 30px rgba(126, 34, 206, 0.4)'; }}
            onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 10px 25px rgba(126, 34, 206, 0.3)'; }}
          >
            <Activity size={20} /> หน้าฟอร์มแจ้งอุบัติเหตุ
          </button>
          
          <button 
            onClick={handleDashboardClick}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 32px', fontSize: '16px', fontWeight: '600', color: '#334155', backgroundColor: 'white', border: '2px solid #e2e8f0', borderRadius: '50px', cursor: 'pointer', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}
            onMouseOver={(e) => { e.target.style.transform = 'translateY(-3px)'; e.target.style.borderColor = '#cbd5e1'; }}
            onMouseOut={(e) => { e.target.style.transform = 'translateY(0)'; e.target.style.borderColor = '#e2e8f0'; }}
          >
            <Lock size={20} /> เข้าสู่ระบบ <ArrowRight size={18} />
          </button>
        </motion.div>
      </motion.div>

      {/* 🔐 Popup สำหรับเข้าสู่ระบบ Admin */}
      <AnimatePresence>
        {showLogin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(5px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 999 }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              style={{ backgroundColor: 'white', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', position: 'relative' }}
            >
              <button 
                onClick={() => { setShowLogin(false); setLoginError(''); }}
                style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={24} />
              </button>

              <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ backgroundColor: '#f3e8ff', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto' }}>
                  <Lock size={30} color="#7e22ce" />
                </div>
                <h2 style={{ margin: '0 0 5px 0', color: '#0f172a', fontSize: '24px' }}>เข้าสู่ระบบสำหรับ Admin</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>โปรดใส่ไอดีและรหัสผ่านที่ได้รับจากระบบ</p>
              </div>

              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>ชื่อผู้ใช้</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="text" 
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                      placeholder="เช่น admin"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#475569', fontWeight: '500' }}>รหัสผ่าน</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '15px', boxSizing: 'border-box' }}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {loginError && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', backgroundColor: '#fee2e2', padding: '10px', borderRadius: '8px' }}>
                    {loginError}
                  </motion.div>
                )}

                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  style={{ width: '100%', padding: '14px', backgroundColor: isLoggingIn ? '#a855f7' : '#7e22ce', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: isLoggingIn ? 'not-allowed' : 'pointer', marginTop: '10px', transition: 'background 0.2s' }}
                  onMouseOver={(e) => !isLoggingIn && (e.currentTarget.style.backgroundColor = '#6b21a8')}
                  onMouseOut={(e) => !isLoggingIn && (e.currentTarget.style.backgroundColor = '#7e22ce')}
                >
                  {isLoggingIn ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Landing;