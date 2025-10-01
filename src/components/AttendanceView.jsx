import React, { useState } from 'react';
import { LOP_LIST } from '../hooks/useStudentData';

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

const NGANH_LIST = Object.keys(NGANH_MAP);

function getSundaysOfMonth(year, month) {
  const sundays = [];
  const firstDay = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const firstSunday = firstDay.getDay() === 0
    ? 1
    : 8 - firstDay.getDay();

  for (let d = firstSunday; d <= daysInMonth; d += 7) {
    const date = new Date(year, month - 1, d);
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'long', // Sunday
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    sundays.push(formatted);
  }

  return sundays;
}

const AttendanceView = ({
  students,
  currentAttendance,
  setCurrentAttendance,
  handleSaveAttendance,
  selectedNganh,
  setSelectedNganh,
  getSundaysInMonth
}) => {
  // Chọn năm/tháng/ngành
  const now = new Date();
  const [isSaving, setIsSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  // Hàm xử lý lưu điểm danh với loading state
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await handleSaveAttendance();
    } catch (error) {
      console.error("Lỗi khi lưu:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Danh sách năm/tháng
  const yearOptions = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y++) yearOptions.push(y);
  const monthOptions = [];
  for (let m = 1; m <= 12; m++) monthOptions.push(m);

  // Ngày Chủ Nhật trong tháng
  const sundays = getSundaysInMonth ? getSundaysInMonth(selectedYear, selectedMonth) : getSundaysOfMonth(selectedYear, selectedMonth);

  // Lọc học sinh theo ngành
  const filteredStudents = selectedNganh === "Tất cả"
    ? students
    : students.filter(s => NGANH_MAP[selectedNganh]?.includes(s.lop));

  // Sắp xếp theo đội
  const sortedStudents = [...filteredStudents].sort(
    (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
  );

  // Xác định ngành từ lớp (để tô màu)
  const getNganhFromLop = (lop) => {
    for (const [nganh, classes] of Object.entries(NGANH_MAP)) {
      if (classes.includes(lop)) {
        return nganh;
      }
    }
    return "Khác";
  };

  // Format ngày hiển thị (dd/mm)
  const formatDisplayDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  // Xử lý thay đổi điểm danh
  const handleAttendanceChange = (studentId, sunday, field, value) => {
    setCurrentAttendance(prev => {
      const studentAttendance = prev[studentId] || {};
      const sundayAttendance = studentAttendance[sunday] || {};

      return {
        ...prev,
        [studentId]: {
          ...studentAttendance,
          [sunday]: {
            ...sundayAttendance,
            [field]: value
          }
        }
      };
    });
  };

  // Lấy giá trị điểm danh
  const getAttendanceValue = (studentId, sunday, field) => {
    return currentAttendance[studentId]?.[sunday]?.[field] ||
      (field === 'present' ? 'vắng mặt' : false);
  };

  

  return (
    <div className="view-container">
      <h2 className="title">Điểm Danh Theo Tháng</h2>
      <div className="form-group grid-cols-3">
        <div>
          <label className="label">Năm</label>
          <select
            value={selectedYear}
            onChange={e => setSelectedYear(Number(e.target.value))}
            className="select-field"
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Tháng</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="select-field"
          >
            {monthOptions.map(m => (
              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nganh-select" className="label">Chọn Ngành</label>
          <select
            id="nganh-select"
            value={selectedNganh}
            onChange={e => setSelectedNganh(e.target.value)}
            className="select-field"
          >
            <option value="Tất cả">Tất cả</option>
            {NGANH_LIST.map(nganh => (
              <option key={nganh} value={nganh}>{nganh}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng điểm danh với header cố định */}
      {/* Bảng điểm danh với header cố định */}
      <div className="table-container">
        <table className="data-table">
          <thead className="table-header">
            <tr>
              <th className="table-cell" style={{ minWidth: '100px' }}>Tên Thánh</th>
              <th className="table-cell" style={{ minWidth: '150px' }}>Họ Tên</th>
              <th className="table-cell" style={{ minWidth: '100px' }}>Ngày Sinh</th>
              <th className="table-cell" style={{ minWidth: '120px' }}>Đội</th>
              <th className="table-cell" style={{ minWidth: '120px' }}>SĐT</th>

              {/* Header các ngày Chủ Nhật */}
              {sundays.map(sunday => (
                <th key={sunday} className="table-cell text-center" style={{
                  minWidth: '120px',
                  textAlign: 'center',
                  verticalAlign: 'middle',
                }}>
                  Chúa Nhật<br />{formatDisplayDate(sunday)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length > 0 ? (
              sortedStudents.map(student => {
                const nganh = getNganhFromLop(student.lop);

                return (
                  <tr key={student.id} className="table-row" data-nganh={nganh}>
                    <td className="table-cell bold" style={{ minWidth: '100px' }}>{student.tenThanh}</td>
                    <td className="table-cell" style={{ minWidth: '150px' }}>{student.hoTen}</td>
                    <td className="table-cell" style={{ minWidth: '100px' }}>{student.ngaySinh}</td>
                    <td className="table-cell" style={{ minWidth: '120px' }}>{student.lop}</td>
                    <td className="table-cell" style={{ minWidth: '120px' }}>
                      {student.soDienThoaiCha || student.soDienThoaiMe || student.soDienThoai || 'N/A'}
                    </td>

                    {/* Điểm danh cho từng Chủ Nhật - xếp dọc trong 1 ô */}
                    {sundays.map(sunday => (
                      <td key={sunday} className="table-cell" style={{ padding: '2px', minWidth: '120px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                          {/* Có mặt */}
                          <select
                            value={getAttendanceValue(student.id, sunday, 'present')}
                            onChange={(e) => handleAttendanceChange(student.id, sunday, 'present', e.target.value)}
                            className="select-field"
                            style={{
                              fontSize: '11px',
                              padding: '2px',
                              width: '100%',
                              maxWidth: '100px'
                            }}
                          >
                            <option value="đúng giờ">Đúng giờ</option>
                            <option value="trễ">Trễ</option>
                            <option value="có phép">Có phép</option>
                            <option value="vắng mặt">Vắng mặt</option>
                          </select>

                          {/* Bó Hoa Thiêng */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label style={{ fontSize: '10px' }}>BHT:</label>
                            <input
                              type="checkbox"
                              checked={getAttendanceValue(student.id, sunday, 'holyBouquet')}
                              onChange={(e) => handleAttendanceChange(student.id, sunday, 'holyBouquet', e.target.checked)}
                              style={{ transform: 'scale(0.8)' }}
                            />
                          </div>

                          {/* Đồng Phục */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <label style={{ fontSize: '10px' }}>ĐP:</label>
                            <input
                              type="checkbox"
                              checked={getAttendanceValue(student.id, sunday, 'uniform')}
                              onChange={(e) => handleAttendanceChange(student.id, sunday, 'uniform', e.target.checked)}
                              style={{ transform: 'scale(0.8)' }}
                            />
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5 + sundays.length} className="table-cell text-center italic">
                  Không có học sinh nào trong ngành này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nút lưu điểm danh - THÊM LOADING STATE */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button 
          onClick={handleSave} 
          className="button-primary" 
          style={{ minWidth: 180, fontSize: 18 }}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Đang lưu...' : `💾 Lưu Điểm Danh Tháng ${selectedMonth}/${selectedYear}`}
        </button>
      </div>

      {/* Thêm thông báo trạng thái */}
      <div style={{ 
        marginTop: '16px', 
        textAlign: 'center', 
        color: '#666', 
        fontSize: '14px',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <p>📅 Đang hiển thị {sundays.length} ngày Chủ Nhật trong tháng {selectedMonth}/{selectedYear}</p>
        <p>👥 Hiển thị {sortedStudents.length} học sinh</p>
        {Object.keys(currentAttendance).length > 0 && (
          <p>✅ Đã tải dữ liệu điểm danh ({Object.keys(currentAttendance).length} học sinh có điểm danh)</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceView;