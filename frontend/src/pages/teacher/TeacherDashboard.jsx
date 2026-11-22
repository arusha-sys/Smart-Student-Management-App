import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import ExportBtn from '../../components/ExportBtn';
import api from '../../services/api';
import {
  LayoutDashboard, BookOpen, CalendarCheck, Award, FileText,
  Upload, Megaphone, CheckCircle2, XCircle, Clock, Plus, ExternalLink
} from 'lucide-react';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Attendance state
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [lectureTopic, setLectureTopic] = useState('');
  const [attendanceStudents, setAttendanceStudents] = useState([]);
  const [attendanceSavedMsg, setAttendanceSavedMsg] = useState('');

  // Marks state
  const [marksList, setMarksList] = useState([]);
  const [gradingType, setGradingType] = useState('absolute'); // 'absolute' | 'relative'
  const [marksSavedMsg, setMarksSavedMsg] = useState('');

  // Assignments & Materials state
  const [assignments, setAssignments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'assignment' | 'material' | 'notice' | 'gradeSubmission'
  const [formData, setFormData] = useState({});
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      if (activeTab === 'attendance') loadAttendance();
      else if (activeTab === 'marks') loadMarks();
      else if (activeTab === 'materials') loadMaterials();
    }
  }, [selectedCourse, activeTab, attendanceDate]);

  useEffect(() => {
    if (activeTab === 'assignments') loadAssignments();
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      const res = await api.get('/teacher/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setCourses(res.data.assignedCourses || []);
        if (res.data.assignedCourses?.length > 0 && !selectedCourse) {
          setSelectedCourse(res.data.assignedCourses[0]);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    if (!selectedCourse) return;
    setAttendanceSavedMsg('');
    try {
      const res = await api.get(`/teacher/courses/${selectedCourse.id}/attendance`, {
        params: { date: attendanceDate }
      });
      setAttendanceStudents(res.data.records || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMarks = async () => {
    if (!selectedCourse) return;
    setMarksSavedMsg('');
    try {
      const res = await api.get(`/teacher/courses/${selectedCourse.id}/marks`);
      setMarksList(res.data.marks || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await api.get('/teacher/assignments');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaterials = async () => {
    if (!selectedCourse) return;
    try {
      const res = await api.get(`/teacher/courses/${selectedCourse.id}/materials`);
      setMaterials(res.data.materials || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubmissions = async (assignment) => {
    setSelectedAssignment(assignment);
    try {
      const res = await api.get(`/teacher/assignments/${assignment.id}/submissions`);
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleToggleAttendanceStatus = (studentId) => {
    setAttendanceStudents(prev =>
      prev.map(s => {
        if (s.student_id === studentId) {
          const nextStatus = s.status === 'present' ? 'absent' : s.status === 'absent' ? 'late' : 'present';
          return { ...s, status: nextStatus };
        }
        return s;
      })
    );
  };

  const handleSaveAttendance = async () => {
    try {
      await api.post('/teacher/attendance', {
        courseId: selectedCourse.id,
        date: attendanceDate,
        lectureTopic,
        studentRecords: attendanceStudents.map(s => ({ student_id: s.student_id, status: s.status }))
      });
      setAttendanceSavedMsg('Attendance successfully saved! (Low attendance observer triggered if < 75%)');
      setTimeout(() => setAttendanceSavedMsg(''), 4000);
      loadAttendance();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleUpdateMarkField = (studentId, field, val) => {
    setMarksList(prev =>
      prev.map(m => {
        if (m.student_id === studentId) {
          const updated = { ...m, [field]: Number(val) || 0 };
          updated.total = (Number(updated.quiz) || 0) + (Number(updated.assignment) || 0) + (Number(updated.mid) || 0) + (Number(updated.final) || 0);
          return updated;
        }
        return m;
      })
    );
  };

  const handleSaveMarks = async () => {
    try {
      const res = await api.post('/teacher/marks', {
        courseId: selectedCourse.id,
        marks: marksList,
        gradingType
      });
      setMarksSavedMsg(res.data.message);
      setTimeout(() => setMarksSavedMsg(''), 4000);
      loadMarks();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/assignments', {
        ...formData,
        course_id: selectedCourse.id
      });
      setModalType(null);
      setFormData({});
      loadAssignments();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/teacher/submissions/${selectedSubmission.id}/grade`, formData);
      setModalType(null);
      setFormData({});
      setSelectedSubmission(null);
      if (selectedAssignment) loadSubmissions(selectedAssignment);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleUploadMaterial = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/materials', {
        ...formData,
        course_id: selectedCourse.id
      });
      setModalType(null);
      setFormData({});
      loadMaterials();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    try {
      await api.post('/teacher/notices', {
        ...formData,
        courseId: selectedCourse.id
      });
      alert('Course notice broadcasted to enrolled students!');
      setModalType(null);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Faculty Overview', icon: LayoutDashboard },
    { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
    { id: 'marks', label: 'Marks & Grading', icon: Award },
    { id: 'assignments', label: 'Assignments & Review', icon: FileText },
    { id: 'materials', label: 'Course Materials', icon: Upload },
    { id: 'notices', label: 'Course Broadcast', icon: Megaphone }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar items={sidebarItems} activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* COURSE SELECTOR BAR FOR FACULTY */}
          {courses.length > 0 && activeTab !== 'overview' && activeTab !== 'assignments' && (
            <div className="mb-6 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-bold text-slate-700">Active Course Context:</span>
              </div>
              <select
                value={selectedCourse?.id || ''}
                onChange={(e) => {
                  const c = courses.find(item => item.id === Number(e.target.value));
                  setSelectedCourse(c);
                }}
                className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 bg-slate-50 focus:ring-2 focus:ring-primary-500 outline-none"
              >
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.title} ({c.class_name || 'Class'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Portal & Teaching Hub</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Manage lectures, record attendance, grade student work, and upload slides.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                  title="Assigned Courses"
                  value={stats?.totalCourses || 0}
                  subtitle="Current semester teaching load"
                  icon={BookOpen}
                  color="blue"
                />
                <StatCard
                  title="Active Assignments"
                  value={stats?.totalAssignments || 0}
                  subtitle="Homework & laboratory work"
                  icon={FileText}
                  color="purple"
                />
                <StatCard
                  title="Grading Engine"
                  value="Dynamic Strategy"
                  subtitle="Absolute & Relative Curving"
                  icon={Award}
                  color="emerald"
                />
              </div>

              {/* Assigned Courses Cards */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">My Assigned Subjects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {courses.map((c) => (
                    <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-mono text-xs font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-100">
                            {c.code}
                          </span>
                          <span className="text-xs font-bold text-slate-600">{c.class_name || 'BSCS-6A'}</span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-2">{c.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{c.credit_hours} Credit Hours • {c.total_enrolled || 5} Students</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCourse(c);
                            setActiveTab('attendance');
                          }}
                          className="flex-1 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-bold transition"
                        >
                          Mark Attendance
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourse(c);
                            setActiveTab('marks');
                          }}
                          className="flex-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition"
                        >
                          Enter Marks
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MARK ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Lecture Attendance Register</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Mark lecture attendance. (Same-day attendance edit policy is enforced).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportBtn reportType="attendance" filters={{ course_id: selectedCourse?.id }} label="Export Course Attendance" />
                  <button
                    onClick={handleSaveAttendance}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Save Attendance
                  </button>
                </div>
              </div>

              {attendanceSavedMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {attendanceSavedMsg}
                </div>
              )}

              {/* Controls */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lecture Date</label>
                  <input
                    type="date"
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    * Policy: Teachers can edit same-day attendance. Previous lecture records are archived.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lecture Topic / Notes</label>
                  <input
                    type="text"
                    value={lectureTopic}
                    onChange={(e) => setLectureTopic(e.target.value)}
                    placeholder="e.g. Behavioral Design Patterns: Strategy & Observer"
                    className="w-full p-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Student Attendance List */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Roll #</th>
                      <th className="px-4 py-3.5">Student Name</th>
                      <th className="px-4 py-3.5">Registration #</th>
                      <th className="px-4 py-3.5">Current Status</th>
                      <th className="px-4 py-3.5 text-right">Click to Toggle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceStudents.map((s) => (
                      <tr key={s.student_id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-mono font-bold text-slate-700">{s.roll_no || '-'}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{s.name}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{s.reg_no}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            s.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                            s.status === 'absent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {s.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                            {s.status === 'absent' && <XCircle className="w-3 h-3" />}
                            {s.status === 'late' && <Clock className="w-3 h-3" />}
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleToggleAttendanceStatus(s.student_id)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: MARKS & GRADING */}
          {activeTab === 'marks' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Grading & Marks</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Calculate grades and GPA automatically using Absolute or Relative GradingStrategy.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportBtn reportType="result" filters={{ course_id: selectedCourse?.id }} label="Export Results" />
                  <button
                    onClick={handleSaveMarks}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    Save & Compute Grades
                  </button>
                </div>
              </div>

              {marksSavedMsg && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {marksSavedMsg}
                </div>
              )}

              {/* Strategy Selector */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Active GradingStrategy:</span>
                  <p className="text-xs text-slate-500 mt-0.5">Choose which algorithm calculates letter grades & GPA:</p>
                </div>
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setGradingType('absolute')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      gradingType === 'absolute' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absolute Grading (Scale 85+ = A)
                  </button>
                  <button
                    onClick={() => setGradingType('relative')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      gradingType === 'relative' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Relative Grading (Bell Curve)
                  </button>
                </div>
              </div>

              {/* Marks Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Quiz (20)</th>
                      <th className="px-4 py-3.5">Assignment (20)</th>
                      <th className="px-4 py-3.5">Mid (30)</th>
                      <th className="px-4 py-3.5">Final (30)</th>
                      <th className="px-4 py-3.5 font-bold">Total (100)</th>
                      <th className="px-4 py-3.5 font-bold">Grade</th>
                      <th className="px-4 py-3.5 font-bold">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {marksList.map((m) => (
                      <tr key={m.student_id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {m.name}
                          <span className="block text-[10px] text-slate-400 font-mono font-normal">{m.reg_no}</span>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={m.quiz}
                            onChange={(e) => handleUpdateMarkField(m.student_id, 'quiz', e.target.value)}
                            className="w-16 p-1.5 border border-slate-200 rounded-lg text-center font-semibold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="20"
                            value={m.assignment}
                            onChange={(e) => handleUpdateMarkField(m.student_id, 'assignment', e.target.value)}
                            className="w-16 p-1.5 border border-slate-200 rounded-lg text-center font-semibold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={m.mid}
                            onChange={(e) => handleUpdateMarkField(m.student_id, 'mid', e.target.value)}
                            className="w-16 p-1.5 border border-slate-200 rounded-lg text-center font-semibold"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min="0"
                            max="30"
                            value={m.final}
                            onChange={(e) => handleUpdateMarkField(m.student_id, 'final', e.target.value)}
                            className="w-16 p-1.5 border border-slate-200 rounded-lg text-center font-semibold"
                          />
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">{m.total}</td>
                        <td className="px-4 py-3 font-extrabold text-primary-700">{m.grade}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{m.gpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ASSIGNMENTS & REVIEW */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Assignments & Submissions</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Upload assignments with deadlines and review/grade submitted work.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ max_marks: 100 });
                    setModalType('assignment');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Assignment</span>
                </button>
              </div>

              {/* Assignment Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignments.map((a) => (
                  <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {a.course_code}
                        </span>
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Due: {a.deadline}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{a.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{a.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">{a.submission_count || 0} Submissions</span>
                      <button
                        onClick={() => loadSubmissions(a)}
                        className="px-3 py-1.5 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg font-bold transition"
                      >
                        Review Submissions
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submissions Section if an assignment is clicked */}
              {selectedAssignment && (
                <div className="mt-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-bold text-slate-900">
                      Submissions for: <span className="text-primary-700">{selectedAssignment.title}</span>
                    </h3>
                    <button onClick={() => setSelectedAssignment(null)} className="text-xs text-slate-400 hover:text-slate-600">Close</button>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="px-4 py-2.5">Student</th>
                        <th className="px-4 py-2.5">Submission / Link</th>
                        <th className="px-4 py-2.5">Submitted At</th>
                        <th className="px-4 py-2.5">Marks</th>
                        <th className="px-4 py-2.5">Feedback</th>
                        <th className="px-4 py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {submissions.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-6 text-slate-400">No submissions uploaded yet.</td>
                        </tr>
                      ) : (
                        submissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">
                              {sub.student_name}
                              <span className="block text-[10px] text-slate-400 font-mono font-normal">{sub.reg_no}</span>
                            </td>
                            <td className="px-4 py-3">
                              {sub.file_url ? (
                                <a href={sub.file_url} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-1 font-semibold">
                                  View File <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : null}
                              {sub.submission_text && <p className="text-slate-600 text-[11px] mt-0.5">{sub.submission_text}</p>}
                            </td>
                            <td className="px-4 py-3 text-slate-500">{new Date(sub.submitted_at).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-slate-800">{sub.marks_obtained !== null ? `${sub.marks_obtained} / 100` : 'Ungraded'}</td>
                            <td className="px-4 py-3 text-slate-600">{sub.feedback || '-'}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => {
                                  setSelectedSubmission(sub);
                                  setFormData({ marks_obtained: sub.marks_obtained || 85, feedback: sub.feedback || '' });
                                  setModalType('gradeSubmission');
                                }}
                                className="px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg font-bold"
                              >
                                Grade
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: COURSE MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Materials & Slide Uploads</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Upload lecture notes, presentation slides, and reading materials.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({});
                    setModalType('material');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Upload Material</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((m) => (
                  <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{m.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-[11px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 font-bold hover:underline"
                      >
                        Download Resource <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: NOTICES */}
          {activeTab === 'notices' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Broadcast Course Notice</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Send immediate notification updates to enrolled students.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({});
                    setModalType('notice');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Send Notice</span>
                </button>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-xs text-slate-600">
                  Notices broadcast through this channel will alert all enrolled students of <strong className="text-slate-800">{selectedCourse?.code}: {selectedCourse?.title}</strong> and create an in-app notification row via the Observer pattern.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: CREATE ASSIGNMENT */}
      <Modal
        isOpen={modalType === 'assignment'}
        onClose={() => setModalType(null)}
        title="Upload Assignment"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assignment Title</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. Design Patterns Implementation"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Requirements</label>
            <textarea
              rows="3"
              required
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="Provide assignment brief and instructions..."
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deadline Date & Time</label>
              <input
                type="text"
                required
                value={formData.deadline || '2026-11-30 23:59:59'}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Marks</label>
              <input
                type="number"
                value={formData.max_marks || 100}
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Publish Assignment</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: GRADE SUBMISSION */}
      <Modal
        isOpen={modalType === 'gradeSubmission'}
        onClose={() => setModalType(null)}
        title={`Grade Submission - ${selectedSubmission?.student_name}`}
      >
        <form onSubmit={handleGradeSubmission} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Marks Obtained (out of 100)</label>
            <input
              type="number"
              min="0"
              max="100"
              required
              value={formData.marks_obtained || ''}
              onChange={(e) => setFormData({ ...formData, marks_obtained: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Teacher Feedback</label>
            <textarea
              rows="3"
              value={formData.feedback || ''}
              onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. Excellent implementation and documentation."
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold">Save Grade & Feedback</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: UPLOAD MATERIAL */}
      <Modal
        isOpen={modalType === 'material'}
        onClose={() => setModalType(null)}
        title="Upload Course Material / Slides"
      >
        <form onSubmit={handleUploadMaterial} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. Lecture 3: Repository Pattern Slides"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="Brief summary of lecture content"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Resource URL / Document Link</label>
            <input
              type="url"
              required
              value={formData.file_url || ''}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="https://drive.google.com/... or https://sms.edu/notes.pdf"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Upload Resource</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: BROADCAST NOTICE */}
      <Modal
        isOpen={modalType === 'notice'}
        onClose={() => setModalType(null)}
        title="Send Course Notice"
      >
        <form onSubmit={handleSendNotice} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notice Title</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. Quiz scheduled for next Monday"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Content</label>
            <textarea
              rows="4"
              required
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="Write the message for your enrolled students..."
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Broadcast</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
