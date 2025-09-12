import React, { useState, useEffect } from 'react';
import { LOP_LIST } from '../hooks/useStudentData'; // Đã chuyển sang hook mới

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
  const daysInMonth = new Date(year, month, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    if (date.getDay() === 0) {
      sundays.push(date.toISOString().split('T')[0]);
    }
  }
  return sundays;
}

const AttendanceView = ({
  students,
  selectedDate,
  setSelectedDate,
  currentAttendance,
  setCurrentAttendance,
  handleSaveAttendance,
}) => {
  // Chọn năm/tháng/ngành
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedNganh, setSelectedNganh] = useState("Tất cả");

  // Danh sách năm/tháng
  const yearOptions = [];
  for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 2; y++) yearOptions.push(y);
  const monthOptions = [];
  for (let m = 1; m <= 12; m++) monthOptions.push(m);

  // Ngày Chủ Nhật
  const sundays = getSundaysOfMonth(selectedYear, selectedMonth);

  useEffect(() => {
    if (!sundays.includes(selectedDate)) {
      setSelectedDate(sundays[0] || "");
    }
    // eslint-disable-next-line
  }, [selectedYear, selectedMonth]);

  // Lọc học sinh theo ngành
  const filteredStudents = selectedNganh === "Tất cả"
    ? students
    : students.filter(s => NGANH_MAP[selectedNganh]?.includes(s.lop));

  // Sắp xếp theo đội
  const sortedStudents = [...filteredStudents].sort(
    (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
  );

  return (
    <div className="view-container">
      <h2 className="title">Điểm Danh</h2>
      <div className="form-group grid-cols-2">
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
          <label htmlFor="attendance-date" className="label">Ngày Điểm Danh (Chủ Nhật)</label>
          <select
            id="attendance-date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="select-field"
          >
            {sundays.map(date => (
              <option key={date} value={date}>{date}</option>
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

      {/* Bảng điểm danh theo ngành */}
      <div className="table-container">
        <table className="data-table">
          <thead className="table-header">
            <tr>
              <th className="table-cell">Tên Thánh</th>
              <th className="table-cell">Họ Tên</th>
              <th className="table-cell">Ngày Sinh</th>
              <th className="table-cell">Đội</th>
              <th className="table-cell">SĐT</th>
              <th className="table-cell text-center">Có mặt</th>
              <th className="table-cell text-center">Bó Hoa Thiêng</th>
              <th className="table-cell text-center">Đồng Phục</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length > 0 ? (
              sortedStudents.map(student => (
                <tr key={student.id} className="table-row">
                  <td className="table-cell bold">{student.tenThanh}</td>
                  <td className="table-cell">{student.hoTen}</td>
                  <td className="table-cell">{student.ngaySinh}</td>
                  <td className="table-cell">{student.lop}</td>
                  <td className="table-cell">
                    {student.soDienThoaiCha || student.soDienThoaiMe || student.soDienThoai || 'N/A'}
                  </td>
                  <td className="table-cell text-center">
                    <select
                      data-student-id={student.id}
                      data-criterion="present"
                      value={currentAttendance[student.id]?.present || "vắng mặt"}
                      onChange={(e) =>
                        setCurrentAttendance({
                          ...currentAttendance,
                          [student.id]: {
                            ...currentAttendance[student.id],
                            present: e.target.value,
                          },
                        })
                      }
                      className="select-field"
                    >
                      <option value="đúng giờ">Đúng giờ</option>
                      <option value="trễ 15 phút">Trễ 15 phút</option>
                      <option value="trễ 30 phút">Trễ 30 phút</option>
                      <option value="vắng mặt">Vắng mặt</option>
                    </select>
                  </td>
                  <td className="table-cell text-center">
                    <input
                      type="checkbox"
                      data-student-id={student.id}
                      data-criterion="holyBouquet"
                      checked={currentAttendance[student.id]?.holyBouquet || false}
                      onChange={(e) =>
                        setCurrentAttendance({
                          ...currentAttendance,
                          [student.id]: {
                            ...currentAttendance[student.id],
                            holyBouquet: e.target.checked,
                          },
                        })
                      }
                    />
                  </td>
                  <td className="table-cell text-center">
                    <input
                      type="checkbox"
                      data-student-id={student.id}
                      data-criterion="uniform"
                      checked={currentAttendance[student.id]?.uniform || false}
                      onChange={(e) =>
                        setCurrentAttendance({
                          ...currentAttendance,
                          [student.id]: {
                            ...currentAttendance[student.id],
                            uniform: e.target.checked,
                          },
                        })
                      }
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="table-cell text-center italic">
                  Không có học sinh nào trong ngành này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nút lưu điểm danh đẹp hơn */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
        <button onClick={handleSaveAttendance} className="button-primary" style={{ minWidth: 180, fontSize: 18 }}>
          💾 Lưu Điểm Danh
        </button>
      </div>
    </div>
  );
};

export default AttendanceView;