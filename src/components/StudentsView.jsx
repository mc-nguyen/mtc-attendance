import React, { useRef, useState } from 'react';
import EditStudentModal from './EditStudentModal';
import {
  handleImportExcel,
} from '../hooks/useStudentImport';

const StudentsView = ({ students, LOP_LIST, handleAddStudent, handleDeleteStudent, handleImportCSV, handleUpdateStudent }) => {
  const fileInputRef = useRef(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleEditClick = (student) => {
    setEditingStudent(student);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (studentId, updatedData) => {
    return await handleUpdateStudent(studentId, updatedData);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingStudent(null);
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      // Đã xử lý trong hook useStudentImport, chỉ cần gọi handleImportCSV
      import('../hooks/useStudentImport').then(({ handleFileUpload }) => {
        handleFileUpload(file, handleImportCSV, (err) => {
          alert('Lỗi khi đọc file CSV. Vui lòng kiểm tra định dạng file.');
        });
      });
    } else if (ext === 'xlsx' || ext === 'xls') {
      handleImportExcel(file, handleImportCSV, (err) => {
        alert('Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng file.');
      });
    } else {
      alert('Chỉ hỗ trợ file .csv, .xls, .xlsx');
    }
    e.target.value = '';
  };

  return (
    <div className="view-container">
      <h2 className="title">Quản Lý Học Sinh</h2>

      {/* Section Import CSV/Excel */}
      <div className="table-container" style={{ marginBottom: '24px', padding: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#5d4037' }}>
          📥 Import từ Excel/CSV
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={handleImportClick} className="button-primary">
              Chọn file Excel/CSV
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileChange}
              accept=".csv,.xls,.xlsx"
              style={{ display: 'none' }}
            />
            <span style={{ fontSize: '14px', color: '#666' }}>
              Chọn file Excel (.xls, .xlsx) hoặc CSV để import dữ liệu học sinh
            </span>
          </div>

          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '12px',
            borderRadius: '6px',
            border: '1px dashed #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#495057' }}>
              📋 Định dạng file yêu cầu:
            </h4>
            <ul style={{
              margin: 0,
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#6c757d'
            }}>
              <li>Cột: <b>Tên Thánh, Họ, Tên Đệm, Tên Gọi, Ngày Sinh, Ngành, Email, Số Điện Thoại</b></li>
              <li>File phải có header (dòng đầu tiên)</li>
              <li>Định dạng ngày: MM/DD/YYYY hoặc YYYY-MM-DD</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Section Thêm học sinh thủ công */}
      <div className="table-container" style={{ marginBottom: '24px', padding: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#5d4037' }}>
          ➕ Thêm Học Sinh Mới
        </h3>
        <form onSubmit={handleAddStudent} className="form-group grid-cols-2">
          <div>
            <label htmlFor="tenThanh" className="label">Tên Thánh</label>
            <input type="text" id="tenThanh" name="tenThanh" className="input-field" />
          </div>
          <div>
            <label htmlFor="hoTen" className="label">Họ Tên</label>
            <input type="text" id="hoTen" name="hoTen" required className="input-field" />
          </div>
          <div>
            <label htmlFor="ngaySinh" className="label">Ngày Sinh</label>
            <input type="date" id="ngaySinh" name="ngaySinh" className="input-field" />
          </div>
          <div>
            <label htmlFor="soDienThoai" className="label">SĐT (Cha/Mẹ)</label>
            <input type="tel" id="soDienThoai" name="soDienThoai" className="input-field" />
          </div>
          <div>
            <label htmlFor="tenCha" className="label">Tên Cha</label>
            <input type="text" id="tenCha" name="tenCha" className="input-field" />
          </div>
          <div>
            <label htmlFor="tenMe" className="label">Tên Mẹ</label>
            <input type="text" id="tenMe" name="tenMe" className="input-field" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label htmlFor="lop" className="label">Lớp</label>
            <select id="lop" name="lop" required className="select-field">
              {LOP_LIST.map(lop => <option key={lop} value={lop}>{lop}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="button-primary">
              Thêm Học Sinh
            </button>
          </div>
        </form>
      </div>

      {/* Danh sách học sinh */}
      <div className="table-container">
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#5d4037' }}>
          📋 Danh Sách Học Sinh ({students.length})
        </h3>
        <table className="data-table">
          <thead className="table-header">
            <tr>
              <th scope="col" className="table-cell">Tên Thánh</th>
              <th scope="col" className="table-cell">Họ Tên</th>
              <th scope="col" className="table-cell">Ngày Sinh</th>
              <th scope="col" className="table-cell">Lớp</th>
              <th scope="col" className="table-cell">SĐT Liên Hệ</th>
              <th scope="col" className="table-cell">Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {students.length > 0 ? (
              students.map(student => (
                <tr key={student.id} className="table-row">
                  <td className="table-cell bold">{student.tenThanh}</td>
                  <td className="table-cell">{student.hoTen}</td>
                  <td className="table-cell">{student.ngaySinh}</td>
                  <td className="table-cell">{student.lop}</td>
                  <td className="table-cell">
                    {student.soDienThoaiCha || student.soDienThoaiMe || student.soDienThoai || 'N/A'}
                  </td>
                  <td className="table-cell">
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditClick(student)}
                        className="edit-button"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="delete-button"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="table-cell text-center italic">
                  Không có học sinh nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal chỉnh sửa */}
      <EditStudentModal
        student={editingStudent}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleUpdate}
        LOP_LIST={LOP_LIST}
      />
    </div>
  );
};

export default StudentsView;