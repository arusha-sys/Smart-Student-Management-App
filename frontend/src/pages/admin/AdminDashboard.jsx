import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import StatCard from '../../components/StatCard';
import Modal from '../../components/Modal';
import ExportBtn from '../../components/ExportBtn';
import api from '../../services/api';
import {
  LayoutDashboard, Users, BookOpen, Layers, Calendar, DollarSign,
  Megaphone, FileText, Plus, Search, Shield, Ban, CheckCircle, KeyRound, Trash2, Edit3
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Entities state
  const [users, setUsers] = useState([]);
  const [userRoleFilter, setUserRoleFilter] = useState('student');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [fees, setFees] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  // Modals state
  const [modalType, setModalType] = useState(null); // 'user' | 'course' | 'class' | 'timetable' | 'fee' | 'announcement' | 'resetPassword'
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') loadUsers();
    else if (activeTab === 'courses') loadCourses();
    else if (activeTab === 'classes') loadClasses();
    else if (activeTab === 'timetable') loadTimetable();
    else if (activeTab === 'fees') loadFees();
    else if (activeTab === 'announcements') loadAnnouncements();
  }, [activeTab, userRoleFilter, userSearchQuery]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/dashboard-stats');
      if (res.data.success) {
        setStats(res.data.stats);
        setChartData(res.data.chartData);
      }
      // Also load classes and teachers for dropdowns
      const [clsRes, tchRes] = await Promise.all([
        api.get('/admin/classes'),
        api.get('/admin/users?role=teacher')
      ]);
      setClasses(clsRes.data.classes || []);
      setTeachers(tchRes.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get('/admin/users', {
        params: { role: userRoleFilter, query: userSearchQuery }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCourses = async () => {
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data.courses || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadClasses = async () => {
    try {
      const res = await api.get('/admin/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadTimetable = async () => {
    try {
      const res = await api.get('/admin/timetable');
      setTimetables(res.data.timetable || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadFees = async () => {
    try {
      const res = await api.get('/admin/fees');
      setFees(res.data.fees || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await api.get('/admin/announcements');
      setAnnouncements(res.data.announcements || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Actions
  const handleToggleBlock = async (userId, currentStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/block`, { isBlocked: !currentStatus });
      loadUsers();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      loadUsers();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        await api.put(`/admin/users/${selectedUser.id}`, formData);
      } else {
        await api.post('/admin/users', { ...formData, role: userRoleFilter });
      }
      setModalType(null);
      setSelectedUser(null);
      setFormData({});
      loadUsers();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/admin/users/${selectedUser.id}/reset-password`, {
        newPassword: formData.newPassword || 'Password@123'
      });
      alert(res.data.message);
      setModalType(null);
      setSelectedUser(null);
      setFormData({});
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/courses', formData);
      setModalType(null);
      setFormData({});
      loadCourses();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/classes', formData);
      setModalType(null);
      setFormData({});
      loadClasses();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/timetable', formData);
      setModalType(null);
      setFormData({});
      loadTimetable();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/fees', formData);
      setModalType(null);
      setFormData({});
      loadFees();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleUpdateFeeStatus = async (feeId, status) => {
    try {
      await api.patch(`/admin/fees/${feeId}/status`, { status });
      loadFees();
      loadDashboardData();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const handleCreateAnnouncement = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/announcements', formData);
      setModalType(null);
      setFormData({});
      loadAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  const sidebarItems = [
    { id: 'overview', label: 'Admin Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Directory', icon: Users },
    { id: 'courses', label: 'Course Management', icon: BookOpen },
    { id: 'classes', label: 'Classes & Sections', icon: Layers },
    { id: 'timetable', label: 'Timetable Scheduler', icon: Calendar },
    { id: 'fees', label: 'Fee Management', icon: DollarSign },
    { id: 'announcements', label: 'Notices & Broadcast', icon: Megaphone },
    { id: 'reports', label: 'Reports & Analytics', icon: FileText }
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
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">University Administration Hub</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Real-time system telemetry, academic stats, and governance controls.</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="Enrolled Students"
                  value={stats?.totalStudents || 0}
                  subtitle="Active academic profiles"
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="Faculty Members"
                  value={stats?.totalTeachers || 0}
                  subtitle="Assigned course instructors"
                  icon={Shield}
                  color="emerald"
                />
                <StatCard
                  title="Active Courses"
                  value={stats?.totalCourses || 0}
                  subtitle="Across all departments"
                  icon={BookOpen}
                  color="purple"
                />
                <StatCard
                  title="Overall Attendance"
                  value={`${stats?.overallAttendance || 0}%`}
                  subtitle="Campus aggregate"
                  icon={CheckCircle}
                  color={stats?.overallAttendance < 75 ? 'amber' : 'emerald'}
                />
              </div>

              {/* Fee Cards & Visual Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Fee Collection Overview</h3>
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span className="text-emerald-700">Collected: PKR {(stats?.feeCollected || 0).toLocaleString()}</span>
                          <span className="text-amber-700">Pending: PKR {(stats?.feePending || 0).toLocaleString()}</span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                          <div
                            className="bg-emerald-500 h-full"
                            style={{
                              width: `${((stats?.feeCollected || 0) / Math.max((stats?.feeCollected || 0) + (stats?.feePending || 0), 1)) * 100}%`
                            }}
                          />
                          <div
                            className="bg-amber-400 h-full"
                            style={{
                              width: `${((stats?.feePending || 0) / Math.max((stats?.feeCollected || 0) + (stats?.feePending || 0), 1)) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                    <span>Total Vouchers Issued</span>
                    <span className="font-bold text-slate-800">
                      PKR {((stats?.feeCollected || 0) + (stats?.feePending || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Quick Academic Reports</h3>
                    <ExportBtn reportType="attendance" label="Export Attendance (PDF/Excel)" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-blue-900">Attendance Report</p>
                        <p className="text-[11px] text-blue-600 mt-1">Full breakdown of daily lecture statuses</p>
                      </div>
                      <div className="mt-3">
                        <ExportBtn reportType="attendance" label="Download" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-purple-900">Results & GPA Report</p>
                        <p className="text-[11px] text-purple-600 mt-1">Quiz, Mid, Final, Grades & GPAs</p>
                      </div>
                      <div className="mt-3">
                        <ExportBtn reportType="result" label="Download" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-900">Fee Collection Report</p>
                        <p className="text-[11px] text-emerald-600 mt-1">Vouchers, scholarships & deposits</p>
                      </div>
                      <div className="mt-3">
                        <ExportBtn reportType="fee" label="Download" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Directory</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Create, edit, block, search, and manage roles.</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setFormData({});
                    setModalType('user');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add {userRoleFilter === 'student' ? 'Student' : 'Teacher'}</span>
                </button>
              </div>

              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex rounded-xl bg-slate-100 p-1">
                  <button
                    onClick={() => setUserRoleFilter('student')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      userRoleFilter === 'student' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => setUserRoleFilter('teacher')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                      userRoleFilter === 'teacher' ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Faculty
                  </button>
                </div>

                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Search by name, email, or registration number..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Users Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Name</th>
                        <th className="px-4 py-3.5">Contact / Email</th>
                        {userRoleFilter === 'student' ? (
                          <>
                            <th className="px-4 py-3.5">Reg #</th>
                            <th className="px-4 py-3.5">Class & Sem</th>
                            <th className="px-4 py-3.5">CGPA</th>
                          </>
                        ) : (
                          <>
                            <th className="px-4 py-3.5">Designation</th>
                            <th className="px-4 py-3.5">Department</th>
                          </>
                        )}
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-slate-400">No users found matching query.</td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition">
                            <td className="px-4 py-3 font-bold text-slate-900">{u.name}</td>
                            <td className="px-4 py-3 text-slate-500">
                              <div>{u.email}</div>
                              <div className="text-[10px] text-slate-400">{u.phone || 'No phone'}</div>
                            </td>
                            {userRoleFilter === 'student' ? (
                              <>
                                <td className="px-4 py-3 font-mono font-semibold text-primary-700">{u.reg_no || '-'}</td>
                                <td className="px-4 py-3 text-slate-600">{u.class_name || `Sem ${u.semester || 1}`} ({u.section || 'A'})</td>
                                <td className="px-4 py-3 font-bold text-slate-800">{u.cgpa || u.gpa || '0.00'}</td>
                              </>
                            ) : (
                              <>
                                <td className="px-4 py-3 text-slate-700 font-medium">{u.designation || 'Lecturer'}</td>
                                <td className="px-4 py-3 text-slate-600">{u.department || 'Computer Science'}</td>
                              </>
                            )}
                            <td className="px-4 py-3">
                              {u.is_blocked ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <Ban className="w-3 h-3" /> Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                  <CheckCircle className="w-3 h-3" /> Active
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleToggleBlock(u.user_id || u.id, u.is_blocked)}
                                  className={`p-1.5 rounded-lg text-xs transition ${
                                    u.is_blocked ? 'text-emerald-600 hover:bg-emerald-50' : 'text-amber-600 hover:bg-amber-50'
                                  }`}
                                  title={u.is_blocked ? 'Unblock Account' : 'Block Account'}
                                >
                                  <Ban className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setFormData({ newPassword: '' });
                                    setModalType('resetPassword');
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(u.user_id || u.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COURSE MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Courses & Curriculum</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Create courses, assign faculty instructors, and track enrollments.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({});
                    setModalType('course');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Course</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((c) => (
                  <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded border border-primary-100">
                          {c.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500">{c.credit_hours} Credit Hours</span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 mt-2">{c.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">Instructor: <span className="font-semibold text-slate-800">{c.teacher_name || 'Unassigned'}</span></p>
                      <p className="text-xs text-slate-500">Class: {c.class_name || `Semester ${c.semester}`}</p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-600">{c.enrolled_count || 0} Students Enrolled</span>
                      <button
                        onClick={async () => {
                          if (window.confirm('Delete course?')) {
                            await api.delete(`/admin/courses/${c.id}`);
                            loadCourses();
                          }
                        }}
                        className="text-slate-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CLASSES & SECTIONS */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Classes & Sections</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Configure academic classes, section cohorts, and semester batches.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({});
                    setModalType('class');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Class</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {classes.map((cl) => (
                  <div key={cl.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-black text-slate-900">{cl.name}</h4>
                      <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-xs">Section {cl.section}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">Semester {cl.semester}</p>
                    <p className="text-xs text-slate-400">{cl.department}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: TIMETABLE */}
          {activeTab === 'timetable' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Timetable Scheduler</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Schedule lectures with room allocations, course codes, and teacher assignments.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({});
                    setModalType('timetable');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Timetable Slot</span>
                </button>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Day</th>
                      <th className="px-4 py-3.5">Time Slot</th>
                      <th className="px-4 py-3.5">Course</th>
                      <th className="px-4 py-3.5">Class</th>
                      <th className="px-4 py-3.5">Instructor</th>
                      <th className="px-4 py-3.5">Room</th>
                      <th className="px-4 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timetables.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3 font-bold text-slate-900">{t.day}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{t.start_time} - {t.end_time}</td>
                        <td className="px-4 py-3 font-semibold text-primary-700">{t.course_code}: {t.course_title}</td>
                        <td className="px-4 py-3 text-slate-700">{t.class_name}</td>
                        <td className="px-4 py-3 text-slate-600">{t.teacher_name}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{t.room}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async () => {
                              await api.delete(`/admin/timetable/${t.id}`);
                              loadTimetable();
                            }}
                            className="text-slate-400 hover:text-red-600 p-1 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FEES */}
          {activeTab === 'fees' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Fee Management</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Issue tuition vouchers, apply merit scholarships, and update statuses.</p>
                </div>
                <div className="flex items-center gap-2">
                  <ExportBtn reportType="fee" label="Export Fees" />
                  <button
                    onClick={() => {
                      setFormData({});
                      setModalType('fee');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Issue Voucher</span>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3.5">Student</th>
                      <th className="px-4 py-3.5">Challan Description</th>
                      <th className="px-4 py-3.5">Base Fee</th>
                      <th className="px-4 py-3.5">Discount</th>
                      <th className="px-4 py-3.5">Payable</th>
                      <th className="px-4 py-3.5">Due Date</th>
                      <th className="px-4 py-3.5">Status</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fees.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900">{f.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{f.reg_no}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-medium">{f.title}</td>
                        <td className="px-4 py-3 text-slate-600">PKR {Number(f.base_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-emerald-700">
                          {f.discount_amount > 0 ? `-PKR ${Number(f.discount_amount).toLocaleString()} (${f.discount_type})` : '-'}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">PKR {Number(f.final_amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-500">{f.due_date}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            f.status === 'paid' ? 'bg-emerald-100 text-emerald-700' :
                            f.status === 'partial' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <select
                            value={f.status}
                            onChange={(e) => handleUpdateFeeStatus(f.id, e.target.value)}
                            className="border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="pending">Pending</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">Notices & Campus Broadcasts</h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">Send announcements to all users, faculty only, students only, or specific classes.</p>
                </div>
                <button
                  onClick={() => {
                    setFormData({ target_role: 'all' });
                    setModalType('announcement');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Post Notice</span>
                </button>
              </div>

              <div className="space-y-3">
                {announcements.map((a) => (
                  <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-slate-900">{a.title}</h4>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Target: {a.target_role === 'class' ? `Class ${a.class_name || ''}` : a.target_role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2 leading-relaxed">{a.content}</p>
                      <div className="flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                        <span>Posted by: {a.author_name}</span>
                        <span>•</span>
                        <span>{new Date(a.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await api.delete(`/admin/announcements/${a.id}`);
                        loadAnnouncements();
                      }}
                      className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: REPORTS */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Institutional Reports & Analytics</h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">Export official university documents formatted in PDF or Excel / CSV.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Attendance Report</h3>
                    <p className="text-xs text-slate-500 mt-1">Comprehensive roll-call audit log with student percentages and course IDs.</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <ExportBtn reportType="attendance" label="Generate & Download" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Academic Results & Grades</h3>
                    <p className="text-xs text-slate-500 mt-1">Evaluation of Quiz, Assignment, Midterm, Final exams with GPA computed via GradingStrategy.</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <ExportBtn reportType="result" label="Generate & Download" />
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                      <FileText className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Fee Accounts Ledger</h3>
                    <p className="text-xs text-slate-500 mt-1">Financial reconciliation report showing paid, pending, and partial tuition fee statuses.</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <ExportBtn reportType="fee" label="Generate & Download" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL: ADD / EDIT USER */}
      <Modal
        isOpen={modalType === 'user'}
        onClose={() => setModalType(null)}
        title={`Add New ${userRoleFilter === 'student' ? 'Student' : 'Faculty Member'}`}
      >
        <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Ali Ahmed"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. ali@sms.edu"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Initial Password</label>
            <input
              type="password"
              required
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="••••••••••••"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="+92 300 1234567"
            />
          </div>

          {userRoleFilter === 'student' ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Registration No</label>
                  <input
                    type="text"
                    required
                    value={formData.reg_no || ''}
                    onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                    placeholder="2026-CS-101"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Assign Class</label>
                  <select
                    value={formData.class_id || ''}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="">Select Class</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.section})</option>)}
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={formData.designation || ''}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Assistant Professor"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Computer Science"
                />
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md"
            >
              Save User Profile
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RESET PASSWORD */}
      <Modal
        isOpen={modalType === 'resetPassword'}
        onClose={() => setModalType(null)}
        title={`Reset Password for ${selectedUser?.name}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
          <p className="text-slate-600">Enter a new secure password for this user account:</p>
          <div>
            <label className="block font-bold text-slate-700 mb-1">New Password</label>
            <input
              type="password"
              required
              value={formData.newPassword || ''}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="e.g. Password@123"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModalType(null)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-600 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md"
            >
              Confirm Password Reset
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE COURSE */}
      <Modal
        isOpen={modalType === 'course'}
        onClose={() => setModalType(null)}
        title="Create New Subject / Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Course Code</label>
              <input
                type="text"
                required
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl font-mono uppercase"
                placeholder="CS302"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Course Title</label>
              <input
                type="text"
                required
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
                placeholder="Software Construction & Dev"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Credit Hours</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.credit_hours || 3}
                onChange={(e) => setFormData({ ...formData, credit_hours: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class Cohort</label>
              <select
                value={formData.class_id || ''}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Assign Teacher</label>
            <select
              value={formData.teacher_id || ''}
              onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>)}
            </select>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Create Course</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE CLASS */}
      <Modal
        isOpen={modalType === 'class'}
        onClose={() => setModalType(null)}
        title="Create Class & Section"
      >
        <form onSubmit={handleCreateClass} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Class Name</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. BSCS-6A"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester || 6}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Section</label>
              <input
                type="text"
                required
                value={formData.section || 'A'}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl uppercase"
                placeholder="A"
              />
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Create Class</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: CREATE TIMETABLE ENTRY */}
      <Modal
        isOpen={modalType === 'timetable'}
        onClose={() => setModalType(null)}
        title="Schedule Timetable Slot"
      >
        <form onSubmit={handleCreateTimetable} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Course</label>
            <select
              required
              value={formData.course_id || ''}
              onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            >
              <option value="">Select Course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Class</label>
              <select
                required
                value={formData.class_id || ''}
                onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="">Select Class</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Teacher</label>
              <select
                value={formData.teacher_id || ''}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Day</label>
              <select
                required
                value={formData.day || 'Monday'}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                required
                value={formData.start_time || '09:00'}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                required
                value={formData.end_time || '10:30'}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Room / Lab</label>
            <input
              type="text"
              required
              value={formData.room || ''}
              onChange={(e) => setFormData({ ...formData, room: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. CS Lab 3 / Hall 201"
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Schedule Slot</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: POST ANNOUNCEMENT */}
      <Modal
        isOpen={modalType === 'announcement'}
        onClose={() => setModalType(null)}
        title="Post Notice / Announcement"
      >
        <form onSubmit={handleCreateAnnouncement} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="e.g. Midterm Examination Schedule"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Audience</label>
              <select
                value={formData.target_role || 'all'}
                onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              >
                <option value="all">Everyone (All)</option>
                <option value="student">Students Only</option>
                <option value="teacher">Faculty Only</option>
                <option value="class">Specific Class</option>
              </select>
            </div>
            {formData.target_role === 'class' && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Class</label>
                <select
                  required
                  value={formData.target_class_id || ''}
                  onChange={(e) => setFormData({ ...formData, target_class_id: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl"
                >
                  <option value="">Select Class</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Announcement Body</label>
            <textarea
              rows="4"
              required
              value={formData.content || ''}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
              placeholder="Write detailed notification details..."
            />
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Broadcast Notice</button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ISSUE FEE VOUCHER */}
      <Modal
        isOpen={modalType === 'fee'}
        onClose={() => setModalType(null)}
        title="Issue Fee Voucher (with Scholarship Strategy)"
      >
        <form onSubmit={handleCreateFee} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Student</label>
            <select
              required
              value={formData.studentId || ''}
              onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
              className="w-full p-2.5 border border-slate-300 rounded-xl"
            >
              <option value="">Select Student</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.reg_no})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fee Description</label>
              <input
                type="text"
                required
                value={formData.title || 'Semester 6 Tuition Fee'}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                required
                value={formData.semester || 6}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Base Amount (PKR)</label>
              <input
                type="number"
                required
                value={formData.baseAmount || 65000}
                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate || '2026-12-15'}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full p-2.5 border border-slate-300 rounded-xl"
              />
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <label className="block font-bold text-slate-700 mb-1">FeeCalculationStrategy</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="regular"
                  checked={formData.discountType !== 'scholarship'}
                  onChange={() => setFormData({ ...formData, discountType: 'regular' })}
                />
                <span>Regular (No discount)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="discountType"
                  value="scholarship"
                  checked={formData.discountType === 'scholarship'}
                  onChange={() => setFormData({ ...formData, discountType: 'scholarship' })}
                />
                <span>Merit Scholarship (via GPA)</span>
              </label>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button type="button" onClick={() => setModalType(null)} className="px-4 py-2 border rounded-xl">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-xl font-bold">Issue Challan</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
