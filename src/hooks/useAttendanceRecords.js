import { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';

const appId = 'mtc-attendance-app';

export const DIEM_DIEM_DANH = {
  "đúng giờ": 3,
  "trễ": 2,
  "có phép": 1,
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
  // Sửa lại useEffect loadAttendance
  useEffect(() => {
    const loadAttendance = async () => {
      if (!db || !selectedMonth) return; // ĐỔI: selectedDate → selectedMonth

      try {
        // ĐỔI: Đọc theo tháng thay vì theo ngày
        const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, selectedMonth);
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
  }, [db, selectedMonth]); // ĐỔI: selectedDate → selectedMonth

  // Lưu điểm danh
  const handleSaveAttendance = async () => {
    if (!db || !selectedMonth) return;

    try {
      const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, selectedMonth);

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
  // useAttendanceRecords.js - SỬA LẠI calculateReport
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

    try {
      // THAY ĐỔI QUAN TRỌNG: Đọc dữ liệu điểm danh THEO THÁNG thay vì theo ngày
      const monthlyAttendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, selectedMonth);
      const monthlyDocSnapshot = await getDoc(monthlyAttendanceDocRef);

      if (monthlyDocSnapshot.exists()) {
        const monthlyAttendanceData = monthlyDocSnapshot.data();

        // Duyệt qua tất cả học sinh và các ngày Chủ Nhật
        reportData.forEach(studentReport => {
          const studentId = studentReport.id;
          const studentAttendance = monthlyAttendanceData[studentId] || {};

          sundays.forEach(sunday => {
            const sundayAttendance = studentAttendance[sunday] || {};

            let score = DIEM_DIEM_DANH[sundayAttendance.present] || 0;
            if (sundayAttendance.holyBouquet) score += 1;
            if (sundayAttendance.uniform) score += 1;

            studentReport.attendanceDetails[sunday] = {
              present: sundayAttendance.present || "vắng mặt",
              holyBouquet: sundayAttendance.holyBouquet || false,
              uniform: sundayAttendance.uniform || false,
              score: score
            };

            studentReport.totalScore += score;
          });
        });
      }
    } catch (error) {
      console.error(`Lỗi khi tải điểm danh tháng ${selectedMonth}:`, error);
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