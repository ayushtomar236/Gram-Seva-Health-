import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../services/LanguageContext';
import { motion } from 'framer-motion';
import {
    HeartPulse, ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck,
    Stethoscope, UserRound, Zap
} from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
            if (loginError) throw loginError;
            if (!data?.user) throw new Error('Login failed — no user returned. Please try again.');

            // Fetch the user's role from profiles table
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('user_id', data.user.id)
                .single();

            if (profile?.role === 'doctor') {
                navigate('/doctor-dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
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
                    <h1 className="text-2xl font-black text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-1 text-sm">Login to your account</p>
                </div>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-cyan-500" />

                    {error && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                            className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl mb-4 text-sm font-medium border border-red-100">
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com" required
                                    className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" required
                                    className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none text-sm font-medium" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading}
                            className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-lg shadow-teal-600/20 active:scale-[0.98]">
                            {loading ? (
                                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                            ) : (
                                <>Sign In <ArrowRight className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>

                    {/* Quick Access */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center mb-3">QUICK ACCESS (DEMO)</p>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 px-4 py-3 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-2xl transition active:scale-95 text-left">
                                <UserRound className="w-4 h-4 text-teal-600" />
                                <div>
                                    <p className="text-xs font-black text-teal-700">Patient</p>
                                    <p className="text-[9px] text-teal-500">Skip to Dashboard</p>
                                </div>
                            </button>
                            <button onClick={() => navigate('/doctor-dashboard')}
                                className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-2xl transition active:scale-95 text-left">
                                <Stethoscope className="w-4 h-4 text-blue-600" />
                                <div>
                                    <p className="text-xs font-black text-blue-700">Doctor</p>
                                    <p className="text-[9px] text-blue-500">Skip to Dashboard</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <p className="text-center text-sm text-gray-500 mt-5">
                        Don't have an account? <Link to="/register" className="text-teal-600 font-bold hover:underline">Register</Link>
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
