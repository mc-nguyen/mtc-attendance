import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, where, getDocs } from 'firebase/firestore';

const appId = 'mtc-attendance-app';

export const LOP_LIST = [
    "Ấu Nhi Dự Bị", "Ấu Nhi Cấp 1", "Ấu Nhi Cấp 2", "Ấu Nhi Cấp 3",
    "Thiếu Nhi Cấp 1", "Thiếu Nhi Cấp 2", "Thiếu Nhi Cấp 3",
    "Nghĩa Sĩ Cấp 1", "Nghĩa Sĩ Cấp 2", "Nghĩa Sĩ Cấp 3",
    "Hiệp Sĩ Cấp 1", "Hiệp Sĩ Cấp 2", "Hiệp Sĩ Trưởng Thành", "Huynh Trưởng", "Huấn Luyện Viên"
];

const DIEM_DIEM_DANH = {
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

export const useAttendanceData = (db) => {
    const [students, setStudents] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [selectedLop, setSelectedLop] = useState(LOP_LIST[0]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentAttendance, setCurrentAttendance] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [reportFilterLop, setReportFilterLop] = useState('Tất cả');

    useEffect(() => {
        if (!db) return;

        const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
        const unsubscribeStudents = onSnapshot(studentsRef, (snapshot) => {
            const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Sắp xếp theo thứ tự đội (LOP_LIST)
            setStudents(
                studentData.sort(
                    (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
                )
            );
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to students:", error);
            setMessage("Lỗi khi tải danh sách học sinh.");
        });

        return () => unsubscribeStudents();
    }, [db]);

    useEffect(() => {
        if (!db) return;

        const attendanceRef = collection(db, `artifacts/${appId}/public/data/attendance`);
        const unsubscribeAttendance = onSnapshot(attendanceRef, (snapshot) => {
            const attendanceData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAttendanceRecords(attendanceData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error listening to attendance records:", error);
            setMessage("Lỗi khi tải dữ liệu điểm danh.");
        });

        return () => unsubscribeAttendance();
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
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu điểm danh:", error);
                setMessage('Lỗi khi tải dữ liệu. Vui lòng thử lại.');
            }
        };

        fetchAttendance();
    }, [db, selectedDate, selectedLop]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                setMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

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
            setMessage('Lưu điểm danh thành công!');
        } catch (error) {
            console.error("Lỗi khi lưu điểm danh:", error);
            setMessage('Lỗi khi lưu. Vui lòng thử lại.');
        }
    };

    const handleAddStudent = async (event) => {
        event.preventDefault();
        if (!db) return;
        const formData = new FormData(event.target);
        const studentData = {
            tenThanh: formData.get('tenThanh'),
            hoTen: formData.get('hoTen'),
            ngaySinh: formData.get('ngaySinh'),
            soDienThoai: formData.get('soDienThoai'),
            lop: formData.get('lop'),
        };
        try {
            const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
            await addDoc(studentsRef, studentData);
            event.target.reset();
            setMessage('Đã thêm học sinh thành công!');
        } catch (error) {
            console.error("Lỗi khi thêm học sinh:", error);
            setMessage('Lỗi khi thêm. Vui lòng thử lại.');
        }
    };

    const handleDeleteStudent = async (studentId) => {
        if (!db) return;
        try {
            const studentRef = doc(db, `artifacts/${appId}/public/data/students`, studentId);
            await deleteDoc(studentRef);
            setMessage('Đã xóa học sinh thành công!');
        } catch (error) {
            console.error("Lỗi khi xóa học sinh:", error);
            setMessage('Lỗi khi xóa. Vui lòng thử lại.');
        }
    };

    const handleImportCSV = async (csvData) => {
        if (!db) return;

        try {
            const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
            let importedCount = 0;
            let errorCount = 0;

            for (const row of csvData) {
                try {
                    const studentData = {
                        tenThanh: row['Tên Thánh']?.trim() || '',
                        hoTen: `${row['Họ']?.trim() || ''} ${row['Tên Đệm']?.trim() || ''} ${row['Tên Gọi']?.trim() || ''}`.trim(),
                        ngaySinh: formatDate(row['Ngày Sinh']),
                        lop: row['Ngành']?.trim() || '',
                        tenCha: row['Tên Cha']?.trim() || '',
                        tenMe: row['Tên Mẹ']?.trim() || '',
                        soDienThoaiCha: formatPhone(row['SĐT Cha']),
                        soDienThoaiMe: formatPhone(row['SĐT Mẹ']),
                        email: row['Email']?.trim() || ''
                    };

                    if (studentData.hoTen && studentData.lop) {
                        await addDoc(studentsRef, studentData);
                        importedCount++;
                    }
                } catch (error) {
                    console.error("Lỗi khi thêm học sinh từ CSV:", error);
                    errorCount++;
                }
            }

            setMessage(`Đã import thành công ${importedCount} học sinh. ${errorCount > 0 ? `Có ${errorCount} lỗi.` : ''}`);

        } catch (error) {
            console.error("Lỗi khi import CSV:", error);
            setMessage('Lỗi khi import CSV. Vui lòng thử lại.');
        }
    };

    const formatPhone = (phone) => {
        if (!phone) return '';
        return phone.toString().replace(/\D/g, '');
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                const parts = dateString.split('/');
                if (parts.length === 3) {
                    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
                }
                return dateString;
            }
            return date.toISOString().split('T')[0];
        } catch {
            return dateString;
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

        const groupedByClass = {};
        Object.values(reportData).forEach(student => {
            if (!groupedByClass[student.lop]) {
                groupedByClass[student.lop] = [];
            }
            groupedByClass[student.lop].push(student);
        });

        Object.keys(groupedByClass).forEach(lop => {
            groupedByClass[lop].sort((a, b) => b.totalScore - a.totalScore);
        });

        const sortedGroupedByClass = {};
        LOP_LIST.forEach(lop => {
            if (groupedByClass[lop]) {
                sortedGroupedByClass[lop] = groupedByClass[lop];
            }
        });
        Object.keys(groupedByClass).forEach(lop => {
            if (!sortedGroupedByClass[lop]) {
                sortedGroupedByClass[lop] = groupedByClass[lop];
            }
        });

        // Thông tin tháng để hiển thị
        const monthInfo = {
            year,
            month,
            days: monthDates
        };

        // Sắp xếp reportData theo LOP_LIST
        const sortedReportData = Object.values(reportData).sort(
            (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
        );

        return {
            reportData: sortedReportData,
            groupedByClass: sortedGroupedByClass,
            monthInfo
        };
    };

    const handleUpdateStudent = async (studentId, updatedData) => {
        if (!db) return;
        try {
            const studentRef = doc(db, `artifacts/${appId}/public/data/students`, studentId);
            await updateDoc(studentRef, updatedData);
            setMessage('Cập nhật học sinh thành công!');
            return true;
        } catch (error) {
            console.error("Lỗi khi cập nhật học sinh:", error);
            setMessage('Lỗi khi cập nhật. Vui lòng thử lại.');
            return false;
        }
    };

    return {
        students,
        attendanceRecords,
        selectedLop,
        setSelectedLop,
        selectedDate,
        setSelectedDate,
        currentAttendance,
        setCurrentAttendance,
        isLoading,
        message,
        LOP_LIST,
        DIEM_DIEM_DANH,
        selectedMonth,
        setSelectedMonth,
        generateMonthOptions,
        handleSaveAttendance,
        handleAddStudent,
        handleDeleteStudent,
        calculateReport: calculateMonthlyReport,
        handleImportCSV,
        reportFilterLop,
        setReportFilterLop,
        handleUpdateStudent,
    };
};