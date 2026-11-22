import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BookOpen, GraduationCap, Users, Lock, Mail, User,
  Phone, Hash, Briefcase, ArrowRight, ArrowLeft, Eye, EyeOff, CheckCircle2, XCircle,
} from 'lucide-react';
import api from '../../services/api';

/* ─── Password Strength Helpers ─────────────────────────────────────── */
const RULES = [
  { id: 'len',   label: 'At least 8 characters',              test: (p) => p.length >= 8 },
  { id: 'upper', label: 'One uppercase letter (A-Z)',          test: (p) => /[A-Z]/.test(p) },
  { id: 'lower', label: 'One lowercase letter (a-z)',          test: (p) => /[a-z]/.test(p) },
  { id: 'digit', label: 'One number (0-9)',                    test: (p) => /\d/.test(p) },
  { id: 'spec',  label: 'One special character (!@#$%^&*)',    test: (p) => /[!@#$%^&*()_+\-=[\]{};':",.<>?/\\|`~]/.test(p) },
];

function getStrength(password) {
  const passed = RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: passed, label: 'Very Weak', color: 'bg-red-500' };
  if (passed === 2) return { score: passed, label: 'Weak',      color: 'bg-orange-400' };
  if (passed === 3) return { score: passed, label: 'Fair',      color: 'bg-yellow-400' };
  if (passed === 4) return { score: passed, label: 'Strong',    color: 'bg-lime-500' };
  return { score: passed, label: 'Very Strong', color: 'bg-green-500' };
}

/* ─── Reusable Input ─────────────────────────────────────────────────── */
function InputField({ label, name, type = 'text', value, onChange, placeholder, icon: Icon, required = false, right = null }) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">{label}</label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Icon className="w-4 h-4" />
        </div>
        <input
          name={name}
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
        />
        {right && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">{right}</div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────── */
export default function SignupPage() {
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    phone: '', reg_no: '', designation: '',
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const { setAuthUser } = useAuth();
  const navigate = useNavigate();

  /* Computed strength */
  const strength  = useMemo(() => getStrength(form.password), [form.password]);
  const ruleCheck = useMemo(() => RULES.map((r) => ({ ...r, ok: r.test(form.password) })), [form.password]);
  const allRulesPassed = ruleCheck.every((r) => r.ok);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!allRulesPassed) {
      setError('Please meet all password requirements before continuing.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (role === 'student' && !form.reg_no.trim()) {
      setError('Registration number is required for students.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
        role,
        phone:    form.phone.trim() || undefined,
        ...(role === 'student' && { reg_no:      form.reg_no.trim() }),
        ...(role === 'teacher' && { designation: form.designation.trim() || 'Lecturer' }),
      };

      const res = await api.post('/auth/signup', payload);
      const { token, user } = res.data;

      // Store token + user in context (using the correct sms_token key)
      setAuthUser(user, token);

      // Navigate to their dashboard
      if (user.role === 'teacher') navigate('/teacher');
      else navigate('/student');
    } catch (err) {
      setError(err.response?.data?.error || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Role config ── */
  const roles = [
    { id: 'student', label: 'Student', icon: GraduationCap,
      active:   'bg-blue-100 border-blue-400 text-blue-700 ring-2 ring-blue-400 ring-offset-1',
      inactive: 'bg-blue-50 border-slate-200 text-slate-600 hover:bg-blue-50 hover:border-blue-300',
      iconActive: 'text-blue-500', iconInactive: 'text-slate-400' },
    { id: 'teacher', label: 'Teacher', icon: Users,
      active:   'bg-emerald-100 border-emerald-400 text-emerald-700 ring-2 ring-emerald-400 ring-offset-1',
      inactive: 'bg-emerald-50 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:border-emerald-300',
      iconActive: 'text-emerald-500', iconInactive: 'text-slate-400' },
  ];

  /* ── Bar widths (5 segments) ── */
  const barWidth = `${(strength.score / 5) * 100}%`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-600 text-white shadow-xl mb-3 border border-primary-400/30">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create Account</h2>
        <p className="mt-1 text-sm text-slate-400">Join SmartSMS Portal</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-7 px-6 shadow-2xl rounded-3xl sm:px-10 border border-slate-100">

          {/* ── Back button ── */}
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-primary-600 mb-5 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>

          {/* ── Role Picker ── */}
          <div className="mb-5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-3">
              I am a…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {roles.map((r) => {
                const Icon = r.icon;
                const isActive = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setRole(r.id); setError(''); }}
                    className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 font-semibold transition
                      ${isActive ? r.active : r.inactive}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? r.iconActive : r.iconInactive}`} />
                    <span className="text-xs">{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Error Banner ── */}
          {error && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-3.5" onSubmit={handleSubmit}>

            {/* Full Name */}
            <InputField
              label="Full Name" name="name" required
              value={form.name} onChange={handleChange}
              placeholder="Muhammad Ali" icon={User}
            />

            {/* Email */}
            <InputField
              label="Email Address" name="email" type="email" required
              value={form.email} onChange={handleChange}
              placeholder="ali@university.edu" icon={Mail}
            />

            {/* Phone */}
            <InputField
              label="Phone (optional)" name="phone" type="tel"
              value={form.phone} onChange={handleChange}
              placeholder="+92 300 0000000" icon={Phone}
            />

            {/* Role-specific */}
            {role === 'student' && (
              <InputField
                label="Registration No." name="reg_no" required
                value={form.reg_no} onChange={handleChange}
                placeholder="2024-CS-001" icon={Hash}
              />
            )}
            {role === 'teacher' && (
              <InputField
                label="Designation" name="designation"
                value={form.designation} onChange={handleChange}
                placeholder="Lecturer / Assistant Professor" icon={Briefcase}
              />
            )}

            {/* Password with strength meter */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  className="block w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm placeholder-slate-400
                             focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength bar — only shown when user starts typing */}
              {form.password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  {/* Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: barWidth }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 ${
                      strength.score <= 1 ? 'text-red-500'
                      : strength.score === 2 ? 'text-orange-500'
                      : strength.score === 3 ? 'text-yellow-600'
                      : strength.score === 4 ? 'text-lime-600'
                      : 'text-green-600'
                    }`}>
                      {strength.label}
                    </span>
                  </div>
                  {/* Rule checklist */}
                  <ul className="grid grid-cols-1 gap-0.5">
                    {ruleCheck.map((r) => (
                      <li key={r.id} className={`flex items-center gap-1.5 text-[10px] font-medium transition ${r.ok ? 'text-green-600' : 'text-slate-400'}`}>
                        {r.ok
                          ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-500" />
                          : <XCircle      className="w-3 h-3 shrink-0 text-slate-300" />}
                        {r.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Confirm Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  className={`block w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm placeholder-slate-400
                              focus:outline-none focus:ring-2 focus:ring-primary-500 transition
                              ${form.confirmPassword.length > 0
                                ? form.password === form.confirmPassword
                                  ? 'border-green-400 focus:border-green-500'
                                  : 'border-red-400 focus:border-red-500'
                                : 'border-slate-300 focus:border-primary-500'
                              }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword.length > 0 && (
                <p className={`mt-1 text-[10px] font-semibold ${form.password === form.confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                  {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent
                         rounded-xl shadow-md text-sm font-bold text-white bg-primary-600 hover:bg-primary-700
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
                         transition disabled:opacity-50 disabled:cursor-not-allowed mt-1"
            >
              <span>{loading ? 'Creating Account…' : 'Create Account'}</span>
              {!loading && <ArrowRight className="w-4 h-4" />}
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            </button>
          </form>

          {/* Sign-in link */}
          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-primary-600 hover:text-primary-700 underline underline-offset-2"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
