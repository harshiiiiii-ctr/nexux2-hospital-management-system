import React, { useState } from 'react';
import { 
  HeartPulse, 
  Shield, 
  UserCheck, 
  Stethoscope, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  Sparkles,
  CheckCircle2,
  Building,
  Activity,
  Award
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { HOSPITAL_IMAGES } from '../../assets/images';

export const LoginPage: React.FC = () => {
  const { login, quickLogin, isLoading } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    try {
      await login(email.trim(), password);
      success('Logged in successfully!');
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid credentials');
      error(err.message || 'Login failed');
    }
  };

  const handleQuickLogin = async (role: 'admin' | 'receptionist' | 'doctor') => {
    setErrorMessage('');
    try {
      await quickLogin(role);
      success(`Welcome! Logged in as ${role.toUpperCase()}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Quick login failed');
      error('Could not authenticate');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50/70 via-slate-50 to-sky-50/70 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative Luminous Glow Elements */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-teal-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-200/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: Split Modern Hospital Presentation Card */}
      <div className="max-w-4xl w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-teal-100/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 z-10">
        
        {/* Left Column: Hospital Visuals & Brand Presentation */}
        <div className="lg:col-span-5 relative bg-gradient-to-br from-teal-800 via-teal-900 to-slate-900 text-white p-6 sm:p-8 flex flex-col justify-between overflow-hidden">
          {/* Background Hospital Image with Soft Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src={HOSPITAL_IMAGES.exterior}
              alt="Nexus Care Hospital Facility"
              className="w-full h-full object-cover opacity-25 scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-teal-950 via-teal-900/80 to-transparent" />
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/20 mb-6">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-400 to-emerald-300 text-teal-950 flex items-center justify-center font-black shadow-md">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-white text-lg tracking-tight">Nexus Care</h1>
                <p className="text-[10px] text-teal-200 font-medium">Healthcare Network</p>
              </div>
            </div>

            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold text-white leading-tight tracking-tight">
              Advanced Clinical Care & OPD Management
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-teal-100/90 leading-relaxed">
              Seamlessly orchestrating specialist patient intake, intelligent symptom categorization, real-time doctor scheduling, and digital invoicing.
            </p>
          </div>

          {/* Hospital Features Pills */}
          <div className="relative z-10 mt-8 space-y-2.5">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs">
              <Award className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="font-medium text-slate-100">Board-Certified Multi-Specialty Physicians</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs">
              <Activity className="w-4 h-4 text-cyan-300 shrink-0" />
              <span className="font-medium text-slate-100">Real-Time Clinical Triage & Specialist Match</span>
            </div>
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-xs">
              <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
              <span className="font-medium text-slate-100">Instant OPD Scheduling & Electronic Prescriptions</span>
            </div>
          </div>
        </div>

        {/* Right Column: Light, Crisp Login Form & Quick Selectors */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-800 border border-teal-200/80 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Hospital Staff Portal</span>
            </div>
            <h3 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Sign In to Workstation
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Select a staff role or enter your institutional credentials
            </p>
          </div>

          {/* 1-Click Role Switcher for instant access */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Quick Role Access
              </span>
              <span className="text-[11px] font-semibold text-teal-600">Click to switch</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {/* Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                disabled={isLoading}
                className="flex flex-col items-center p-3 rounded-2xl border border-violet-200 bg-violet-50/60 hover:bg-violet-100 text-left transition-all group cursor-pointer hover:shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-violet-950">Admin</span>
                <span className="text-[10px] text-violet-700/80 font-mono mt-0.5">admin123</span>
              </button>

              {/* Receptionist */}
              <button
                type="button"
                onClick={() => handleQuickLogin('receptionist')}
                disabled={isLoading}
                className="flex flex-col items-center p-3 rounded-2xl border border-teal-300 bg-teal-50/80 hover:bg-teal-100 text-left transition-all group cursor-pointer ring-2 ring-teal-500/20 hover:shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-teal-950">Reception</span>
                <span className="text-[10px] text-teal-700 font-mono mt-0.5">reception123</span>
              </button>

              {/* Doctor */}
              <button
                type="button"
                onClick={() => handleQuickLogin('doctor')}
                disabled={isLoading}
                className="flex flex-col items-center p-3 rounded-2xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-left transition-all group cursor-pointer hover:shadow-xs"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform shadow-xs">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-emerald-950">Doctor</span>
                <span className="text-[10px] text-emerald-700/80 font-mono mt-0.5">doctor123</span>
              </button>
            </div>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold">Or enter email</span>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. reception@medicare.com"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 via-teal-500 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 shadow-md shadow-teal-600/25 transition-all cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying...
                </span>
              ) : (
                <>
                  <span>Sign In to Nexus Care</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Institutional note */}
          <p className="mt-4 text-center text-[11px] text-slate-400">
            Nexus Care Multispecialty Hospital • Confidential Staff Portal
          </p>
        </div>
      </div>
    </div>
  );
};
