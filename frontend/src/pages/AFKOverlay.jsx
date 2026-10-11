import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AeroShards from './AeroShards';

const AFKOverlay = () => {
  const [isAFK, setIsAFK] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);

  // ⏱️ ตั้งเวลาเทส 10 วินาที (10000 ms)
  const IDLE_TIME = 10 * 60 * 1000;; 

  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      
      // เอาไว้เช็คใน F12 ว่าระบบเริ่มนับเวลาใหม่ไหม
      console.log("เริ่มนับเวลา AFK ใหม่..."); 
      
      timeout = setTimeout(() => {
        console.log("หมดเวลา! โชว์หน้า 3D");
        setIsAFK(true);
      }, IDLE_TIME);
    };

    // ถ้าเข้าหน้า 3D ไปแล้ว ให้หยุดจับการขยับเมาส์ไปเลย จะได้ไม่รวน
    if (isAFK) return;

    // ดักจับการเคลื่อนไหว (แอบตัด mousemove ออกชั่วคราวเพื่อเทสว่าเมาส์หลอนไหม)
    const events = ['keydown', 'click', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    resetTimer(); // สั่งรันครั้งแรกตอนโหลดเว็บ

    return () => {
      clearTimeout(timeout);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [isAFK]);

  const handleWakeUp = () => {
    if (!isAFK || isWakingUp) return;
    setIsWakingUp(true);
    
    setTimeout(() => {
      setIsAFK(false);
      setIsWakingUp(false);
    }, 800); 
  };

  return (
    <AnimatePresence>
      {isAFK && (
        <motion.div
          key="afk-screen" // 🌟 เพิ่ม Key บังคับให้ Framer Motion รู้ว่าต้องเรนเดอร์
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }} 
          transition={{ duration: 0.8, ease: "easeInOut" }}
          onClick={handleWakeUp}
          style={{
            position: 'fixed',
            top: 0, left: 0, width: '100vw', height: '100vh',
            zIndex: 99999, // ทับทุกสิ่ง
            backgroundColor: '#0f172a',
            cursor: 'pointer'
          }}
        >
          <AeroShards
            backgroundColor="#0f172a" 
            shardColor="#c084fc"      
            accentColor="#d8b4fe"     
            placement="full"
            flow="stream"
            material="pearl"
            detail="balanced"
            effect="none"
            scale={1.5}               
            spread={1.2}
            depth={1.5}
            speed={0.3} 
            interaction="repel"       
            density={1.2}
            rippleIntensity={3} 
          />
          <motion.div 
            animate={isWakingUp ? { opacity: 0 } : { opacity: [0.2, 0.8, 0.2] }} 
            transition={{ repeat: Infinity, duration: 3 }}
            style={{ position: 'absolute', bottom: '50px', width: '100%', textAlign: 'center', color: 'white', letterSpacing: '3px', fontSize: '14px', fontWeight: '300', pointerEvents: 'none' }}
          >
            คลิกหน้าจอเพื่อกลับสู่ระบบ
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AFKOverlay;