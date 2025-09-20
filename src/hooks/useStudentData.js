import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export const LOP_LIST = [
  "Ấu Nhi Dự Bị", "Ấu Nhi Cấp 1", "Ấu Nhi Cấp 2", "Ấu Nhi Cấp 3",
  "Thiếu Nhi Cấp 1", "Thiếu Nhi Cấp 2", "Thiếu Nhi Cấp 3",
  "Nghĩa Sĩ Cấp 1", "Nghĩa Sĩ Cấp 2", "Nghĩa Sĩ Cấp 3",
  "Hiệp Sĩ Cấp 1", "Hiệp Sĩ Cấp 2", "Hiệp Sĩ Trưởng Thành", "Huynh Trưởng", "Huấn Luyện Viên"
];

const appId = 'mtc-attendance-app';

export function useStudentData(db) {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!db) return;
    const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
    const unsubscribe = onSnapshot(studentsRef, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(
        studentData.sort((a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop))
      );
      setIsLoading(false);
    }, (error) => {
      setMessage("Lỗi khi tải danh sách học sinh.");
    });
    return () => unsubscribe();
  }, [db]);

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
    } catch {
      setMessage('Lỗi khi thêm. Vui lòng thử lại.');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!db) return;
    try {
      const studentRef = doc(db, `artifacts/${appId}/public/data/students`, studentId);
      await deleteDoc(studentRef);
      setMessage('Đã xóa học sinh thành công!');
    } catch {
      setMessage('Lỗi khi xóa. Vui lòng thử lại.');
    }
  };

  const handleUpdateStudent = async (studentId, updatedData) => {
    if (!db) return;
    try {
      const studentRef = doc(db, `artifacts/${appId}/public/data/students`, studentId);
      await updateDoc(studentRef, updatedData);
      setMessage('Cập nhật học sinh thành công!');
      return true;
    } catch {
      setMessage('Lỗi khi cập nhật. Vui lòng thử lại.');
      return false;
    }
  };

  // Import CSV/Excel
  const formatPhone = (phone) => {
    if (!phone) return '';

    // Chỉ giữ lại số
    let cleaned = phone.toString().replace(/\D/g, '');

    // Format số điện thoại Việt Nam
    if (cleaned.length === 10) {
      // Format: 0123 456 789
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      // Format: 012 3456 7890
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1 $2 $3');
    } else if (cleaned.length === 9) {
      // Format: 123 456 789
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
    }

    // Trả về số gốc nếu không match định dạng nào
    return cleaned;
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

  const handleImportCSV = async (csvData) => {
    if (!db) return;
    try {
      const studentsRef = collection(db, `artifacts/${appId}/public/data/students`);
      let importedCount = 0;
      let errorCount = 0;

      for (const row of csvData) {
        try {
          // Xác định ngành để xử lý SĐT phù hợp
          const nganh = row['Ngành']?.trim() || '';
          const isHuynhTruong = nganh.includes("Huynh Trưởng") ||
            nganh.includes("Hiệp Sĩ Trưởng Thành") ||
            nganh.includes("Huấn Luyện Viên");

          // Tự động format các số điện thoại
          const sdtCaNhan = formatPhone(row['SĐT Cá Nhân']);
          const sdtCha = formatPhone(row['SĐT Cha']);
          const sdtMe = formatPhone(row['SĐT Mẹ']);

          const studentData = {
            tenThanh: row['Tên Thánh']?.trim() || '',
            hoTen: `${row['Họ']?.trim() || ''} ${row['Tên Đệm']?.trim() || ''} ${row['Tên Gọi']?.trim() || ''}`.trim(),
            ngaySinh: formatDate(row['Ngày Sinh']),
            lop: nganh,
            tenCha: row['Tên Cha']?.trim() || '',
            tenMe: row['Tên Mẹ']?.trim() || '',
            soDienThoaiCha: sdtCha,
            soDienThoaiMe: sdtMe,
            email: row['Email']?.trim() || '',
            // Huynh Trưởng dùng SĐT cá nhân, các ngành khác ưu tiên SĐT Cha/Mẹ
            soDienThoai: isHuynhTruong ? sdtCaNhan : (sdtCha || sdtMe || '')
          };

          if (studentData.hoTen && studentData.lop) {
            await addDoc(studentsRef, studentData);
            importedCount++;
          }
        } catch (error) {
          console.error("Lỗi khi import học sinh:", error);
          errorCount++;
        }
      }

      setMessage(`Đã import thành công ${importedCount} học sinh. ${errorCount > 0 ? `Có ${errorCount} lỗi.` : ''}`);
    } catch (error) {
      console.error("Lỗi khi import CSV:", error);
      setMessage('Lỗi khi import CSV. Vui lòng thử lại.');
    }
  };

  return {
    students,
    isLoading,
    message,
    setMessage,
    LOP_LIST,
    handleAddStudent,
    handleDeleteStudent,
    handleImportCSV,
    handleUpdateStudent,
  };
}