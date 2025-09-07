import React from 'react';

const AttendanceView = ({
    students,
    selectedLop,
    selectedDate,
    setSelectedLop,
    setSelectedDate,
    currentAttendance,
    setCurrentAttendance,
    handleSaveAttendance,
    LOP_LIST,
    DIEM_DIEM_DANH
}) => {
    const filteredStudents = students.filter(s => s.lop === selectedLop);

    return (
        <div className="view-container">
            <h2 className="title">Điểm Danh</h2>
            <div className="form-group">
                <div>
                    <label htmlFor="attendance-date" className="label">Ngày Điểm Danh</label>
                    <input type="date" id="attendance-date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="input-field" />
                </div>
                <div>
                    <label htmlFor="lop-select" className="label">Chọn Lớp</label>
                    <select id="lop-select" value={selectedLop} onChange={(e) => setSelectedLop(e.target.value)} className="select-field">
                        {LOP_LIST.map(lop => (
                            <option key={lop} value={lop}>{lop}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="table-container">
                <table className="data-table">
                    <thead className="table-header">
                        <tr>
                            <th scope="col" className="table-cell">Tên Thánh</th>
                            <th scope="col" className="table-cell">Họ Tên</th>
                            <th scope="col" className="table-cell">Ngày Sinh</th>
                            <th scope="col" className="table-cell">SĐT</th>
                            <th scope="col" className="table-cell text-center">Có mặt</th>
                            <th scope="col" className="table-cell text-center">Bó Hoa Thiêng</th>
                            <th scope="col" className="table-cell text-center">Đồng Phục</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map(student => (
                                <tr key={student.id} className="table-row">
                                    <td className="table-cell bold">{student.tenThanh}</td>
                                    <td className="table-cell">{student.hoTen}</td>
                                    <td className="table-cell">{student.ngaySinh}</td>
                                    <td className="table-cell">{student.soDienThoai}</td>
                                    <td className="table-cell text-center">
                                        <select
                                            data-student-id={student.id}
                                            data-criterion="present"
                                            value={currentAttendance[student.id]?.present || "vắng mặt"}
                                            onChange={(e) => setCurrentAttendance({ ...currentAttendance, [student.id]: { ...currentAttendance[student.id], present: e.target.value } })}
                                            className="select-field"
                                        >
                                            {Object.keys(DIEM_DIEM_DANH).map(status => (
                                                <option key={status} value={status}>{status}</option>
                                            ))}
                                        </select>
                                    </td>
                                    <td className="table-cell text-center">
                                        <input
                                            type="checkbox"
                                            data-student-id={student.id}
                                            data-criterion="holyBouquet"
                                            checked={currentAttendance[student.id]?.holyBouquet || false}
                                            onChange={(e) => setCurrentAttendance({ ...currentAttendance, [student.id]: { ...currentAttendance[student.id], holyBouquet: e.target.checked } })}
                                        />
                                    </td>
                                    <td className="table-cell text-center">
                                        <input
                                            type="checkbox"
                                            data-student-id={student.id}
                                            data-criterion="uniform"
                                            checked={currentAttendance[student.id]?.uniform || false}
                                            onChange={(e) => setCurrentAttendance({ ...currentAttendance, [student.id]: { ...currentAttendance[student.id], uniform: e.target.checked } })}
                                        />
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="table-cell text-center italic">Chưa có học sinh nào trong lớp này.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
                <button onClick={handleSaveAttendance} className="button-primary">
                    Lưu Điểm Danh
                </button>
            </div>
        </div>
    );
};

export default AttendanceView;