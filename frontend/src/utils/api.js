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
