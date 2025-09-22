import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const appId = 'mtc-attendance-app';

export const DIEM_DIEM_DANH = {
  "đúng giờ": 3,
  "trễ 15 phút": 2,
  "trễ 30 phút": 1,
  "vắng mặt": 0
};

function getCurrentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

function generateMonthOptions() {
  const options = [];
  const currentYear = new Date().getFullYear();
  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0');
      options.push({
        value: `${year}-${monthStr}`,
        label: `Tháng ${monthStr}/${year}`
      });
    }
  }
  return options;
}

export function useAttendanceRecords(db, students, LOP_LIST) {
  const [selectedNganh, setSelectedNganh] = useState("Tất cả");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentAttendance, setCurrentAttendance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  // Lấy tất cả Chủ Nhật trong tháng
  const getSundaysInMonth = (year, month) => {
    const sundays = [];
    const date = new Date(year, month - 1, 1);
    while (date.getMonth() === month - 1) {
      if (date.getDay() === 0) {
        sundays.push(date.toISOString().split('T')[0]);
      }
      date.setDate(date.getDate() + 1);
    }
    return sundays;
  };

  // Load điểm danh khi chọn ngày
  useEffect(() => {
    const loadAttendance = async () => {
      if (!db || !selectedDate) return;

      try {
        const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, selectedDate);
        const docSnapshot = await getDoc(attendanceDocRef);

        if (docSnapshot.exists()) {
          setCurrentAttendance(docSnapshot.data());
        } else {
          setCurrentAttendance({});
        }
      } catch (error) {
        console.error("Lỗi khi tải điểm danh:", error);
        setCurrentAttendance({});
      }
    };

    loadAttendance();
  }, [db, selectedDate]);

  // Lưu điểm danh
  const handleSaveAttendance = async () => {
    if (!db || !selectedDate) return;

    try {
      const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, selectedDate);

      // Chỉ lưu những học sinh có thay đổi
      const attendanceToSave = { ...currentAttendance };

      await setDoc(attendanceDocRef, attendanceToSave);
      alert("✅ Đã lưu điểm danh thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu điểm danh:", error);
      alert("❌ Lỗi khi lưu điểm danh: " + error.message);
    }
  };

  // Tính báo cáo tháng
  const calculateReport = useCallback(async () => {
    if (!db) return { reportData: [], monthInfo: {} };

    const [year, month] = selectedMonth.split('-').map(Number);
    const sundays = getSundaysInMonth(year, month);

    // Tạo cấu trúc báo cáo ban đầu
    const reportData = students.map(student => ({
      ...student,
      attendanceDays: 0,
      totalScore: 0,
      attendanceDetails: sundays.reduce((acc, sunday) => {
        acc[sunday] = { present: "vắng mặt", holyBouquet: false, uniform: false, score: 0 };
        return acc;
      }, {})
    }));

    // Lấy dữ liệu điểm danh cho tất cả Chủ Nhật trong tháng
    for (const sunday of sundays) {
      try {
        const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, sunday);
        const docSnapshot = await getDoc(attendanceDocRef);

        if (docSnapshot.exists()) {
          const attendanceData = docSnapshot.data();

          Object.entries(attendanceData).forEach(([studentId, attendance]) => {
            const studentReport = reportData.find(s => s.id === studentId);
            if (studentReport && attendance) {
              let score = DIEM_DIEM_DANH[attendance.present] || 0;
              if (attendance.holyBouquet) score += 1;
              if (attendance.uniform) score += 1;

              studentReport.attendanceDetails[sunday] = {
                present: attendance.present,
                holyBouquet: attendance.holyBouquet,
                uniform: attendance.uniform,
                score: score
              };

              studentReport.totalScore += score;
            }
          });
        }
      } catch (error) {
        console.error(`Lỗi khi tải điểm danh ngày ${sunday}:`, error);
      }
    }

    return {
      reportData: reportData.sort((a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)),
      monthInfo: { year, month },
      sundays: sundays
    };
  }, [db, students, selectedMonth, LOP_LIST]);

  return {
    selectedNganh,
    setSelectedNganh,
    selectedDate,
    setSelectedDate,
    currentAttendance,
    setCurrentAttendance,
    selectedMonth,
    setSelectedMonth,
    generateMonthOptions,
    handleSaveAttendance,
    calculateReport,
    getSundaysInMonth
  };
}