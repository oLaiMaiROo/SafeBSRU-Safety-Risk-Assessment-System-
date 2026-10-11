import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, animate, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Plus, FileText, ShieldAlert, AlertTriangle, FileSearch, TrendingUp, Search, CheckCircle2, AlertCircle, LogOut, User, UserPlus, Users, Download, CalendarDays } from 'lucide-react';

const AnimatedCounter = ({ from = 0, to }) => {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    let startTime;
    let animationFrame;
    const updateCount = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 1500, 1);
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(from + (to - from) * easeOut));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };
    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [from, to]);

  return <span>{count}</span>;
};

const TiltCard = ({ children, style }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 400, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 400, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          ...style
        }}
        whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
        className="print-card"
      >
        <div style={{ transform: "translateZ(40px)" }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [timeFilter, setTimeFilter] = useState('all');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const adminData = JSON.parse(sessionStorage.getItem('adminUser') || '{}');

  useEffect(() => {
    if (sessionStorage.getItem('isAdmin') !== 'true') {
      navigate('/'); 
    }
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/api/reports')
      .then(res => res.json())
      .then(data => {
        setReports(data);
        setTimeout(() => setLoading(false), 800); 
      })
      .catch(err => {
        console.error('Error fetching data:', err);
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    if (adminData.id) {
      try {
        await fetch('http://localhost:5000/api/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: adminData.id })
        });
      } catch (err) { console.error("Error setting offline status:", err); }
    }
    sessionStorage.removeItem('isAdmin');
    sessionStorage.removeItem('adminUser');
    navigate('/');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const getSeverityBadge = (severityStr) => {
    const str = severityStr || '';
    if (str.includes('🔴')) return { label: '🔴 ระดับวิกฤต', bg: '#fee2e2', text: '#ef4444' };
    if (str.includes('🟡')) return { label: '🟡 ระดับเฝ้าระวัง', bg: '#fef3c7', text: '#d97706' };
    if (str.includes('🟢')) return { label: '🟢 ระดับต่ำ', bg: '#d1fae5', text: '#059669' };
    return { label: str || 'ไม่ระบุ', bg: '#f1f5f9', text: '#64748b' };
  };

  // กรองข้อมูลตามช่วงเวลา
  const filteredReports = useMemo(() => {
    const now = new Date();
    return reports.filter(r => {
      if (timeFilter === 'all') return true;
      const reportDate = new Date(r.created_at);
      const diffTime = Math.abs(now - reportDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (timeFilter === '1m') return diffDays <= 30;
      if (timeFilter === '3m') return diffDays <= 90;
      if (timeFilter === '6m') return diffDays <= 180;
      return true;
    });
  }, [reports, timeFilter]);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}>
          <ShieldAlert color="#7e22ce" size={80} />
        </motion.div>
        <motion.h3 animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ color: '#7e22ce', marginTop: '20px', letterSpacing: '1px' }}>
          กำลังประมวลผลข้อมูลสถิติ...
        </motion.h3>
      </div>
    );
  }

  const timeLabel = timeFilter === 'all' ? 'ทั้งหมด' : timeFilter === '1m' ? '1 เดือนล่าสุด' : timeFilter === '3m' ? '3 เดือนล่าสุด' : '6 เดือนล่าสุด';

  const totalReports = filteredReports.length;
  const lowRisk = filteredReports.filter(r => r.severity_color && r.severity_color.includes('🟢')).length;
  const mediumRisk = filteredReports.filter(r => r.severity_color && r.severity_color.includes('🟡')).length;
  const highRisk = filteredReports.filter(r => r.severity_color && r.severity_color.includes('🔴')).length;

  const severityCount = filteredReports.reduce((acc, curr) => {
    const color = curr.severity_color || 'ไม่ระบุ';
    acc[color] = (acc[color] || 0) + 1;
    return acc;
  }, {});
  const pieChartData = Object.keys(severityCount).map(key => ({ name: key, value: severityCount[key] }));
  
  const getPieColor = (severityName) => {
    if (!severityName) return '#94a3b8';
    if (severityName.includes('🔴')) return '#ef4444';
    if (severityName.includes('🟡')) return '#f59e0b';
    if (severityName.includes('🟢')) return '#10b981';
    return '#8b5cf6';
  };

  const facultyCount = filteredReports.reduce((acc, curr) => {
    const fac = curr.faculty || 'ไม่ระบุสังกัด';
    acc[fac] = (acc[fac] || 0) + 1;
    return acc;
  }, {});
  const barChartData = Object.keys(facultyCount).map(key => ({ name: key, value: facultyCount[key] }));

  // 🌟 อัลกอริทึมวาดกราฟเส้น: สร้างวันที่ล่วงหน้าและเติมเลข 0 ให้ครบทุกวัน
  const lineChartData = (() => {
    const now = new Date();
    let startDate = new Date();

    if (timeFilter === '1m') startDate.setDate(now.getDate() - 30);
    else if (timeFilter === '3m') startDate.setDate(now.getDate() - 90);
    else if (timeFilter === '6m') startDate.setDate(now.getDate() - 180);
    else {
      if (filteredReports.length > 0) {
        const dates = filteredReports.map(r => new Date(r.created_at).getTime());
        startDate = new Date(Math.min(...dates));
      } else {
        startDate.setDate(now.getDate() - 7); 
      }
    }

    startDate.setHours(0,0,0,0);
    const endDate = new Date();
    endDate.setHours(23,59,59,999);

    const dateMap = {};
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
      dateMap[dateStr] = 0; // เติม 0 ไว้ก่อนทุกวัน
    }

    filteredReports.forEach(r => {
      if(!r.created_at) return;
      const d = new Date(r.created_at);
      const dateStr = d.toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });
      if(dateMap[dateStr] !== undefined) {
        dateMap[dateStr] += 1;
      } else {
        dateMap[dateStr] = 1;
      }
    });

    return Object.keys(dateMap).map(key => ({ date: key, count: dateMap[key] }));
  })();

  const recentReports = [...filteredReports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
  const cardStyle = { backgroundColor: 'rgba(255,255,255,0.9)', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', backdropFilter: 'blur(10px)', boxShadow: "0 4px 15px rgba(0,0,0,0.02)" };

  const handleExportExcelStats = () => {
    let csvContent = "\uFEFF"; 

    csvContent += "รายงานสรุปสถิติความเสี่ยงและอุบัติเหตุ (BSRU)\n";
    csvContent += `ข้อมูล ณ วันที่: ${new Date().toLocaleDateString('th-TH')}\n`;
    csvContent += `ช่วงเวลาที่กรอง: ${timeLabel}\n\n`;

    csvContent += "--- สรุปภาพรวม ---\n";
    csvContent += `การแจ้งเหตุทั้งหมด,${totalReports} รายการ\n`;
    csvContent += `อุบัติเหตุผลกระทบระดับต่ำ,${lowRisk} รายการ\n`;
    csvContent += `อุบัติเหตุระดับเฝ้าระวัง,${mediumRisk} รายการ\n`;
    csvContent += `อุบัติเหตุระดับวิกฤต,${highRisk} รายการ\n\n`;

    csvContent += "--- สถิติรายวัน (ความถี่ในการเกิดเหตุ) ---\n";
    csvContent += "วันที่ (วัน/เดือน/ปี),จำนวนการแจ้งเหตุ (ครั้ง)\n";
    lineChartData.forEach(d => { csvContent += `${d.date},${d.count}\n`; });
    csvContent += "\n";

    csvContent += "--- สถิติแยกตามสังกัด/หน่วยงาน ---\n";
    csvContent += "สังกัด/หน่วยงาน,จำนวนการแจ้งเหตุ (ครั้ง)\n";
    barChartData.forEach(d => { csvContent += `${d.name},${d.value}\n`; });
    csvContent += "\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `สรุปสถิติอุบัติเหตุ_${timeFilter}.csv`;
    link.click();
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', width: '100vw', backgroundColor: '#f8fafc', overflowX: 'hidden', padding: '40px 20px 20px 20px', boxSizing: 'border-box', color: '#1e293b', display: 'flex', flexDirection: 'column' }}>
      
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background-color: white !important; }
            .print-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; break-inside: avoid; transform: none !important; }
            .charts-grid { display: block !important; } 
            .charts-grid > div { margin-bottom: 20px !important; }
          }
        `}
      </style>

      <motion.div className="no-print" animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }} transition={{ repeat: Infinity, duration: 20, ease: "easeInOut" }} style={{ position: 'absolute', top: '10%', left: '20%', width: '400px', height: '400px', backgroundColor: '#e9d5ff', borderRadius: '50%', filter: 'blur(100px)', opacity: 0.5, zIndex: 0 }} />
      <motion.div className="no-print" animate={{ x: [0, -40, 40, 0], y: [0, 50, -30, 0] }} transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }} style={{ position: 'absolute', bottom: '10%', right: '15%', width: '500px', height: '500px', backgroundColor: '#ddd6fe', borderRadius: '50%', filter: 'blur(120px)', opacity: 0.5, zIndex: 0 }} />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10, flex: 1, width: '100%' }}>
        
        {/* ส่วนหัว */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px', color: '#0f172a', letterSpacing: '-0.5px' }}>
              <ShieldAlert color="#7e22ce" size={36} className="no-print" /> รายงานสรุปสถิติความเสี่ยง
            </h1>
            <p className="no-print" style={{ margin: '5px 0 0 46px', color: '#64748b', fontSize: '15px' }}>
              ภาพรวมข้อมูลสำหรับผู้ดูแลระบบ
            </p>
          </div>
          
          <div className="no-print" style={{ position: 'relative' }} ref={dropdownRef}>
            <motion.button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ width: '46px', height: '46px', borderRadius: '50%', backgroundColor: '#f3e8ff', border: '2px solid #d8b4fe', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', padding: 0, boxShadow: '0 4px 10px rgba(126, 34, 206, 0.15)' }}
            >
              <User size={22} color="#7e22ce" />
            </motion.button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2 }}
                  style={{ position: 'absolute', top: '55px', right: 0, width: '220px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', overflow: 'hidden', zIndex: 100 }}
                >
                  <div style={{ padding: '15px', borderBottom: '1px solid #f1f5f9', backgroundColor: '#faf5ff' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>ล็อกอินในชื่อ:</p>
                    <p style={{ margin: '2px 0 0 0', fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>{adminData.full_name || adminData.username || 'Admin'}</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => navigate('/profile')} style={dropdownBtnStyle}><User size={16} /> ตั้งค่าโปรไฟล์</button>
                    <button onClick={() => navigate('/add-admin')} style={dropdownBtnStyle}><UserPlus size={16} /> เพิ่มผู้ดูแลระบบใหม่</button>
                    <button onClick={() => navigate('/admin-list')} style={dropdownBtnStyle}><Users size={16} /> ผู้ดูแลระบบทั้งหมด</button>
                    <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }}></div>
                    <button onClick={handleLogout} style={{ ...dropdownBtnStyle, color: '#ef4444' }}><LogOut size={16} /> ออกจากระบบ</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* แถบเครื่องมือ Toolbar (ตัวกรอง และ ปุ่ม Action) */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '16px 24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', marginBottom: '30px', flexWrap: 'wrap', gap: '15px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarDays size={16} color="#8b5cf6" /> กรองข้อมูล:
            </span>
            <select 
              value={timeFilter} 
              onChange={(e) => setTimeFilter(e.target.value)}
              style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#334155', fontSize: '14px', fontWeight: '500', cursor: 'pointer', outline: 'none', minWidth: '160px' }}
            >
              <option value="all">ระยะเวลาทั้งหมด</option>
              <option value="1m">1 เดือนล่าสุด</option>
              <option value="3m">3 เดือนล่าสุด</option>
              <option value="6m">6 เดือนล่าสุด</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <motion.button onClick={() => navigate('/report-list')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              <Search size={16} color="#8b5cf6" /> ค้นหาข้อมูล
            </motion.button>
            <motion.button onClick={handleExportExcelStats} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              <Download size={16} color="#10b981" /> Export Excel
            </motion.button>
            <motion.button onClick={handleExportPDF} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#334155', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              <FileText size={16} color="#3b82f6" /> Export PDF
            </motion.button>
            <div style={{ width: '1px', backgroundColor: '#e2e8f0', margin: '0 5px' }}></div>
            <motion.button onClick={() => navigate('/report')} whileHover={{ scale: 1.05, boxShadow: "0 4px 15px rgba(126,34,206,0.3)" }} whileTap={{ scale: 0.95 }} style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', backgroundColor: '#7e22ce', color: 'white', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
              <Plus size={16} /> แจ้งเหตุใหม่
            </motion.button>
          </div>
        </div>

        {/* กล่องตัวเลข */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          <TiltCard style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '15px', marginBottom: '12px', fontWeight: '500' }}>การแจ้งเหตุ ({timeLabel})</div>
            <div style={{ fontSize: '38px', fontWeight: '700', color: '#0f172a' }}>
              <AnimatedCounter to={totalReports} /> <span style={{fontSize:'16px', color:'#94a3b8', fontWeight:'500'}}>รายการ</span>
            </div>
          </TiltCard>
          <TiltCard style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '15px', marginBottom: '12px', fontWeight: '500' }}><CheckCircle2 size={18} color="#10b981" /> ผลกระทบระดับต่ำ</div>
            <div style={{ fontSize: '38px', fontWeight: '700', color: '#10b981' }}>
              <AnimatedCounter to={lowRisk} /> <span style={{fontSize:'16px', color:'#94a3b8', fontWeight:'500'}}>รายการ</span>
            </div>
          </TiltCard>
          <TiltCard style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '15px', marginBottom: '12px', fontWeight: '500' }}><AlertCircle size={18} color="#f59e0b" /> ระดับเฝ้าระวัง</div>
            <div style={{ fontSize: '38px', fontWeight: '700', color: '#f59e0b' }}>
              <AnimatedCounter to={mediumRisk} /> <span style={{fontSize:'16px', color:'#94a3b8', fontWeight:'500'}}>รายการ</span>
            </div>
          </TiltCard>
          <TiltCard style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '15px', marginBottom: '12px', fontWeight: '500' }}><AlertTriangle size={18} color="#ef4444" /> ระดับวิกฤต</div>
            <div style={{ fontSize: '38px', fontWeight: '700', color: '#ef4444' }}>
              <AnimatedCounter to={highRisk} /> <span style={{fontSize:'16px', color:'#94a3b8', fontWeight:'500'}}>รายการ</span>
            </div>
          </TiltCard>
        </div>

        {/* 🌟 กราฟเส้น */}
        <motion.div className="print-card" whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.04)" }} style={cardStyle}>
          <h3 style={{ marginTop: 0, color: '#334155', fontSize: '16px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} color="#3b82f6"/> สถิติจำนวนการแจ้งเหตุรายวัน <span style={{color: '#94a3b8', fontWeight: 'normal', fontSize: '14px'}}>({timeLabel})</span>
          </h3>
          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                {/* minTickGap={30} ป้องกันวันที่ซ้อนทับกันถ้ามีจำนวนวันเยอะๆ */}
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} minTickGap={30} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 13}} allowDecimals={false} />
                <Tooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'}} formatter={(value) => [`${value} ครั้ง`, 'จำนวนการแจ้ง']} labelStyle={{fontWeight: 'bold', color: '#0f172a', marginBottom: '5px'}} />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: 'white'}} activeDot={{r: 7, fill: '#2563eb'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* กราฟแท่งและกราฟวงกลม */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
          
          <motion.div className="print-card" whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.04)" }} style={cardStyle}>
            <h3 style={{ marginTop: 0, color: '#334155', fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              คณะ | สำนัก | หน่วยงาน <span style={{color: '#94a3b8', fontWeight: 'normal', fontSize: '14px'}}>({timeLabel})</span>
            </h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} angle={-25} textAnchor="end" />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} allowDecimals={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}} formatter={(value) => [`${value} รายการ`, 'จำนวน']} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div className="print-card" whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.04)" }} style={cardStyle}>
            <h3 style={{ marginTop: 0, color: '#334155', fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>
              สัดส่วนระดับความรุนแรง <span style={{color: '#94a3b8', fontWeight: 'normal', fontSize: '14px'}}>({timeLabel})</span>
            </h3>
            <div style={{ height: '280px', width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieChartData} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="value" stroke="none">
                    {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={getPieColor(entry.name)} />)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}} formatter={(value) => [`${value} รายการ`, 'จำนวน']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        <motion.div className="print-card" whileHover={{ boxShadow: "0 15px 30px rgba(0,0,0,0.04)" }} style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0, color: '#334155', fontSize: '18px', fontWeight: '600' }}>
              รายการแจ้งเหตุล่าสุด <span style={{color: '#94a3b8', fontWeight: 'normal', fontSize: '14px'}}>(สูงสุด 5 อันดับจากข้อมูลที่กรอง)</span>
            </h3>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 8px' }}>วันที่แจ้ง</th>
                  <th style={{ padding: '12px 8px' }}>ผู้แจ้ง</th>
                  <th style={{ padding: '12px 8px' }}>สถานที่แจ้ง</th>
                  <th style={{ padding: '12px 8px' }}>ลักษณะอุบัติเหตุ</th>
                  <th style={{ padding: '12px 8px' }}>ความรุนแรง</th>
                  <th className="no-print" style={{ padding: '12px 8px', textAlign: 'center' }}>แอ็กชัน</th>
                </tr>
              </thead>
              <tbody>
                {recentReports.length > 0 ? recentReports.map((report) => {
                  const badge = getSeverityBadge(report.severity_color);
                  return (
                    <tr key={report.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 8px', color: '#475569', fontSize: '14px' }}>
                        {new Date(report.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td style={{ padding: '14px 8px', color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>
                        {report.reporter_name || 'ไม่ระบุชื่อ'}
                      </td>
                      <td style={{ padding: '14px 8px', color: '#475569', fontSize: '14px' }}>
                        {report.location}
                      </td>
                      <td style={{ padding: '14px 8px', color: '#475569', fontSize: '14px' }}>
                        {report.risk_category}
                      </td>
                      <td style={{ padding: '14px 8px', whiteSpace: 'nowrap' }}>
                        <span style={{ 
                          display: 'inline-block', padding: '6px 12px', borderRadius: '50px', fontSize: '13px', fontWeight: '600',
                          backgroundColor: badge.bg, color: badge.text
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="no-print" style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <button 
                          onClick={() => navigate(`/report-detail/${report.id}`)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }}
                        >
                          <FileSearch size={14} /> รายละเอียด
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>ไม่มีรายการแจ้งเหตุในช่วงเวลานี้</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div className="no-print" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(226, 232, 240, 0.6)', textAlign: 'center', color: '#64748b', fontSize: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: '500', color: '#475569' }}>© 2026 Safety Risk Assessment System</span>
          <span>มหาวิทยาลัยราชภัฏบ้านสมเด็จเจ้าพระยา (Bansomdejchaopraya Rajabhat University)</span>
        </motion.div>

      </motion.div>
    </div>
  );
};

const dropdownBtnStyle = {
  width: '100%', padding: '12px 15px', background: 'none', border: 'none',
  display: 'flex', alignItems: 'center', gap: '10px', color: '#334155',
  fontSize: '14px', fontWeight: '500', cursor: 'pointer', textAlign: 'left',
  transition: 'background-color 0.2s'
};

export default Dashboard;