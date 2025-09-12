import React, { useState } from 'react';
import { useFirebase } from './hooks/useFirebase';
import { useStudentData, LOP_LIST } from './hooks/useStudentData';
import { useAttendanceRecords, DIEM_DIEM_DANH } from './hooks/useAttendanceRecords';
import AttendanceView from './components/AttendanceView';
import StudentsView from './components/StudentsView';
import ReportView from './components/ReportView';
import LoadingSpinner from './components/LoadingSpinner';
import MessageBox from './components/MessageBox';

const App = () => {
  const [view, setView] = useState('attendance');
  const { db, error: firebaseError } = useFirebase();

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
    selectedLop,
    setSelectedLop,
    selectedDate,
    setSelectedDate,
    currentAttendance,
    setCurrentAttendance,
    selectedMonth,
    setSelectedMonth,
    generateMonthOptions,
    handleSaveAttendance,
    calculateReport,
    reportFilterLop,
    setReportFilterLop,
  } = useAttendanceRecords(db, students, LOP_LIST);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (firebaseError) {
    return (
      <div className="error-container">
        <p>{firebaseError}</p>
      </div>
    );
  }

  const monthlyReport = calculateReport();

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
          selectedLop={selectedLop}
          selectedDate={selectedDate}
          setSelectedLop={setSelectedLop}
          setSelectedDate={setSelectedDate}
          currentAttendance={currentAttendance}
          setCurrentAttendance={setCurrentAttendance}
          handleSaveAttendance={handleSaveAttendance}
          LOP_LIST={LOP_LIST}
          DIEM_DIEM_DANH={DIEM_DIEM_DANH}
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
          reportFilterLop={reportFilterLop}
          setReportFilterLop={setReportFilterLop}
          LOP_LIST={LOP_LIST}
        />
      )}

    </div>
  );
};

export default App;