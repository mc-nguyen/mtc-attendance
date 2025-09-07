import React, { useState } from 'react';

const ReportView = ({ reportData, groupedByClass, weekInfo, selectedWeek, setSelectedWeek, weekOptions, reportFilterLop, setReportFilterLop, LOP_LIST }) => {
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' hoặc 'all'

  // Tạo options cho dropdown lọc lớp
  const classOptions = ['Tất cả', ...LOP_LIST];

  // Lấy danh sách lớp theo đúng thứ tự LOP_LIST
  const orderedClassNames = Object.keys(groupedByClass).sort((a, b) => {
    const indexA = LOP_LIST.indexOf(a);
    const indexB = LOP_LIST.indexOf(b);
    
    // Nếu cả hai đều có trong LOP_LIST, sắp xếp theo thứ tự
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // Nếu chỉ a có trong LOP_LIST, a lên trước
    if (indexA !== -1) return -1;
    
    // Nếu chỉ b có trong LOP_LIST, b lên trước
    if (indexB !== -1) return 1;
    
    // Nếu cả hai都不在 LOP_LIST中，按字母顺序排序
    return a.localeCompare(b);
  });

  return (
    <div className="view-container">
      <h2 className="title">Báo Cáo Điểm Danh Theo Tuần</h2>
      
      {/* Bộ lọc và chọn tuần */}
      <div className="form-group" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr', 
        gap: '16px', 
        marginBottom: '20px' 
      }}>
        <div>
          <label htmlFor="week-select" className="label">Chọn Tuần</label>
          <select 
            id="week-select" 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(e.target.value)} 
            className="select-field"
          >
            {weekOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label htmlFor="class-filter" className="label">Lọc Theo Lớp</label>
          <select 
            id="class-filter" 
            value={reportFilterLop} 
            onChange={(e) => setReportFilterLop(e.target.value)} 
            className="select-field"
          >
            {classOptions.map(lop => (
              <option key={lop} value={lop}>{lop}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chế độ xem */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button
          onClick={() => setViewMode('grouped')}
          className={`nav-button ${viewMode === 'grouped' ? 'active' : ''}`}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          📊 Xem Theo Lớp
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`nav-button ${viewMode === 'all' ? 'active' : ''}`}
          style={{ padding: '8px 16px', fontSize: '14px' }}
        >
          👥 Xem Tất Cả
        </button>
      </div>

      {weekInfo && (
        <div style={{ 
          backgroundColor: '#e8f5e8', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          border: '1px solid #c8e6c9'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>
            📅 Tuần từ {weekInfo.dates[0].display} đến {weekInfo.dates[6].display}
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {weekInfo.dates.map((day, index) => (
              <span key={index} style={{
                padding: '5px 10px',
                backgroundColor: '#fff',
                borderRadius: '15px',
                border: '1px solid #ddd',
                fontSize: '14px'
              }}>
                {day.display}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tổng quan thống kê */}
      {reportData.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            backgroundColor: '#e3f2fd', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1976d2' }}>
              {reportData.length}
            </div>
            <div style={{ fontSize: '14px', color: '#1976d2' }}>Tổng Số Học Sinh</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#f1f8e9', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#388e3c' }}>
              {reportData.filter(s => s.attendanceDays > 0).length}
            </div>
            <div style={{ fontSize: '14px', color: '#388e3c' }}>Học Sinh Điểm Danh</div>
          </div>
          
          <div style={{ 
            backgroundColor: '#fff3e0', 
            padding: '16px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f57c00' }}>
              {reportData.reduce((total, s) => total + s.attendanceDays, 0)}
            </div>
            <div style={{ fontSize: '14px', color: '#f57c00' }}>Tổng Số Buổi Điểm Danh</div>
          </div>
        </div>
      )}

      {/* Hiển thị theo chế độ xem */}
      {viewMode === 'grouped' ? (
        /* Xem theo từng lớp - theo thứ tự LOP_LIST */
        <div>
          {orderedClassNames.map((className) => (
            <div key={className} style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                backgroundColor: '#5d4037', 
                color: 'white', 
                padding: '12px 16px', 
                borderRadius: '6px',
                marginBottom: '16px',
                fontSize: '18px'
              }}>
                🎓 {className} ({groupedByClass[className].length} học sinh)
              </h3>
              
              <div className="table-container">
                <table className="data-table">
                  <thead className="table-header">
                    <tr>
                      <th scope="col" className="table-cell" style={{ width: '40px' }}>#</th>
                      <th scope="col" className="table-cell">Họ Tên</th>
                      <th scope="col" className="table-cell text-center">Số Ngày Điểm Danh</th>
                      <th scope="col" className="table-cell text-center">Tổng Điểm Tuần</th>
                      <th scope="col" className="table-cell text-center">Điểm Trung Bình</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedByClass[className].map((student, index) => (
                      <tr key={index} className="table-row">
                        <td className="table-cell text-center" style={{ fontWeight: 'bold' }}>
                          {index + 1}
                        </td>
                        <td className="table-cell bold">{student.hoTen}</td>
                        <td className="table-cell text-center">{student.attendanceDays}</td>
                        <td className="table-cell text-center">{student.totalScore}</td>
                        <td className="table-cell text-center">
                          {student.attendanceDays > 0 
                            ? (student.totalScore / student.attendanceDays).toFixed(1)
                            : '0'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Xem tất cả - sắp xếp theo lớp theo LOP_LIST */
        <div className="table-container">
          <table className="data-table">
            <thead className="table-header">
              <tr>
                <th scope="col" className="table-cell">Lớp</th>
                <th scope="col" className="table-cell">Họ Tên</th>
                <th scope="col" className="table-cell text-center">Số Ngày Điểm Danh</th>
                <th scope="col" className="table-cell text-center">Tổng Điểm Tuần</th>
                <th scope="col" className="table-cell text-center">Điểm Trung Bình</th>
              </tr>
            </thead>
            <tbody>
              {reportData.length > 0 ? (
                reportData
                  .sort((a, b) => {
                    const indexA = LOP_LIST.indexOf(a.lop);
                    const indexB = LOP_LIST.indexOf(b.lop);
                    
                    // Sắp xếp theo thứ tự LOP_LIST trước
                    if (indexA !== -1 && indexB !== -1) {
                      return indexA - indexB;
                    }
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                    
                    // Sau đó sắp xếp theo tên nếu cùng lớp
                    return a.lop.localeCompare(b.lop);
                  })
                  .map((student, index) => (
                    <tr key={index} className="table-row">
                      <td className="table-cell" style={{ fontWeight: 'bold', color: '#5d4037' }}>
                        {student.lop}
                      </td>
                      <td className="table-cell bold">{student.hoTen}</td>
                      <td className="table-cell text-center">{student.attendanceDays}</td>
                      <td className="table-cell text-center">{student.totalScore}</td>
                      <td className="table-cell text-center">
                        {student.attendanceDays > 0 
                          ? (student.totalScore / student.attendanceDays).toFixed(1)
                          : '0'
                        }
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="5" className="table-cell text-center italic">
                    Không có dữ liệu điểm danh cho tuần này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Hiển thị chi tiết từng ngày */}
      {reportData.length > 0 && viewMode === 'all' && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#5d4037' }}>
            📊 Chi Tiết Điểm Từng Ngày
          </h3>
          {reportData
            .sort((a, b) => {
              const indexA = LOP_LIST.indexOf(a.lop);
              const indexB = LOP_LIST.indexOf(b.lop);
              
              if (indexA !== -1 && indexB !== -1) {
                return indexA - indexB;
              }
              if (indexA !== -1) return -1;
              if (indexB !== -1) return 1;
              
              return a.lop.localeCompare(b.lop);
            })
            .map((student, index) => (
              student.attendanceDays > 0 && (
                <div key={index} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px' }}>
                  <h4 style={{ marginBottom: '10px', color: '#5d4037' }}>
                    👤 {student.hoTen} - {student.lop}
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '10px' }}>
                    {Object.entries(student.details || {}).map(([date, detail]) => {
                      const dayInfo = weekInfo.dates.find(d => d.date === date);
                      return (
                        <div key={date} style={{ 
                          padding: '12px', 
                          backgroundColor: '#f8f9fa', 
                          borderRadius: '6px',
                          border: '1px solid #dee2e6'
                        }}>
                          <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#495057' }}>
                            {dayInfo ? dayInfo.display : date}
                          </div>
                          <div style={{ fontSize: '14px' }}>
                            <div>✅ <strong>Điểm:</strong> {detail.score}</div>
                            <div>📋 <strong>Trạng thái:</strong> {detail.present}</div>
                            <div>💐 <strong>Bó hoa Thiêng:</strong> {detail.holyBouquet ? 'Có' : 'Không'}</div>
                            <div>👕 <strong>Đồng phục:</strong> {detail.uniform ? 'Có' : 'Không'}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
        </div>
      )}
    </div>
  );
};

export default ReportView;