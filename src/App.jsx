import React, { useState, useEffect } from 'react';
import { useFirebase } from './hooks/useFirebase';
import { useStudentData, LOP_LIST } from './hooks/useStudentData';
import { useAttendanceRecords } from './hooks/useAttendanceRecords';
import AttendanceView from './components/AttendanceView';
import StudentsView from './components/StudentsView';
import ReportView from './components/ReportView';
import LoadingSpinner from './components/LoadingSpinner';
import MessageBox from './components/MessageBox';

const App = () => {
  const [view, setView] = useState('attendance');
  const { db, error: firebaseError } = useFirebase();
  const [monthlyReport, setMonthlyReport] = useState({ reportData: [], monthInfo: {} });
  const [reportLoading, setReportLoading] = useState(false);

  // Quản lý học sinh
  const {
    students,
    isLoading,
    message,
    handleAddStudent,
    handleDeleteStudent,
    handleImportCSV,
    handleUpdateStudent,
  } = useStudentData(db);

  // Quản lý điểm danh
  const {
    selectedNganh,
    setSelectedNganh,
    selectedDate,
    setSelectedDate,
    currentAttendance,
    setCurrentAttendance,
    selectedMonth,
    setSelectedMonth,
    generateMonthOptions,
    handleSaveAttendance,
    calculateReport,
  } = useAttendanceRecords(db, students, LOP_LIST);

  // Thêm useEffect để gọi hàm báo cáo bất đồng bộ
  useEffect(() => {
    const fetchReport = async () => {
      setReportLoading(true);
      const report = await calculateReport();
      setMonthlyReport(report);
      setReportLoading(false);
    };

    if (view === 'report' && students.length > 0) {
      fetchReport();
    }
  }, [view, selectedMonth, students, calculateReport]);

  if (isLoading || reportLoading) {
    return <LoadingSpinner />;
  }

  if (firebaseError) {
    return (
      <div className="error-container">
        <p>{firebaseError}</p>
      </div>
    );
  }

  return (
    <div className="main-container">
      <MessageBox message={message} />

      <div className="nav-button-container">
        <button onClick={() => setView('attendance')} className={`nav-button ${view === 'attendance' ? 'active' : ''}`}>
          Điểm Danh
        </button>
        <button onClick={() => setView('students')} className={`nav-button ${view === 'students' ? 'active' : ''}`}>
          Quản Lý Học Sinh
        </button>
        <button onClick={() => setView('report')} className={`nav-button ${view === 'report' ? 'active' : ''}`}>
          Báo Cáo
        </button>
      </div>

      {view === 'attendance' && (
        <AttendanceView
          students={students}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          currentAttendance={currentAttendance}
          setCurrentAttendance={setCurrentAttendance}
          handleSaveAttendance={handleSaveAttendance}
          selectedNganh={selectedNganh}
          setSelectedNganh={setSelectedNganh}
        />
      )}

      {view === 'students' && (
        <StudentsView
          students={students}
          LOP_LIST={LOP_LIST}
          handleAddStudent={handleAddStudent}
          handleDeleteStudent={handleDeleteStudent}
          handleImportCSV={handleImportCSV}
          handleUpdateStudent={handleUpdateStudent}
        />
      )}

      {view === 'report' && (
        <ReportView
          reportData={monthlyReport.reportData}
          monthInfo={monthlyReport.monthInfo}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          monthOptions={generateMonthOptions()}
          LOP_LIST={LOP_LIST}
        />
      )}

    </div>
  );
};

export default App;