export const API_URL = 'http://localhost:5000';

export const imageUrl = (fileName) => `${API_URL}/uploads/${encodeURIComponent(fileName)}`;

// อ่านข้อความ error ที่ backend ส่งมา (ถ้ามี) เพื่อแสดงให้ผู้ใช้เห็นว่าผิดตรงไหน
export const readApiError = async (response, fallback) => {
  try {
    const body = await response.json();
    return body.error || body.message || fallback;
  } catch {
    return fallback;
  }
};

// ---------- การเข้าสู่ระบบของแอดมิน (เก็บใน sessionStorage หายเมื่อปิดแท็บ) ----------

export const saveAdminSession = ({ admin, token }) => {
  sessionStorage.setItem('isAdmin', 'true');
  sessionStorage.setItem('adminUser', JSON.stringify(admin));
  sessionStorage.setItem('authToken', token);
};

export const clearAdminSession = () => {
  sessionStorage.removeItem('isAdmin');
  sessionStorage.removeItem('adminUser');
  sessionStorage.removeItem('authToken');
};

// fetch สำหรับ API ของแอดมิน: แนบ token ทุกครั้ง
// ถ้าเซิร์ฟเวอร์ตอบ 401 (ไม่ได้ล็อกอิน หรือ token หมดอายุ) จะล้างการเข้าสู่ระบบแล้วพากลับหน้าแรก
export const authFetch = async (path, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = sessionStorage.getItem('authToken');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (response.status === 401) {
    clearAdminSession();
    window.location.assign('/');
    return new Promise(() => {}); // หยุดโค้ดที่เรียกไว้ตรงนี้ ไม่ให้ขึ้น error ระหว่างกำลังเปลี่ยนหน้า
  }
  return response;
};
