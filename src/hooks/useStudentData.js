import { useState, useEffect } from 'react';
import { 
  collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, 
  getDocs // Thêm getDocs
} from 'firebase/firestore';

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
      let updatedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      // Lấy tất cả học sinh hiện có để kiểm tra duplicate
      const existingStudentsSnapshot = await getDocs(studentsRef);
      const existingStudents = existingStudentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

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
            soDienThoai: isHuynhTruong ? sdtCaNhan : (sdtCha || sdtMe || '')
          };

          if (!studentData.hoTen || !studentData.lop) {
            skippedCount++;
            continue;
          }

          // Kiểm tra duplicate dựa trên Họ tên + Ngày sinh hoặc Họ tên + Lớp
          const duplicateStudent = existingStudents.find(existing => {
            const sameName = existing.hoTen === studentData.hoTen;
            const sameBirth = existing.ngaySinh === studentData.ngaySinh;
            const sameClass = existing.lop === studentData.lop;

            return sameName && (sameBirth || sameClass);
          });

          if (duplicateStudent) {
            // Kiểm tra xem dữ liệu mới có đầy đủ thông tin hơn không
            const shouldUpdate = shouldUpdateStudent(duplicateStudent, studentData);

            if (shouldUpdate) {
              // Update thông tin học sinh đã tồn tại
              const studentRef = doc(db, `artifacts/${appId}/public/data/students`, duplicateStudent.id);
              await updateDoc(studentRef, studentData);
              updatedCount++;
            } else {
              skippedCount++;
            }
          } else {
            // Thêm học sinh mới
            await addDoc(studentsRef, studentData);
            importedCount++;
          }
        } catch (error) {
          console.error("Lỗi khi import học sinh:", error);
          errorCount++;
        }
      }

      setMessage(`Import hoàn tất: ${importedCount} học sinh mới, ${updatedCount} học sinh được cập nhật, ${skippedCount} học sinh đã tồn tại, ${errorCount} lỗi.`);
    } catch (error) {
      console.error("Lỗi khi import CSV:", error);
      setMessage('Lỗi khi import CSV. Vui lòng thử lại.');
    }
  };

  // Hàm kiểm tra có nên update thông tin hay không
  const shouldUpdateStudent = (existingStudent, newStudentData) => {
    // Ưu tiên update nếu thông tin mới đầy đủ hơn
    const fieldsToCheck = [
      'tenThanh', 'ngaySinh', 'tenCha', 'tenMe',
      'soDienThoaiCha', 'soDienThoaiMe', 'email', 'soDienThoai'
    ];

    for (const field of fieldsToCheck) {
      const existingValue = existingStudent[field] || '';
      const newValue = newStudentData[field] || '';

      // Nếu thông tin mới có giá trị và khác với thông tin cũ
      if (newValue && newValue !== existingValue) {
        return true;
      }
    }

    // Kiểm tra nếu lớp thay đổi
    if (newStudentData.lop && newStudentData.lop !== existingStudent.lop) {
      return true;
    }

    return false;
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