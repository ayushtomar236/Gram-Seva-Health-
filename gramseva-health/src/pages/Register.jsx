import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HeartPulse, ArrowRight, Mail, Lock, User, Stethoscope,
    UserRound, ShieldCheck, Eye, EyeOff, CheckCircle2, ChevronRight, AlertTriangle
} from 'lucide-react';

export default function Register() {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [step, setStep] = useState(1); // 1 = role, 2 = details, 3 = OTP
    const [role, setRole] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [specialization, setSpecialization] = useState('General Physician');
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const specializations = [
        'General Physician', 'Pediatrician', 'Dermatologist',
        'Gynecologist', 'Orthopedic', 'ENT Specialist',
        'Cardiologist', 'Neurologist', 'Psychiatrist'
    ];

    const handleSignUp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate role is selected
        if (!role) {
            setError('Please select a role first.');
            setLoading(false);
            return;
        }

        console.log('📝 Signing up with role:', role, 'name:', fullName);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                        specialization: role === 'doctor' ? specialization : undefined
                    },
                    emailRedirectTo: window.location.origin
                }
            });

            if (signUpError) throw signUpError;

            // Check if user already exists
            if (data?.user?.identities?.length === 0) {
                setError('This email is already registered. Please login instead.');
                setLoading(false);
                return;
            }

            console.log('✅ User created:', data?.user?.id);

            // Try to auto-login immediately (works if Supabase has email confirm disabled)
            const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

            if (!loginError) {
                // Auto-login worked! Go directly to dashboard
                setSuccess('Account created! Redirecting...');
                setTimeout(() => navigate(role === 'doctor' ? '/doctor-dashboard' : '/dashboard'), 500);
            } else {
                // Email confirmation required — show OTP step
                setSuccess('Account created! Enter OTP from email, or skip below.');
                setStep(3);
            }
        } catch (err) {
            if (err.message?.includes('rate') || err.message?.includes('limit')) {
                setError('Email limit exceeded. Use "Skip to Dashboard" button below instead.');
                setStep(3);
            } else {
                setError(err.message);
            }
        }
        setLoading(false);
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup'
            });

            if (verifyError) throw verifyError;

            // Successfully verified — redirect based on role
            navigate(role === 'doctor' ? '/doctor-dashboard' : '/dashboard');
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        }
        setLoading(false);
    };

    const handleSkipOTP = async () => {
        // For hackathon: try direct login if OTP email not received
        setLoading(true);
        setError('');
        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) throw loginError;
            navigate(role === 'doctor' ? '/doctor-dashboard' : '/dashboard');
        } catch (err) {
            // If login fails, maybe Supabase auto-confirms. Try going directly.
            setError('Account not yet verified. Check email for OTP, or try clicking "Skip to Dashboard" below.');
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-600/20">
                            <HeartPulse className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-black text-xl text-gray-900 tracking-tight">GramSeva Health</span>
                    </Link>
                    <h1 className="text-2xl font-black text-gray-900">
                        {step === 1 ? 'Choose Your Role' : step === 2 ? 'Create Account' : 'Verify OTP'}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        {step === 1 ? 'Select how you want to use GramSeva' : step === 2 ? `Registering as ${role === 'doctor' ? '🩺 Doctor' : '🧑 Patient'}` : 'Enter the 6-digit code sent to your email'}
                    </p>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-2 max-w-xs mx-auto mb-8">
                    {[1, 2, 3].map(s => (
                        <div key={s} className="flex-1 flex items-center gap-2">
                            <div className={`flex-1 h-1.5 rounded-full transition-all ${s <= step ? 'bg-teal-500' : 'bg-gray-200'}`} />
                        </div>
                    ))}
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${role === 'doctor' ? 'from-blue-500 to-indigo-500' : 'from-teal-500 to-cyan-500'}`} />

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm font-medium border border-red-100 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
                        </motion.div>
                    )}
                    {success && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-green-50 text-green-600 px-4 py-3 rounded-2xl mb-4 text-sm font-medium border border-green-100 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
                        </motion.div>
                    )}

                    <AnimatePresence mode="wait">
                        {/* ── STEP 1: Role Selection ── */}
                        {step === 1 && (
                            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="space-y-4">
                                    <button onClick={() => { setRole('patient'); setStep(2); }}
                                        className="w-full p-6 rounded-2xl border-2 border-gray-100 hover:border-teal-300 hover:bg-teal-50/50 transition-all text-left group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center group-hover:bg-teal-100 transition">
                                                <UserRound className="w-7 h-7 text-teal-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-gray-900 text-lg">I am a Patient</h3>
                                                <p className="text-sm text-gray-500">Find doctors, get AI health analysis, video consult</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-teal-500 transition" />
                                        </div>
                                    </button>

                                    <button onClick={() => { setRole('doctor'); setStep(2); }}
                                        className="w-full p-6 rounded-2xl border-2 border-gray-100 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition">
                                                <Stethoscope className="w-7 h-7 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-black text-gray-900 text-lg">I am a Doctor</h3>
                                                <p className="text-sm text-gray-500">Receive consultations, go online, help patients</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition" />
                                        </div>
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* ── STEP 2: Details Form ── */}
                        {step === 2 && (
                            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="flex items-center gap-2 mb-6">
                                    <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600 text-sm font-medium">← Back</button>
                                    <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${role === 'doctor' ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-teal-50 text-teal-600 border border-teal-200'}`}>
                                        {role === 'doctor' ? '🩺 Doctor' : '🧑 Patient'}
                                    </span>
                                </div>

                                <form onSubmit={handleSignUp} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                                                placeholder={role === 'doctor' ? 'Dr. Rajesh Kumar' : 'Ayush Singh'}
                                                required className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                                placeholder="your@email.com"
                                                required className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium" />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                                placeholder="Min 6 characters" minLength={6}
                                                required className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    {role === 'doctor' && (
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Specialization</label>
                                            <select value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                                                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium bg-white">
                                                {specializations.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <button type="submit" disabled={loading}
                                        className={`w-full py-3.5 ${role === 'doctor' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'} text-white font-black rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg active:scale-[0.98]`}>
                                        {loading ? (
                                            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</>
                                        ) : (
                                            <>Sign Up as {role === 'doctor' ? 'Doctor' : 'Patient'} <ArrowRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* ── STEP 3: OTP Verification ── */}
                        {step === 3 && (
                            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mail className="w-8 h-8 text-teal-600" />
                                    </div>
                                    <p className="text-sm text-gray-500">OTP sent to <strong className="text-gray-700">{email}</strong></p>
                                    <p className="text-xs text-gray-400 mt-1">Registered as: <strong className={role === 'doctor' ? 'text-blue-600' : 'text-teal-600'}>{role === 'doctor' ? '🩺 Doctor' : '🧑 Patient'}</strong></p>
                                </div>

                                <form onSubmit={handleVerifyOTP} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Enter 6-digit OTP</label>
                                        <input type="text" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            placeholder="000000" maxLength={6}
                                            className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none text-center text-2xl font-black tracking-[0.5em] text-gray-900" />
                                    </div>

                                    <button type="submit" disabled={loading || otp.length < 6}
                                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-teal-600/20">
                                        {loading ? 'Verifying...' : 'Verify & Continue'}
                                    </button>
                                </form>

                                <div className="mt-4 space-y-2">
                                    <button onClick={handleSkipOTP} disabled={loading}
                                        className="w-full text-sm text-teal-600 font-bold hover:underline py-2 disabled:opacity-50">
                                        Already verified? Sign in directly →
                                    </button>

                                    {/* Skip to dashboard directly */}
                                    <div className="border-t border-gray-100 pt-3">
                                        <p className="text-[10px] text-gray-400 font-bold text-center mb-2 uppercase">or skip for demo</p>
                                        <button onClick={() => navigate(role === 'doctor' ? '/doctor-dashboard' : '/dashboard')}
                                            className={`w-full py-2.5 ${role === 'doctor' ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' : 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100'} border rounded-xl text-xs font-black transition active:scale-95`}>
                                            Skip → Go to {role === 'doctor' ? 'Doctor' : 'Patient'} Dashboard
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Already have an account? <Link to="/login" className="text-teal-600 font-bold hover:underline">Login</Link>
                    </p>
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-6 mt-6 text-[10px] text-gray-400 font-bold">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> ENCRYPTED</span>
                    <span>•</span>
                    <span>GOVT. APPROVED</span>
                    <span>•</span>
                    <span>100% FREE</span>
                </div>
            </div>
        </div>
    );
}
