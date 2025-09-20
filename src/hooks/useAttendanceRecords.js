import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, query, where, getDocs, setDoc } from 'firebase/firestore';

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
  for (let month = 1; month <= 12; month++) {
    const monthStr = month.toString().padStart(2, '0');
    options.push({
      value: `${currentYear}-${monthStr}`,
      label: `Tháng ${monthStr}/${currentYear}`
    });
  }
  return options;
}

const NGANH_MAP = {
  "Ấu Nhi": [
    "Ấu Nhi Dự Bị", "Ấu Nhi Cấp 1", "Ấu Nhi Cấp 2", "Ấu Nhi Cấp 3"
  ],
  "Thiếu Nhi": [
    "Thiếu Nhi Cấp 1", "Thiếu Nhi Cấp 2", "Thiếu Nhi Cấp 3"
  ],
  "Nghĩa Sĩ": [
    "Nghĩa Sĩ Cấp 1", "Nghĩa Sĩ Cấp 2", "Nghĩa Sĩ Cấp 3"
  ],
  "Hiệp Sĩ": [
    "Hiệp Sĩ Cấp 1", "Hiệp Sĩ Cấp 2"
  ],
  "Huynh Trưởng": [
    "Hiệp Sĩ Trưởng Thành", "Huynh Trưởng", "Huấn Luyện Viên"
  ]
};

export function useAttendanceRecords(db, students, LOP_LIST) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedNganh, setSelectedNganh] = useState("Tất cả");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentAttendance, setCurrentAttendance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  useEffect(() => {
    if (!db) return;
    const attendanceRef = collection(db, `artifacts/${appId}/public/data/attendance`);
    const unsubscribe = onSnapshot(attendanceRef, (snapshot) => {
      const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendanceRecords(attendanceData);
    });
    return () => unsubscribe();
  }, [db]);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!db) return;
      try {
        const docId = `${selectedDate}_${selectedNganh}`;
        const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, docId);
        const docSnapshot = await getDocs(attendanceDocRef);
        
        if (docSnapshot.exists()) {
          const docData = docSnapshot.data();
          setCurrentAttendance(docData.diemDanh || {});
        } else {
          setCurrentAttendance({});
        }
      } catch (error) {
        console.error("Lỗi khi tải điểm danh:", error);
        setCurrentAttendance({});
      }
    };
    fetchAttendance();
  }, [db, selectedDate, selectedNganh]);

  const handleSaveAttendance = async () => {
    if (!db) return;
    try {
      // Tạo ID duy nhất kết hợp ngày và ngành
      const docId = `${selectedDate}_${selectedNganh}`;
      const attendanceDocRef = doc(db, `artifacts/${appId}/public/data/attendance`, docId);

      // Lọc học sinh theo ngành
      const filteredStudents = selectedNganh === "Tất cả"
        ? students
        : students.filter(s => NGANH_MAP[selectedNganh]?.includes(s.lop));

      const attendanceToSave = {};
      filteredStudents.forEach(student => {
        const studentAttendance = currentAttendance[student.id] || {};
        attendanceToSave[student.id] = {
          present: studentAttendance.present || "vắng mặt",
          holyBouquet: studentAttendance.holyBouquet || false,
          uniform: studentAttendance.uniform || false
        };
      });

      await setDoc(attendanceDocRef, {
        diemDanh: attendanceToSave,
        ngayDiemDanh: selectedDate,
        nganh: selectedNganh
      }, { merge: true });

      alert("Đã lưu điểm danh thành công!");
    } catch (error) {
      console.error("Lỗi khi lưu điểm danh:", error);
      alert("Lỗi khi lưu điểm danh: " + error.message);
    }
  };

  // --------- BÁO CÁO THEO THÁNG -----------
  const calculateReport = useCallback(async () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;

    const reportData = {};
    students.forEach((student) => {
      reportData[student.id] = {
        ...student,
        attendanceDays: 0,
        totalScore: 0,
        details: {},
      };
    });

    // Lấy tất cả các tài liệu điểm danh trong tháng
    const q = query(
      collection(db, `artifacts/${appId}/public/data/attendance`),
      where('ngayDiemDanh', '>=', startDate),
      where('ngayDiemDanh', '<=', endDate)
    );

    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => {
      const record = doc.data();
      const ngayDiemDanh = record.ngayDiemDanh;

      // Lặp qua từng học sinh trong điểm danh
      Object.entries(record.diemDanh).forEach(([studentId, attendance]) => {
        if (reportData[studentId]) {
          let dayScore = 0;
          if (attendance.present in DIEM_DIEM_DANH) {
            dayScore += DIEM_DIEM_DANH[attendance.present];
          }
          if (attendance.holyBouquet) {
            dayScore += 1;
          }
          if (attendance.uniform) {
            dayScore += 1;
          }

          reportData[studentId].totalScore += dayScore;
          reportData[studentId].attendanceDays += 1;
          reportData[studentId].details[ngayDiemDanh] = {
            score: dayScore,
            present: attendance.present,
            holyBouquet: attendance.holyBouquet,
            uniform: attendance.uniform,
          };
        }
      });
    });

    // Sắp xếp theo LOP_LIST
    const sortedReportData = Object.values(reportData).sort(
      (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
    );

    return {
      reportData: sortedReportData,
      monthInfo: { year, month },
    };
  }, [db, students, selectedMonth, LOP_LIST]);

  return {
    attendanceRecords,
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
  };
}