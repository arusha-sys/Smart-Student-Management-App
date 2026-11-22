import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import AlertBanner from '../../components/AlertBanner';
import Modal from '../../components/Modal';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, BookOpen, CalendarCheck, Award, FileText,
  Calendar, Upload, DollarSign, Download, ExternalLink, AlertTriangle, CheckCircle2, UserCheck
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, updateUserProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Entities state
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [fees, setFees] = useState([]);
  const [notices, setNotices] = useState([]);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'submitAssignment' | 'profile' | 'password'
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'courses') loadCourses();
    else if (activeTab === 'attendance') loadAttendance();
    else if (activeTab === 'results') loadResults();
    else if (activeTab === 'assignments') loadAssignments();
    else if (activeTab === 'timetable') loadTimetable();
    else if (activeTab === 'materials') loadMaterials();
    else if (activeTab === 'fees') loadFees();
    else if (activeTab === 'notices') loadNotices();
  }, [activeTab]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/student/dashboard');
      if (res.data.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get('/student/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAttendance = async () => {
    try {
      const res = await api.get('/student/attendance');
      setAttendance(res.data.attendance || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadResults = async () => {
    try {
      const res = await api.get('/student/results');
      setResults(res.data.results || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAssignments = async () => {
    try {
      const res = await api.get('/student/assignments');
      setAssignments(res.data.assignments || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTimetable = async () => {
    try {
      const res = await api.get('/student/timetable');
      setTimetable(res.data.timetable || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadMaterials = async () => {
    try {
      const res = await api.get('/student/materials');
      setMaterials(res.data.materials || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFees = async () => {
    try {
      const res = await api.get('/student/fees');
      setFees(res.data.fees || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadNotices = async () => {
    try {
      const res = await api.get('/student/notices');
      setNotices(res.data.notices || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleSubmitAssignment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/student/assignments/submit', {
        assignment_id: selectedAssignment.id,
        submission_text: formData.submission_text,
        file_url: formData.file_url
      });
      alert('Assignment submitted successfully before deadline!');
      setModalType(null);
      setFormData({});
      loadAssignments();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDownloadChallan = async (feeId) => {
    try {
      const res = await api.get(`/student/fees/${feeId}/challan`, {
        responseType: 'blob'
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Fee_Challan_${feeId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Download failed: ${err.message}`);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put('/auth/profile', {
        phone: formData.phone,
        address: formData.address
      });
      updateUserProfile({ phone: formData.phone, address: formData.address });
      alert('Profile updated successfully!');
      setModalType(null);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/change-password', {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      });
      alert('Password updated successfully!');
      setModalType(null);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Student Dashboard', icon: LayoutDashboard },
    { id: 'courses', label: 'Registered Courses', icon: BookOpen },
    {
      id: 'attendance',
      label: 'Attendance Register',
      icon: CalendarCheck,
      badge: dashboardData?.stats?.lowAttendanceCount > 0 ? dashboardData.stats.lowAttendanceCount : undefined
    },
    { id: 'results', label: 'Results & Transcript', icon: Award },
    { id: 'assignments', label: 'Assignments & Work', icon: FileText },
    { id: 'timetable', label: 'Class Timetable', icon: Calendar },
    { id: 'materials', label: 'Lecture Materials', icon: Upload },
    { id: 'fees', label: 'Fee Challan & Dues', icon: DollarSign },
    { id: 'profile', label: 'Student Profile', icon: UserCheck }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto">
        <Sidebar items={sidebarItems} activeTab={activeTab} onSelectTab={setActiveTab} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Profile Card Header */}
              <div className="bg-gradient-to-r from-primary-800 to-primary-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary-700/60 border border-primary-500/40 text-[10px] font-bold tracking-wider uppercase mb-1.5">
                    Semester {dashboardData?.student?.semester || 6} • Section {dashboardData?.student?.section || 'A'}
                  </div>
                  <h1 className="text-2xl font-black tracking-tight">{user?.name}</h1>
                  <p className="text-xs text-primary-200 mt-1">
                    Registration No: <span className="font-mono font-bold text-white">{dashboardData?.student?.reg_no}</span> • Roll: {dashboardData?.student?.roll_no}
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20 text-center min-w-[130px]">
                  <p className="text-[10px] uppercase tracking-wider text-primary-200 font-bold">Cumulative GPA</p>
                  <p className="text-2xl font-black text-white mt-0.5">{dashboardData?.student?.cgpa || '3.58'}</p>
                </div>
              </div>

              {/* CRITICAL ATTENDANCE WARNING ALERT (if below 75%) */}
              {dashboardData?.lowAttendanceWarnings && dashboardData.lowAttendanceWarnings.length > 0 && (
                <div className="space-y-2">
                  {dashboardData.lowAttendanceWarnings.map(w => (
                    <AlertBanner
                      key={w.courseId}
                      type="danger"
                      title="CRITICAL ATTENDANCE WARNING (< 75%)"
                      message={`Your attendance in "${w.courseTitle} (${w.courseCode})" has dropped to ${w.percentage}%, which is below the mandatory 75% university policy. You risk being debarred from final examinations!`}
                      actionText="View Attendance"
                      onAction={() => setActiveTab('attendance')}
                    />
                  ))}
                </div>
              )}

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Enrolled Courses"
                  value={dashboardData?.stats?.enrolledCoursesCount || 4}
                  subtitle="Active this semester"
                  icon={BookOpen}
                  color="blue"
                />
                <StatCard
                  title="Current Semester GPA"
                  value={dashboardData?.student?.gpa || '3.65'}
                  subtitle="Scale of 4.00"
                  icon={Award}
                  color="emerald"
                />
                <StatCard
                  title="Attendance Risk"
                  value={dashboardData?.stats?.lowAttendanceCount > 0 ? `${dashboardData.stats.lowAttendanceCount} Warning` : 'Compliant'}
                  subtitle={dashboardData?.stats?.lowAttendanceCount > 0 ? 'Below 75% threshold' : 'All subjects ≥ 75%'}
                  icon={AlertTriangle}
                  color={dashboardData?.stats?.lowAttendanceCount > 0 ? 'rose' : 'emerald'}
                />
                <StatCard
                  title="Tuition Fee Status"
                  value={dashboardData?.feeOverview?.status ? dashboardData.feeOverview.status.toUpperCase() : 'CLEAR'}
                  subtitle={dashboardData?.feeOverview?.final_amount ? `PKR ${dashboardData.feeOverview.final_amount.toLocaleString()}` : 'No balance'}
                  icon={DollarSign}
                  color={dashboardData?.feeOverview?.status === 'paid' ? 'emerald' : 'amber'}
                />
              </div>

              {/* Recent Broadcasts */}
              {dashboardData?.recentNotices && dashboardData.recentNotices.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Campus & Course Notices</h3>
                  <div className="space-y-2.5">
                    {dashboardData.recentNotices.map((n) => (
                      <div key={n.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-start">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{n.title}</h4>
                          <p className="text-xs text-slate-600 mt-1">{n.content}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">From: {n.author_name} • {new Date(n.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: REGISTERED COURSES */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Registered Courses</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Courses currently registered for Semester {user?.details?.semester || 6}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold bg-primary-50 text-primary-700 px-2.5 py-0.5 rounded border border-primary-100">
                          {c.code}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{c.credit_hours} Credits</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{c.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">Instructor: <span className="font-semibold text-slate-800">{c.teacher_name || 'Assigned Faculty'}</span></p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                      <button
                        onClick={() => setActiveTab('attendance')}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition text-center"
                      >
                        Check Attendance
                      </button>
                      <button
                        onClick={() => setActiveTab('results')}
                        className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition text-center"
                      >
                        View Grades
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE WITH WARNINGS */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Attendance Register & Percentage</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Course-by-course attendance percentage. Mandatory minimum: 75%.</p>
              </div>

              <div className="space-y-4">
                {attendance.map((c) => (
                  <div
                    key={c.courseId}
                    className={`bg-white p-6 rounded-2xl border shadow-sm transition ${
                      c.isWarning ? 'border-red-300 ring-1 ring-red-200 bg-red-50/10' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                            {c.courseCode}
                          </span>
                          <h4 className="text-base font-bold text-slate-900">{c.courseTitle}</h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Instructor: {c.teacherName}</p>
                      </div>

                      {/* Percentage Badge */}
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-2xl font-black text-slate-900">{c.percentage}%</p>
                          <p className="text-[10px] text-slate-400 font-semibold">{c.presentCount} of {c.totalLectures} Lectures</p>
                        </div>
                        {c.isWarning ? (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> Below 75% Warning
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${c.isWarning ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Recent Lectures Details */}
                    {c.records && c.records.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 text-[11px]">
                        <span className="text-slate-400 font-bold self-center mr-1">Past Lectures:</span>
                        {c.records.slice(0, 8).map(r => (
                          <span
                            key={r.id}
                            className={`px-2 py-0.5 rounded-lg font-mono font-bold ${
                              r.status === 'present' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              r.status === 'absent' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                            title={`${r.date}: ${r.lecture_topic || r.status}`}
                          >
                            {r.date.split('-').slice(1).join('/')}: {r.status[0].toUpperCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: RESULTS & TRANSCRIPT */}
          {activeTab === 'results' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Academic Results & Grades</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Automatic grading and GPA computed via GradingStrategy.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current CGPA</span>
                  <p className="text-xl font-black text-primary-700">{user?.details?.cgpa || '3.58'}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Course Code & Title</th>
                      <th className="px-4 py-3.5">Quiz</th>
                      <th className="px-4 py-3.5">Assignment</th>
                      <th className="px-4 py-3.5">Midterm</th>
                      <th className="px-4 py-3.5">Final</th>
                      <th className="px-4 py-3.5 font-bold">Total</th>
                      <th className="px-4 py-3.5 font-bold">Grade</th>
                      <th className="px-4 py-3.5 font-bold">GPA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {results.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-primary-700">{r.course_code}</span>
                          <span className="block text-slate-800 font-semibold">{r.course_title}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{r.quiz} / 20</td>
                        <td className="px-4 py-3 text-slate-600">{r.assignment} / 20</td>
                        <td className="px-4 py-3 text-slate-600">{r.mid} / 30</td>
                        <td className="px-4 py-3 text-slate-600">{r.final} / 30</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{r.total}</td>
                        <td className="px-4 py-3 font-extrabold text-primary-700">{r.grade}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800">{r.gpa}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ASSIGNMENTS & SUBMISSION */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Assignments & Submissions</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">View active assignments, upload work before the deadline, and inspect teacher feedback.</p>
              </div>

              <div className="space-y-4">
                {assignments.map((a) => (
                  <div key={a.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {a.course_code}
                        </span>
                        <span className="text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          Deadline: {a.deadline}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{a.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{a.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      {a.submission_id ? (
                        <div className="flex items-center gap-2">
                          <span className="bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold">
                            Submitted ({new Date(a.submitted_at).toLocaleDateString()})
                          </span>
                          {a.marks_obtained !== null && (
                            <span className="font-bold text-slate-800">
                              Marks: {a.marks_obtained} / 100 • Feedback: "{a.feedback}"
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-600 font-bold">Pending Submission</span>
                      )}

                      <button
                        onClick={() => {
                          setSelectedAssignment(a);
                          setFormData({ submission_text: '', file_url: '' });
                          setModalType('submitAssignment');
                        }}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-sm transition"
                      >
                        {a.submission_id ? 'Re-upload Submission' : 'Submit Work'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Class Lecture Timetable</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Weekly schedule of lectures and lab rooms.</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Day</th>
                      <th className="px-4 py-3.5">Time</th>
                      <th className="px-4 py-3.5">Course</th>
                      <th className="px-4 py-3.5">Instructor</th>
                      <th className="px-4 py-3.5">Room</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timetable.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{t.day}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{t.start_time} - {t.end_time}</td>
                        <td className="px-4 py-3 font-semibold text-primary-700">{t.course_code}: {t.course_title}</td>
                        <td className="px-4 py-3 text-slate-600">{t.teacher_name}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{t.room}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: LECTURE MATERIALS */}
          {activeTab === 'materials' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Course Slides & Notes</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Download official instructor materials and lecture slides.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {materials.map((m) => (
                  <div key={m.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded">
                          {m.course_code}
                        </span>
                        <span className="text-[10px] text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{m.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{m.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="text-slate-500">Instructor: {m.teacher_name}</span>
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-primary-600 font-bold hover:underline"
                      >
                        Download PDF <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: FEES & DOWNLOAD CHALLAN */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Fee Challan & Status</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">View semester tuition dues and download the printable bank deposit challan (PDF).</p>
              </div>

              <div className="space-y-4">
                {fees.map((f) => (
                  <div key={f.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black text-slate-900">{f.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {f.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Due Date: <span className="font-semibold text-slate-800">{f.due_date}</span></p>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-black text-primary-700">PKR {Number(f.final_amount).toLocaleString()}</p>
                        {f.discount_amount > 0 && (
                          <p className="text-xs text-emerald-700 font-medium">
                            Scholarship applied: -PKR {Number(f.discount_amount).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => handleDownloadChallan(f.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Fee Challan (PDF)</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: STUDENT PROFILE & EDIT */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Student Profile & Settings</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Update permitted contact information (phone, address) and update password.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 max-w-2xl">
                <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Contact Information</h3>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name (Read-Only)</label>
                    <input type="text" disabled value={user?.name || ''} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email (Read-Only)</label>
                    <input type="email" disabled value={user?.email || ''} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-semibold" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone !== undefined ? formData.phone : (user?.phone || '')}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="+92 300 0000000"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Residential Address</label>
                    <textarea
                      rows="2"
                      value={formData.address !== undefined ? formData.address : (user?.address || '')}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="Enter street, city address..."
                    />
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md">
                      Update Profile
                    </button>
                  </div>
                </form>

                <div className="pt-6 border-t border-slate-200">
                  <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Security & Password</h3>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                      <input
                        type="password"
                        required
                        value={formData.oldPassword || ''}
                        onChange={(e) => setFormData({ ...formData, oldPassword: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                        placeholder="••••••••••••"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">New Password</label>
                      <input
                        type="password"
                        required
                        value={formData.newPassword || ''}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl"
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="pt-2">
                      <button type="submit" className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold shadow-md">
                        Change Password
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: SUBMIT ASSIGNMENT */}
      <Modal
        isOpen={modalType === 'submitAssignment'}
        onClose={() => setModalType(null)}
        title={`Submit Work: ${selectedAssignment?.title}`}
      >
        <form onSubmit={handleSubmitAssignment} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Submission Notes / Written Answer</label>
            <textarea
              rows="3"
              value={formData.submission_text || ''}
              onChange={(e) => setFormData({ ...formData, submission_text: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="Enter text response, solution notes, or summary..."
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Project File / Repository Link</label>
            <input
              type="url"
              required
              value={formData.file_url || ''}
              onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. https://github.com/my-project or https://drive.google.com/..."
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Submit Assignment</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
