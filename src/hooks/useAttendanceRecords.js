import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, doc, query, where, getDocs } from 'firebase/firestore';

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

export function useAttendanceRecords(db, students, LOP_LIST) {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [selectedLop, setSelectedLop] = useState(LOP_LIST[0]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentAttendance, setCurrentAttendance] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [reportFilterLop, setReportFilterLop] = useState('Tất cả');

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
        const attendanceRef = collection(db, `artifacts/${appId}/public/data/attendance`);
        const q = query(attendanceRef,
          where("ngayDiemDanh", "==", selectedDate),
          where("lop", "==", selectedLop)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const docData = querySnapshot.docs[0].data();
          setCurrentAttendance(docData.diemDanh || {});
        } else {
          setCurrentAttendance({});
        }
      } catch {
        // ignore
      }
    };
    fetchAttendance();
  }, [db, selectedDate, selectedLop]);

  const handleSaveAttendance = async () => {
    if (!db) return;
    try {
      const attendanceRef = collection(db, `artifacts/${appId}/public/data/attendance`);
      const q = query(attendanceRef,
        where("ngayDiemDanh", "==", selectedDate),
        where("lop", "==", selectedLop)
      );
      const querySnapshot = await getDocs(q);

      const attendanceToSave = {};
      students.filter(s => s.lop === selectedLop).forEach(student => {
        const studentAttendance = currentAttendance[student.id] || {};
        attendanceToSave[student.id] = {
          present: studentAttendance.present || "vắng mặt",
          holyBouquet: studentAttendance.holyBouquet || false,
          uniform: studentAttendance.uniform || false
        };
      });

      if (querySnapshot.empty) {
        await addDoc(attendanceRef, {
          ngayDiemDanh: selectedDate,
          lop: selectedLop,
          diemDanh: attendanceToSave,
        });
      } else {
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, `artifacts/${appId}/public/data/attendance`, docId);
        await updateDoc(docRef, {
          diemDanh: attendanceToSave,
        });
      }
    } catch {
      // ignore
    }
  };

  // --------- BÁO CÁO THEO THÁNG -----------
  const calculateMonthlyReport = () => {
    const reportData = {};
    const [year, month] = selectedMonth.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      monthDates.push(`${year}-${month.padStart(2, '0')}-${d.toString().padStart(2, '0')}`);
    }

    students.forEach(student => {
      if (reportFilterLop !== 'Tất cả' && student.lop !== reportFilterLop) {
        return;
      }
      reportData[student.id] = {
        hoTen: student.hoTen,
        lop: student.lop,
        totalScore: 0,
        attendanceDays: 0,
        details: {}
      };
    });

    const monthlyRecords = attendanceRecords.filter(record =>
      monthDates.includes(record.ngayDiemDanh)
    );

    monthlyRecords.forEach(record => {
      if (record && record.diemDanh) {
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
            reportData[studentId].details[record.ngayDiemDanh] = {
              score: dayScore,
              present: attendance.present,
              holyBouquet: attendance.holyBouquet,
              uniform: attendance.uniform
            };
          }
        });
      }
    });

    // Sắp xếp theo LOP_LIST
    const sortedReportData = Object.values(reportData).sort(
      (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
    );

    return {
      reportData: sortedReportData,
      monthInfo: { year, month, days: monthDates }
    };
  };

  return {
    attendanceRecords,
    selectedLop,
    setSelectedLop,
    selectedDate,
    setSelectedDate,
    currentAttendance,
    setCurrentAttendance,
    selectedMonth,
    setSelectedMonth,
    generateMonthOptions,
    handleSaveAttendance,
    calculateReport: calculateMonthlyReport,
    reportFilterLop,
    setReportFilterLop,
  };
}