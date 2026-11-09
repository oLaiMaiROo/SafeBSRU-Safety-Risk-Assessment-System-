import { useEffect, useMemo, useState } from 'react';
import { API_URL } from './api';

// กลุ่มที่นักศึกษาเลือกได้ (บุคลากรเลือกได้ทุกกลุ่ม)
export const STUDENT_DEPARTMENT_GROUP = 'คณะและวิทยาลัย';

// โหลดรายชื่อหน่วยงานครั้งเดียวต่อการเปิดเว็บ แล้วใช้ร่วมกันทุกหน้า
let departmentsRequest = null;
const loadDepartments = () => {
  if (!departmentsRequest) {
    departmentsRequest = fetch(`${API_URL}/api/departments`)
      .then((res) => {
        if (!res.ok) throw new Error('โหลดรายชื่อหน่วยงานไม่สำเร็จ');
        return res.json();
      })
      .catch((err) => {
        departmentsRequest = null; // ให้ลองโหลดใหม่ได้ครั้งหน้า
        throw err;
      });
  }
  return departmentsRequest;
};

// [{ group: 'คณะและวิทยาลัย', items: [{ id, name, group_name }, ...] }, ...] ตามลำดับจากฐานข้อมูล
const groupDepartments = (departments) => {
  const groups = [];
  departments.forEach((dept) => {
    let group = groups.find((g) => g.group === dept.group_name);
    if (!group) {
      group = { group: dept.group_name, items: [] };
      groups.push(group);
    }
    group.items.push(dept);
  });
  return groups;
};

export const useDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    loadDepartments()
      .then((rows) => { if (active) setDepartments(rows); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  const groups = useMemo(() => groupDepartments(departments), [departments]);
  return { departments, groups, error };
};
