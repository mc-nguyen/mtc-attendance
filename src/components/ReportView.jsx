import React, { useState } from 'react';
import { LOP_LIST } from '../hooks/useStudentData';

const NGANH_MAP = {
  "Ấu Nhi": ["Ấu Nhi Dự Bị", "Ấu Nhi Cấp 1", "Ấu Nhi Cấp 2", "Ấu Nhi Cấp 3"],
  "Thiếu Nhi": ["Thiếu Nhi Cấp 1", "Thiếu Nhi Cấp 2", "Thiếu Nhi Cấp 3"],
  "Nghĩa Sĩ": ["Nghĩa Sĩ Cấp 1", "Nghĩa Sĩ Cấp 2", "Nghĩa Sĩ Cấp 3"],
  "Hiệp Sĩ": ["Hiệp Sĩ Cấp 1", "Hiệp Sĩ Cấp 2"],
  "Huynh Trưởng": ["Hiệp Sĩ Trưởng Thành", "Huynh Trưởng", "Huấn Luyện Viên"]
};

const NGANH_LIST = Object.keys(NGANH_MAP);

const ReportView = ({
  reportData,
  selectedMonth,
  setSelectedMonth,
  monthOptions,
  sundays = []
}) => {
  const [reportFilterNganh, setReportFilterNganh] = useState("Tất cả");
  const [expandedStudent, setExpandedStudent] = useState(null);

  // Hàm xác định ngành từ lớp
  const getNganhFromLop = (lop) => {
    for (const [nganh, classes] of Object.entries(NGANH_MAP)) {
      if (classes.includes(lop)) {
        return nganh;
      }
    }
    return "Khác";
  };

  // Lọc học sinh theo ngành
  const filteredStudents = reportFilterNganh === "Tất cả"
    ? reportData
    : reportData.filter(s => NGANH_MAP[reportFilterNganh]?.includes(s.lop));

  const sortedStudents = [...filteredStudents].sort(
    (a, b) => LOP_LIST.indexOf(a.lop) - LOP_LIST.indexOf(b.lop)
  );

  const toggleExpand = (studentId) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  // Hàm xác định class CSS dựa trên trạng thái điểm danh
  const getAttendanceClass = (presentStatus) => {
    switch (presentStatus) {
      case 'đúng giờ':
        return 'present-on-time';
      case 'trễ':
        return 'present-late';
      case 'có phép':
        return 'excused';
      case 'vắng mặt':
      default:
        return 'absent';
    }
  };

  // Hàm hiển thị trạng thái điểm danh
  const renderAttendanceStatus = (presentStatus) => {
    switch (presentStatus) {
      case 'đúng giờ':
        return '✓ có mặt';
      case 'trễ':
        return '⌛ trễ';
      case 'có phép':
        return '🗯️ có phép';
      case 'vắng mặt':
      default:
        return '✗ vắng mặt';
    }
  };

  return (
    <div className="view-container">
      <h2 className="title">Báo Cáo Điểm Danh Theo Ngành</h2>
      
      <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div>
          <label htmlFor="month-select" className="label">Chọn Tháng</label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="select-field"
          >
            {monthOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
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
              <th>Tổng Điểm Tháng</th>
              <th>Chi Tiết</th>
            </tr>
          </thead>
          <tbody>
            {sortedStudents.length > 0 ? (
              sortedStudents.map((student, idx) => (
                <React.Fragment key={student.id}>
                  <tr className="table-row" data-nganh={getNganhFromLop(student.lop)}>
                    <td className="table-cell text-center">{idx + 1}</td>
                    <td className="table-cell">{student.hoTen}</td>
                    <td className="table-cell">{student.lop}</td>
                    <td className="table-cell text-center">{student.totalScore}</td>
                    <td className="table-cell text-center">
                      <button
                        onClick={() => toggleExpand(student.id)}
                        className="button-primary"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                      >
                        {expandedStudent === student.id ? 'Ẩn' : 'Xem'}
                      </button>
                    </td>
                  </tr>
                  
                  {expandedStudent === student.id && (
                    <tr>
                      <td colSpan="5" style={{ padding: '0' }}>
                        <div style={{ padding: '16px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                          <h4 style={{ margin: '0 0 12px 0' }}>Chi tiết điểm danh - {student.hoTen}</h4>
                          <table className="data-table" style={{ width: '100%' }}>
                            <thead>
                              <tr>
                                <th>Ngày</th>
                                <th>Có mặt</th>
                                <th>Bó Hoa</th>
                                <th>Đồng Phục</th>
                                <th>Điểm</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sundays.map(sunday => {
                                const detail = student.attendanceDetails[sunday] || {};
                                return (
                                  <tr key={sunday} className={getAttendanceClass(detail.present)}>
                                    <td>{sunday}</td>
                                    <td>{renderAttendanceStatus(detail.present)}</td>
                                    <td>{detail.holyBouquet ? '✓' : '✗'}</td>
                                    <td>{detail.uniform ? '✓' : '✗'}</td>
                                    <td>{detail.score || 0}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="table-cell text-center italic">
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