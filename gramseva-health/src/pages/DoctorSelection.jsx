import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../services/LanguageContext';
import { motion } from 'framer-motion';
import {
    ArrowLeft, Star, Video, Clock, MapPin, Search,
    ShieldCheck, Award, Phone, Sparkles, Activity, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';

const specialtyColors = {
    'General Physician': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    'Pediatrician': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'Dermatologist': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    'Gynecologist': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    'Orthopedic': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    'ENT Specialist': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
    'Cardiologist': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    'Neurologist': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
};

// Demo doctors — always available for hackathon demo
const demoDoctors = [
    {
        id: 'demo-doc-1',
        name: 'Rajesh Kumar',
        specialization: 'General Physician',
        rating: 4.8,
        experience_years: 12,
        is_online: true,
        is_verified: true,
        languages: 'Hindi, English',
        fee: '₹0 (Free)',
        _isDemo: true,
    },
    {
        id: 'demo-doc-2',
        name: 'Priya Sharma',
        specialization: 'Pediatrician',
        rating: 4.9,
        experience_years: 8,
        is_online: true,
        is_verified: true,
        languages: 'Hindi, English, Marathi',
        fee: '₹0 (Free)',
        _isDemo: true,
    },
];

export default function DoctorSelection() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { t } = useLanguage();
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(state?.specialist || '');

    useEffect(() => { loadDoctors(); }, []);

    // Auto-refresh every 5 seconds to see doctors going online
    useEffect(() => {
        const interval = setInterval(loadDoctors, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadDoctors = async () => {
        try {
            const { data, error } = await supabase
                .from('doctors')
                .select('*')
                .order('is_online', { ascending: false });

            if (!error && data) {
                setDoctors(data);
            }
        } catch {
            // Supabase unavailable — will show demo doctors only
        }
        setLoading(false);
    };

    const startConsultation = async (doctor) => {
        const channelName = `gs_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

        // Demo doctor — skip Supabase, go directly to video call
        if (doctor._isDemo) {
            navigate(`/video-call/${channelName}`);
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: patient } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                const consultationData = {
                    doctor_id: doctor.id,
                    channel_name: channelName,
                    symptoms: state?.symptoms || 'General consultation',
                    urgency: state?.urgency || 'low',
                    ai_suggestion: JSON.stringify({
                        disease: state?.disease || '',
                        specialist: state?.specialist || '',
                        vitals: state?.vitals || {},
                        mood: state?.mood || 'N/A'
                    }),
                    status: 'pending',
                };

                if (patient) {
                    consultationData.patient_id = patient.id;
                }

                const { error } = await supabase.from('consultations').insert(consultationData);
                if (error) {
                    console.error('Error creating consultation:', error);
                }
            }
        } catch (err) {
            console.error('Error:', err);
        }

        navigate(`/video-call/${channelName}`);
    };

    // Combine demo doctors + real doctors
    const allDoctors = [...demoDoctors, ...doctors];

    const filtered = allDoctors.filter(d =>
        d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization?.toLowerCase().includes(search.toLowerCase())
    );

    const onlineCount = filtered.filter(d => d.is_online).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
            {/* ─── Navbar ─── */}
            <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
                <Link to="/dashboard" className="p-2.5 bg-gray-50 hover:bg-gray-100 rounded-2xl transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="font-black text-gray-900 text-lg tracking-tight">{t('findDoctors') || 'Find Doctors'}</h1>
                    <p className="text-xs text-gray-400 font-medium">{onlineCount} {onlineCount === 1 ? 'doctor' : 'doctors'} online now</p>
                </div>
                <button onClick={loadDoctors} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400 hover:text-gray-600">
                    <RefreshCw className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-full">
                    <Activity className="w-3 h-3 text-green-600" />
                    <span className="text-[10px] font-black text-green-700 uppercase tracking-wider">Live</span>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto p-6">
                {/* ─── AI Recommendation Banner ─── */}
                {state?.specialist && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-3xl p-5 mb-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="flex items-center gap-3 relative">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">AI RECOMMENDATION</p>
                                <p className="font-bold text-sm">
                                    Specialist: <span className="text-white">{state.specialist}</span> • Urgency: <span className="uppercase font-black">{state.urgency}</span>
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ─── Search ─── */}
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or specialization..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none shadow-sm text-sm font-medium" />
                </div>

                {/* ─── Doctor Cards ─── */}
                {loading ? (
                    <div className="text-center py-20">
                        <Loader2 className="w-10 h-10 text-teal-500 animate-spin mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">Loading doctors...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filtered.map((d, i) => {
                            const colors = specialtyColors[d.specialization] || specialtyColors['General Physician'];
                            const isDemo = d._isDemo;
                            return (
                                <motion.div key={d.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                                    className={`bg-white rounded-3xl border ${isDemo ? 'border-amber-200 ring-2 ring-amber-100' : d.is_online ? 'border-gray-100 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-500/5' : 'border-gray-100 opacity-60'} p-6 transition-all duration-300 relative overflow-hidden`}>

                                    {/* Demo badge */}
                                    {isDemo && (
                                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-full">
                                            <Sparkles className="w-3 h-3 text-amber-500" />
                                            <span className="text-[9px] font-black text-amber-600 uppercase">DEMO</span>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4 flex-1">
                                            {/* Avatar */}
                                            <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center text-2xl font-black ${colors.text} relative shrink-0`}>
                                                {d.name?.charAt(0) || 'D'}
                                                {d.is_online && (
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3 className="font-black text-gray-900">Dr. {d.name}</h3>
                                                    {d.is_verified && (
                                                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 border border-blue-200 rounded-full">
                                                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                                                            <span className="text-[9px] font-black text-blue-600">VERIFIED</span>
                                                        </span>
                                                    )}
                                                    {d.is_online && (
                                                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-green-50 border border-green-200 rounded-full">
                                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                            <span className="text-[9px] font-black text-green-600">ONLINE</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`inline-block mt-1 px-2.5 py-0.5 ${colors.bg} ${colors.text} text-xs font-bold rounded-full border ${colors.border}`}>
                                                    {d.specialization || 'General Physician'}
                                                </span>
                                                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 flex-wrap">
                                                    <span className="flex items-center gap-1">
                                                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> <strong className="text-gray-700">{d.rating || '4.5'}</strong>
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" /> {d.experience_years || 0} yrs
                                                    </span>
                                                    {d.languages && (
                                                        <span className="text-gray-400">🗣 {d.languages}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {/* Action */}
                                        <div className="flex flex-col items-end gap-3 shrink-0">
                                            {d.fee && (
                                                <span className="text-xs font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">{d.fee}</span>
                                            )}
                                            <button onClick={() => startConsultation(d)} disabled={!d.is_online}
                                                className={`flex items-center gap-2 px-5 py-3 text-sm font-black rounded-2xl transition-all duration-300 active:scale-95 ${d.is_online
                                                    ? isDemo
                                                        ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-600/20'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>
                                                <Video className="w-4 h-4" />
                                                {d.is_online ? (isDemo ? 'Try Demo Call' : 'Consult Now') : 'Offline'}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}

                {/* ─── How It Works ─── */}
                <div className="mt-10 bg-white/50 border border-gray-100 rounded-3xl p-6">
                    <h3 className="font-black text-gray-900 text-sm mb-4 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-teal-600" /> How Video Consultation Works
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { step: '1', title: 'Select Doctor', desc: 'Choose an online doctor based on specialty', icon: '👨‍⚕️' },
                            { step: '2', title: 'Join Video Call', desc: 'Real-time video consultation via Jitsi Meet', icon: '📹' },
                            { step: '3', title: 'Get Prescription', desc: 'Doctor writes e-prescription after checkup', icon: '📋' },
                        ].map(s => (
                            <div key={s.step} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                                <span className="text-2xl">{s.icon}</span>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{s.title}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
