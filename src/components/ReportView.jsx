import React, { useState } from 'react';
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

const ReportView = ({
  reportData,
  monthInfo,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
}) => {
  const [reportFilterNganh, setReportFilterNganh] = useState("Tất cả");

  // Lọc học sinh theo ngành
  const filteredStudents = reportFilterNganh === "Tất cả"
    ? reportData
    : reportData.filter(s => NGANH_MAP[reportFilterNganh]?.includes(s.lop));

  const sortedStudents = [...filteredStudents].sort(
    (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
  );

  return (
    <div className="view-container">
      <h2 className="title">Báo Cáo Điểm Danh Theo Ngành</h2>
      <div className="form-group" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '16px',
        marginBottom: '20px'
      }}>
        <div>
          <label htmlFor="month-select" className="label">Chọn Tháng</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="select-field"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="nganh-filter" className="label">Lọc Theo Ngành</label>
          <select
            id="nganh-filter"
            value={reportFilterNganh}
            onChange={e => setReportFilterNganh(e.target.value)}
            className="select-field"
          >
            <option value="Tất cả">Tất cả</option>
            {NGANH_LIST.map(nganh => (
              <option key={nganh} value={nganh}>{nganh}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead className="table-header">
            <tr>
              <th>#</th>
              <th>Họ Tên</th>
              <th>Đội</th>
              <th>Số Ngày Điểm Danh</th>
              <th>Tổng Điểm Tháng</th>
              <th>Điểm Trung Bình</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length > 0 ? (
              sortedStudents.map((student, idx) => (
                <tr key={student.hoTen + student.lop}>
                  <td className="table-cell text-center">{idx + 1}</td>
                  <td className="table-cell">{student.hoTen}</td>
                  <td className="table-cell">{student.lop}</td>
                  <td className="table-cell text-center">{student.attendanceDays}</td>
                  <td className="table-cell text-center">{student.totalScore}</td>
                  <td className="table-cell text-center">
                    {student.attendanceDays > 0
                      ? (student.totalScore / student.attendanceDays).toFixed(1)
                      : '0'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="table-cell text-center italic">
                  Không có học sinh nào trong ngành này.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportView;