import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analyzeSymptoms, checkServerHealth } from '../services/aiTriage';
import { useLanguage } from '../services/LanguageContext';
import { useSpeechToText, useTextToSpeech } from '../hooks/useSpeech';
import {
    Stethoscope, FileText, AlertTriangle, LogOut, HeartPulse,
    History, BrainCircuit, Sparkles, Loader2, ChevronRight,
    Wifi, WifiOff, ShieldAlert, ShieldCheck, Phone, Pill, Building2,
    Droplets, Salad, Sun, Moon, Shield, Users, Newspaper,
    Languages, Video, Mic, MicOff, Volume2, VolumeX,
    Calculator, Activity, Footprints, GlassWater, BedDouble,
    Plus, X, Clock, Flame, Heart, Thermometer,
    AlertCircle, ChevronDown, ChevronUp, Droplet, Zap, Camera,
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DiabetesAssessment from '../components/DiabetesAssessment';

/* ── Static Tailwind color maps (JIT can't resolve dynamic `bg-${color}-50`) ── */
const COLOR_CLASSES = {
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-600',    border: 'border-teal-300',  shadow: 'hover:shadow-teal-100' },
    rose:    { bg: 'bg-rose-50',    text: 'text-rose-600',    border: 'border-rose-300',  shadow: 'hover:shadow-rose-100' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-600',    border: 'border-blue-300',  shadow: 'hover:shadow-blue-100' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-600',  border: 'border-orange-300',shadow: 'hover:shadow-orange-100' },
    cyan:    { bg: 'bg-cyan-50',    text: 'text-cyan-600',    border: 'border-cyan-300',  shadow: 'hover:shadow-cyan-100' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-600',  border: 'border-indigo-300',shadow: 'hover:shadow-indigo-100' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-600',  border: 'border-purple-300',shadow: 'hover:shadow-purple-100' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-300',shadow: 'hover:shadow-emerald-100' },
    red:     { bg: 'bg-red-50',     text: 'text-red-600',     border: 'border-red-300',   shadow: 'hover:shadow-red-100' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-600',    border: 'border-pink-300',  shadow: 'hover:shadow-pink-100' },
};

const HELPLINE_CLASSES = {
    red:    { bg: 'bg-red-50',    border: 'border-red-100',    textBig: 'text-red-700',    textSmall: 'text-red-500/70',  icon: 'text-red-600' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   textBig: 'text-blue-700',   textSmall: 'text-blue-500/70', icon: 'text-blue-600' },
    pink:   { bg: 'bg-pink-50',   border: 'border-pink-100',   textBig: 'text-pink-700',   textSmall: 'text-pink-500/70', icon: 'text-pink-600' },
    orange: { bg: 'bg-orange-50', border: 'border-orange-100', textBig: 'text-orange-700', textSmall: 'text-orange-500/70', icon: 'text-orange-600' },
};

/* ── Inline TrendChart (simple SVG sparkline) ── */
const TrendChart = ({ data = [], color = 'text-teal-500', max = 100, label = '' }) => {
    const width = 280, height = 80, pad = 10;
    const pts = data.length > 0 ? data : [0];
    const step = pts.length > 1 ? (width - pad * 2) / (pts.length - 1) : 0;
    const points = pts.map((v, i) => ({
        x: pad + i * step,
        y: height - pad - ((v / max) * (height - pad * 2)),
    }));
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    return (
        <div>
            <p className={`text-xs font-black uppercase tracking-widest mb-2 ${color}`}>{label}</p>
            <svg width={width} height={height} className="w-full overflow-visible">
                <path d={path} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className={color} />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="currentColor" className={color} />
                ))}
            </svg>
        </div>
    );
};

export default function PatientDashboard() {
    const navigate = useNavigate();
    const { lang, t, toggleLang } = useLanguage();

    // ── Core state ──────────────────────────────────────────────────────────
    const [patient, setPatient] = useState(null);
    const [history, setHistory] = useState([]);
    const [quickSymptoms, setQuickSymptoms] = useState('');
    const [quickResult, setQuickResult] = useState(null);
    const [quickLoading, setQuickLoading] = useState(false);
    const [serverOnline, setServerOnline] = useState(null);
    const [greeting, setGreeting] = useState('');

    // ── Voice ───────────────────────────────────────────────────────────────
    const { transcript, isListening, error: voiceError, startListening, stopListening }
        = useSpeechToText(lang);
    const { isSpeaking, speak, stopSpeaking } = useTextToSpeech(lang);

    useEffect(() => {
        if (transcript) setQuickSymptoms(transcript);
    }, [transcript]);

    // ── Health Tracking ─────────────────────────────────────────────────────
    const [waterCount, setWaterCount] = useState(() => {
        const saved = localStorage.getItem('gramseva-water-' + new Date().toDateString());
        return saved ? parseInt(saved, 10) : 0;
    });
    const [sleepHours, setSleepHours] = useState(() => {
        const saved = localStorage.getItem('gramseva-sleep-' + new Date().toDateString());
        return saved ? parseInt(saved, 10) : 0;
    });

    // ── Vitals (Manual/Simulated) ───────────────────────────────────────────
    const [vitals, setVitals] = useState(() => {
        try {
            const saved = localStorage.getItem('gramseva-vitals');
            return saved ? JSON.parse(saved) : { heartRate: 72, bpSys: 120, bpDia: 80, spo2: 98 };
        } catch (e) {
            return { heartRate: 72, bpSys: 120, bpDia: 80, spo2: 98 };
        }
    });

    useEffect(() => {
        localStorage.setItem('gramseva-water-' + new Date().toDateString(), waterCount.toString());
    }, [waterCount]);
    useEffect(() => {
        localStorage.setItem('gramseva-sleep-' + new Date().toDateString(), sleepHours.toString());
    }, [sleepHours]);
    useEffect(() => {
        localStorage.setItem('gramseva-vitals', JSON.stringify(vitals));
    }, [vitals]);

    // ── Health Score Logic ──────────────────────────────────────────────────
    const [healthScore, setHealthScore] = useState(0);
    useEffect(() => {
        let score = 0;
        // Water goal: 8 glasses (max 30 points)
        score += Math.min(30, (waterCount / 8) * 30);
        // Sleep goal: 8 hours (max 30 points)
        score += Math.min(30, (sleepHours / 8) * 30);
        // Vitals (normal ranges check) (max 40 points)
        let vitalsPass = 0;
        if (vitals.heartRate >= 60 && vitals.heartRate <= 100) vitalsPass += 10;
        if (vitals.bpSys >= 90 && vitals.bpSys <= 130) vitalsPass += 10;
        if (vitals.bpDia >= 60 && vitals.bpDia <= 90) vitalsPass += 10;
        if (vitals.spo2 >= 95) vitalsPass += 10;
        score += vitalsPass;
        setHealthScore(Math.round(score));
    }, [waterCount, sleepHours, vitals]);

    // ── Reminders ───────────────────────────────────────────────────────────
    const [reminders, setReminders] = useState(() => {
        try {
            const saved = localStorage.getItem('gramseva-reminders');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    });
    const [showAddReminder, setShowAddReminder] = useState(false);
    const [newReminder, setNewReminder] = useState({ name: '', time: '08:00' });

    const addReminder = () => {
        if (!newReminder.name.trim()) return;
        setReminders(prev => [...prev, { ...newReminder, id: Date.now() }]);
        setNewReminder({ name: '', time: '08:00' });
        setShowAddReminder(false);
    };

    // ── Mood & Insights ──────────────────────────────────────────────────────
    const [mood, setMood] = useState(() => {
        const saved = localStorage.getItem('gramseva-mood-' + new Date().toDateString());
        return saved || null;
    });

    useEffect(() => {
        if (mood) localStorage.setItem('gramseva-mood-' + new Date().toDateString(), mood);
    }, [mood]);

    const getHealthInsights = () => {
        const ins = [];
        if (waterCount < 5) ins.push({ text: t('drinkMoreWater') || 'Drink more water for better energy.', icon: Droplets, color: 'text-cyan-600' });
        if (sleepHours < 6) ins.push({ text: t('getMoreSleep') || 'Try to sleep at least 7-8 hours.', icon: Moon, color: 'text-indigo-600' });
        if (vitals.bpSys > 135) ins.push({ text: t('highBpAdvice') || 'Your BP is slightly high. Please rest and avoid salt.', icon: AlertCircle, color: 'text-red-600' });
        if (healthScore > 80) ins.push({ text: t('greatJob') || 'Great job! Your health habits are excellent today.', icon: Sparkles, color: 'text-amber-600' });
        return ins;
    };

    const insights = getHealthInsights();

    // ── Init & Auth ─────────────────────────────────────────────────────────
    useEffect(() => {
        loadData();
        checkServerHealth().then(h => setServerOnline(!!h?.status));
        const hour = new Date().getHours();
        if (hour < 12) setGreeting(t('goodMorning'));
        else if (hour < 17) setGreeting(t('goodAfternoon'));
        else setGreeting(t('goodEvening'));
    }, [lang]);

    const loadData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: p } = await supabase.from('patients').select('*').eq('user_id', user.id).single();
        setPatient(p);
        if (p) {
            const { data: h } = await supabase.from('consultations').select('*, doctors(name, specialization)')
                .eq('patient_id', p.id).order('created_at', { ascending: false }).limit(5);
            setHistory(h || []);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    // ── Health ID Card ──────────────────────────────────────────────────────
    const [showHealthID, setShowHealthID] = useState(false);
    const healthID = patient?.id ? `GS-${patient.id.slice(0, 8).toUpperCase()}` : 'GS-PENDING';

    const handleQuickTriage = async () => {
        if (!quickSymptoms.trim()) return;
        setQuickLoading(true);
        setQuickResult(null);
        try {
            const r = await analyzeSymptoms(quickSymptoms);
            setQuickResult(r);
        } catch (err) {
            setQuickResult({ error: err.message });
        }
        setQuickLoading(false);
    };

    // ── Analytics Data (Simulated for Trends) ──────────────────────────────
    const [showAnalytics, setShowAnalytics] = useState(false);
    const vitalsHistory = [72, 75, 71, 78, 74, 72, vitals.heartRate];
    const waterHistory = [6, 8, 5, 9, 7, 8, waterCount];
    const sleepHistory = [7, 6, 8, 7, 6, 7, sleepHours];

    const speakDiagnosis = () => {
        if (!quickResult || quickResult.error) return;
        const text = lang === 'hi'
            ? `AI की जांच कहती है कि आपको ${quickResult.disease} होने की संभावना है। सलाह: ${quickResult.medical_info?.immediate_advice}`
            : `AI analysis predicts ${quickResult.disease}. Advice: ${quickResult.medical_info?.immediate_advice}`;
        speak(text);
    };

    const tipIcons = [Droplets, Salad, Sun, Moon, Shield];
    const tips = t('tips');
    const [tipIndex, setTipIndex] = useState(0);
    useEffect(() => {
        const timer = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 6000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ═══ NAVIGATION ═══ */}
            <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-100">
                        <HeartPulse className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    <div>
                        <h1 className="font-black text-gray-900 text-sm md:text-lg tracking-tight">{t('appName')}</h1>
                        <p className="text-[10px] md:text-xs font-bold text-teal-600 uppercase tracking-widest">{t('patientDashboard')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowHealthID(true)}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-full transition border border-teal-100"
                        >
                            <ShieldCheck className="w-3.5 h-3.5" /> {t('viewHealthID') || 'Digital ID'}
                        </button>
                        <button onClick={toggleLang}
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-black bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full transition border border-purple-100">
                            <Languages className="w-3.5 h-3.5" />
                            {t('switchLang')}
                        </button>
                        <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-red-500 transition">
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ═══ LEFT COLUMN: GREETING & SCORE ═══ */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Welcome Card */}
                        <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-teal-100">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <p className="text-teal-100 font-bold uppercase tracking-widest text-xs mb-1">{greeting} 🙏</p>
                                    <h2 className="text-3xl font-black mb-2">{t('namaste')}, {patient?.name || 'User'}!</h2>
                                    <p className="text-teal-50/80 text-sm font-medium leading-relaxed max-w-xs">{t('howAreYou')}</p>
                                </div>
                                {/* Health Score Circle */}
                                <div className="flex flex-col items-center">
                                    <div className="relative w-32 h-32 flex items-center justify-center">
                                        <svg className="w-full h-full -rotate-90">
                                            <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="10" />
                                            <circle cx="64" cy="64" r="54" fill="none" stroke="white" strokeWidth="10"
                                                strokeDasharray={2 * Math.PI * 54}
                                                strokeDashoffset={2 * Math.PI * 54 * (1 - healthScore / 100)}
                                                strokeLinecap="round" className="transition-all duration-1000" />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-black">{healthScore}</span>
                                            <span className="text-[10px] font-black uppercase tracking-tighter text-teal-100">Score</span>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest mt-2 text-teal-200">{t('healthScore')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Mood & Insights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mood Tracker */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('howDoYouFeel') || 'How are you feeling?'}</p>
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                                    {[
                                        { emoji: '😊', label: 'happy', color: 'bg-green-100' },
                                        { emoji: '😐', label: 'neutral', color: 'bg-yellow-100' },
                                        { emoji: '😔', label: 'sad', color: 'bg-blue-100' },
                                        { emoji: '🤒', label: 'sick', color: 'bg-red-100' },
                                        { emoji: '😴', label: 'tired', color: 'bg-indigo-100' }
                                    ].map((m) => (
                                        <button
                                            key={m.label}
                                            onClick={() => setMood(m.emoji)}
                                            className={`text-2xl p-2 rounded-xl transition-all duration-300 ${mood === m.emoji ? `${m.color} scale-125 shadow-md ring-2 ring-white` : 'grayscale opacity-50 hover:grayscale-0 hover:opacity-100'}`}
                                        >
                                            {m.emoji}
                                        </button>
                                    ))}
                                </div>
                                {mood && (
                                    <p className="text-[10px] font-black text-teal-600 mt-3 text-center uppercase tracking-widest animate-in fade-in zoom-in duration-300">
                                        {t('moodLogged') || 'Mood recorded for today!'}
                                    </p>
                                )}
                            </div>

                            {/* Health Insights */}
                            <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden relative">
                                <Sparkles className="absolute -right-4 -top-4 w-20 h-20 text-amber-500/10 rotate-12" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">{t('dailyInsights') || 'Daily Health Insights'}</p>
                                <div className="space-y-3">
                                    {insights.length > 0 ? insights.slice(0, 2).map((ins, i) => (
                                        <div key={i} className="flex gap-3 items-start animate-in slide-in-from-left duration-500" style={{ delay: `${i * 100}ms` }}>
                                            <div className="mt-0.5 p-1 bg-gray-50 rounded-lg">
                                                <ins.icon className={`w-3.5 h-3.5 ${ins.color}`} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-600 leading-tight">{ins.text}</p>
                                        </div>
                                    )) : (
                                        <p className="text-xs font-bold text-gray-400 italic">{t('noInsightsYet') || 'Start tracking activity for daily tips.'}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Quick AI Check */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-50 rounded-2xl flex items-center justify-center">
                                        <BrainCircuit className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-black text-gray-900 leading-tight uppercase tracking-tight">{t('quickAiCheck')}</p>
                                        <p className="text-xs text-gray-400 font-bold">{t('tellSymptoms')}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${serverOnline ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {serverOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                                    {serverOnline ? 'AI Live' : 'Offline'}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input type="text" value={quickSymptoms} onChange={(e) => setQuickSymptoms(e.target.value)}
                                        placeholder={t('symptomPlaceholder')}
                                        className="w-full pl-4 pr-12 py-4 border border-gray-100 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-teal-50 outline-none transition-all" />
                                    <button onClick={isListening ? stopListening : startListening}
                                        className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-teal-600'}`}>
                                        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                                    </button>
                                </div>
                                <button onClick={handleQuickTriage} disabled={!quickSymptoms.trim() || quickLoading}
                                    className="px-6 py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-100 transition-all disabled:opacity-50 flex items-center gap-2">
                                    {quickLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
                                    <span className="hidden md:inline">{(t('check') || 'Check').toString().toUpperCase()}</span>
                                </button>
                            </div>

                            {/* Result Display */}
                            {quickResult && !quickResult.error && (
                                <div className="mt-5 p-5 bg-gray-50 rounded-2xl border border-gray-100 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{t('prediction')}</p>
                                            <h3 className="text-2xl font-black text-teal-700">{quickResult.disease}</h3>
                                        </div>
                                        <button onClick={isSpeaking ? stopSpeaking : speakDiagnosis}
                                            className={`p-3 rounded-2xl transition shadow-sm border ${isSpeaking ? 'bg-purple-600 text-white animate-pulse' : 'bg-white text-gray-500 hover:text-purple-600'}`}>
                                            {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-xs font-bold text-gray-500">{(quickResult.confidence * 100).toFixed(0)}% Confidence</span>
                                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal-500 rounded-full" style={{ width: `${quickResult.confidence * 100}%` }} />
                                        </div>
                                        <span className="bg-white px-2.5 py-1 rounded-lg text-[10px] font-black border border-gray-100 uppercase tracking-tighter text-teal-600">{quickResult.specialist}</span>
                                    </div>
                                    <button onClick={() => navigate('/symptoms', { state: { prefill: quickSymptoms } })}
                                        className="w-full py-3 bg-white hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-100 transition-all flex items-center justify-center gap-2">
                                        {t('viewFullReport')} <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Services Grid */}
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-2">{t('services')}</p>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { icon: Stethoscope, title: t('aiAnalysis'), desc: t('aiAnalysisDesc'), to: '/symptoms', color: 'teal' },
                                    { icon: Camera, title: 'Skin Scan', desc: 'AI skin disease detection', to: '/skin-scan', color: 'rose' },
                                    { icon: Users, title: t('findDoctors'), desc: t('findDoctorsDesc'), to: '/doctors', color: 'blue' },
                                    { icon: Newspaper, title: t('healthNews'), desc: t('healthNewsDesc'), to: '/health-news', color: 'orange' },
                                    { icon: Building2, title: t('hospitals'), desc: t('hospitalsDesc'), to: '/hospitals', color: 'cyan' },
                                    { icon: BookOpen, title: t('healthLibrary') || 'Health Library', desc: t('healthLibDesc') || 'First aid & health tips', to: '/health-library', color: 'indigo' },
                                    { icon: FileText, title: t('records'), desc: t('recordsDesc'), scroll: 'history-section', color: 'purple' },
                                    { icon: Pill, title: t('medicines'), desc: t('medicinesDesc'), to: '/symptoms', color: 'emerald' },
                                    { icon: AlertTriangle, title: t('sos'), desc: t('sosDesc'), click: 'sos', color: 'red' },
                                ].map((s, i) => {
                                    const Icon = s.icon;
                                    const Content = (
                                        <div className={`h-full bg-white border border-gray-100 rounded-3xl p-5 hover:shadow-2xl ${(COLOR_CLASSES[s.color] || COLOR_CLASSES.teal).shadow} hover:${(COLOR_CLASSES[s.color] || COLOR_CLASSES.teal).border} transition-all duration-300 group`}>
                                            <div className={`w-12 h-12 ${(COLOR_CLASSES[s.color] || COLOR_CLASSES.teal).bg} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                                <Icon className={`w-6 h-6 ${(COLOR_CLASSES[s.color] || COLOR_CLASSES.teal).text}`} />
                                            </div>
                                            <h3 className="font-bold text-gray-900 text-sm mb-1">{s.title}</h3>
                                            <p className="text-[10px] text-gray-400 font-bold leading-tight group-hover:text-gray-500">{s.desc}</p>
                                        </div>
                                    );
                                    if (s.to) return <Link key={i} to={s.to}>{Content}</Link>;
                                    if (s.scroll) return <button key={i} onClick={() => document.getElementById(s.scroll)?.scrollIntoView({ behavior: 'smooth' })} className="text-left w-full h-full">{Content}</button>;
                                    if (s.click === 'sos') return <button key={i} onClick={() => { if (confirm((t('sos') || 'SOS').toString().toUpperCase() + '?')) window.open('tel:108'); }} className="text-left w-full h-full">{Content}</button>;
                                    return <div key={i}>{Content}</div>;
                                })}
                            </div>
                        </div>

                        {/* ═══ CONSULTATION HISTORY SECTION ═══ */}
                        <div id="history-section" className="scroll-mt-24">
                            <div className="flex items-center justify-between mb-4 px-2">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('records') || 'Consultation History'}</p>
                                {history.length > 0 && (
                                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-widest">
                                        {history.length} {t('recordsFound') || 'Found'}
                                    </span>
                                )}
                            </div>

                            {history.length === 0 ? (
                                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center shadow-sm">
                                    <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <History className="w-8 h-8 text-purple-200" />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 mb-2">{t('noRecords') || 'No History Yet'}</h3>
                                    <p className="text-xs text-gray-400 font-bold max-w-xs mx-auto leading-relaxed">
                                        {t('noRecordsDesc') || 'Your consultation history and medical reports will appear here after your first appointment.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {history.map((record) => (
                                        <div key={record.id} className="bg-white rounded-3xl border border-gray-100 p-5 hover:shadow-xl hover:shadow-purple-100 hover:border-purple-200 transition-all duration-300 group">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                        <FileText className="w-6 h-6 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-gray-900 text-sm mb-1">
                                                            {record.doctors?.name || 'Doctor'}
                                                        </h4>
                                                        <p className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-2">
                                                            {record.doctors?.specialization || 'Consultation'}
                                                        </p>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                                                <Clock className="w-3.5 h-3.5" />
                                                                {new Date(record.created_at).toLocaleDateString('en-IN', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric'
                                                                })}
                                                            </div>
                                                            {record.diagnosis && (
                                                                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                                                                    <Sparkles className="w-3.5 h-3.5" />
                                                                    {record.diagnosis}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link to={`/prescription/${record.id}`}
                                                    className="p-3 bg-gray-50 text-gray-400 hover:bg-purple-600 hover:text-white rounded-2xl transition-all duration-300 shadow-sm border border-gray-100 hover:border-purple-600">
                                                    <ChevronRight className="w-5 h-5" />
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ═══ RIGHT COLUMN: VITALS & TRACKERS ═══ */}
                    <div className="space-y-6">
                        <DiabetesAssessment />

                        {/* Vitals Overview */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-teal-600" /> {t('vitalsTitle')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3.5 bg-red-50/50 rounded-2xl border border-red-50">
                                    <div className="flex items-center gap-3">
                                        <Heart className="w-5 h-5 text-red-500 fill-current animate-pulse" />
                                        <span className="text-xs font-bold text-gray-700">{t('heartRate')}</span>
                                    </div>
                                    <span className="text-sm font-black text-red-600">{vitals.heartRate} <span className="text-[10px]">{t('bpm')}</span></span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-2xl border border-blue-50">
                                    <div className="flex items-center gap-3">
                                        <Thermometer className="w-5 h-5 text-blue-500" />
                                        <span className="text-xs font-bold text-gray-700">{t('bloodPressure')}</span>
                                    </div>
                                    <span className="text-sm font-black text-blue-600">{vitals.bpSys}/{vitals.bpDia} <span className="text-[10px]">{t('mmhg')}</span></span>
                                </div>
                                <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 rounded-2xl border border-indigo-50">
                                    <div className="flex items-center gap-3">
                                        <Activity className="w-5 h-5 text-indigo-500" />
                                        <span className="text-xs font-bold text-gray-700">{t('spo2')}</span>
                                    </div>
                                    <span className="text-sm font-black text-indigo-600">{vitals.spo2}%</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAnalytics(true)}
                                className="w-full mt-4 py-3 bg-gray-50 hover:bg-teal-50 text-teal-700 font-bold text-xs rounded-2xl border border-teal-100 transition-all flex items-center justify-center gap-2"
                            >
                                <Activity className="w-4 h-4" /> {t('viewDetailedTrends') || 'View Detailed Trends'}
                            </button>
                        </div>

                        {/* Analytics Modal */}
                        <AnimatePresence>
                            {showAnalytics && (
                                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        onClick={() => setShowAnalytics(false)}
                                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                                    />
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                        className="relative w-full max-w-lg bg-white rounded-[3rem] shadow-2xl overflow-hidden"
                                    >
                                        <div className="p-8 space-y-8">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h3 className="text-2xl font-black text-gray-900">{t('healthAnalytics') || 'Health Trends'}</h3>
                                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{t('last7Days') || 'Last 7 Days Activity'}</p>
                                                </div>
                                                <button onClick={() => setShowAnalytics(false)} className="p-2 bg-gray-50 rounded-xl hover:bg-red-50 hover:text-red-500 transition">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
                                                <div className="p-5 bg-red-50/30 border border-red-100 rounded-3xl">
                                                    <TrendChart data={vitalsHistory} color="text-red-500" max={120} label={t('heartRate') || 'Heart Rate'} />
                                                </div>
                                                <div className="p-5 bg-cyan-50/30 border border-cyan-100 rounded-3xl">
                                                    <TrendChart data={waterHistory} color="text-cyan-500" max={12} label={t('waterGlasses') || 'Water Intake'} />
                                                </div>
                                                <div className="p-5 bg-indigo-50/30 border border-indigo-100 rounded-3xl">
                                                    <TrendChart data={sleepHistory} color="text-indigo-500" max={12} label={t('sleepHours') || 'Sleep Hours'} />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    alert('Health report shared with your registered doctor.');
                                                    setShowAnalytics(false);
                                                }}
                                                className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl shadow-lg shadow-teal-100 transition-all flex items-center justify-center gap-2"
                                            >
                                                <ShieldCheck className="w-5 h-5" /> {t('shareWithDoctor') || 'SHARE REPORT WITH DOCTOR'}
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>

                        {/* Tracker Widgets */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Water */}
                            <div className="bg-cyan-50 rounded-3xl p-5 border border-cyan-100 flex flex-col items-center">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-inner mb-3">
                                    <Droplets className="w-6 h-6 text-cyan-600 animate-bounce" />
                                </div>
                                <p className="text-2xl font-black text-cyan-700">{waterCount}</p>
                                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-tighter mb-4">{t('waterGlasses')}</p>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setWaterCount(Math.max(0, waterCount - 1))} className="w-8 h-8 bg-white text-cyan-600 rounded-full font-black border border-cyan-200 outline-none">-</button>
                                    <button onClick={() => setWaterCount(waterCount + 1)} className="w-8 h-8 bg-cyan-600 text-white rounded-full font-black shadow-lg shadow-cyan-200">+</button>
                                </div>
                            </div>
                            {/* Sleep */}
                            <div className="bg-indigo-50 rounded-3xl p-5 border border-indigo-100 flex flex-col items-center">
                                <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-inner mb-3">
                                    <Moon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <p className="text-2xl font-black text-indigo-700">{sleepHours}h</p>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter mb-4">{t('sleepHrs')}</p>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setSleepHours(Math.max(0, sleepHours - 1))} className="w-8 h-8 bg-white text-indigo-600 rounded-full font-black border border-indigo-200 outline-none">-</button>
                                    <button onClick={() => setSleepHours(Math.min(12, sleepHours + 1))} className="w-8 h-8 bg-indigo-600 text-white rounded-full font-black shadow-lg shadow-indigo-200">+</button>
                                </div>
                            </div>
                        </div>

                        {/* Medicine Reminders Widget */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm overflow-hidden relative">
                            <div className="bg-orange-50 absolute -right-6 -top-6 w-20 h-20 rounded-full" />
                            <div className="relative z-10">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('medReminders')}</h3>
                                {reminders.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-3">No Meds Added</p>
                                        <button onClick={() => setShowAddReminder(true)} className="px-4 py-2 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full border border-orange-100">ADD NOW</button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 mb-4">
                                        {reminders.map(r => (
                                            <div key={r.id} className="flex items-center justify-between bg-orange-50/50 p-2.5 rounded-xl border border-orange-50">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-orange-500" />
                                                    <span className="text-xs font-bold text-gray-700">{r.name}</span>
                                                </div>
                                                <span className="text-[10px] font-black text-orange-600">{r.time}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <button onClick={() => setShowAddReminder(!showAddReminder)} className="w-full py-2.5 bg-gray-50 hover:bg-orange-50 text-gray-400 hover:text-orange-600 rounded-xl text-[10px] font-black transition uppercase tracking-widest">
                                    {showAddReminder ? 'CANCEL' : 'MANAGE REMINDERS'}
                                </button>
                                {showAddReminder && (
                                    <div className="mt-4 space-y-2 pt-4 border-t border-gray-100 animate-in slide-in-from-top-2 duration-200">
                                        <input type="text" value={newReminder.name} onChange={e => setNewReminder(p => ({ ...p, name: e.target.value }))}
                                            placeholder="Med Name..." className="w-full p-2 border border-gray-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-100" />
                                        <div className="flex gap-2">
                                            <input type="time" value={newReminder.time} onChange={e => setNewReminder(p => ({ ...p, time: e.target.value }))}
                                                className="flex-1 p-2 border border-gray-100 rounded-lg text-xs outline-none" />
                                            <button onClick={addReminder} className="bg-orange-600 text-white px-4 rounded-lg text-xs font-black">+</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tip Banner */}
                        <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm overflow-hidden relative">
                            <div className="absolute right-0 bottom-0 p-2 opacity-5 scale-150"><Zap /></div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">{t('dailyHealthTip')}</p>
                            <p className="text-sm font-bold text-gray-600 leading-tight">{tips[tipIndex]}</p>
                        </div>
                    </div>
                </div>

                {/* ═══ HELPINE CLOUDS ═══ */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { n: t('ambulance'), num: '108', c: 'red' },
                        { n: t('healthHelpline'), num: '104', c: 'blue' },
                        { n: t('womenHelpline'), num: '181', c: 'pink' },
                        { n: t('childHelpline'), num: '1098', c: 'orange' },
                    ].map(h => (
                        <a key={h.num} href={`tel:${h.num}`} className={`${(HELPLINE_CLASSES[h.c] || HELPLINE_CLASSES.red).bg} h-20 rounded-3xl border ${(HELPLINE_CLASSES[h.c] || HELPLINE_CLASSES.red).border} p-4 flex items-center gap-4 group hover:shadow-lg transition-all`}>
                            <div className={`w-10 h-10 bg-white rounded-2xl flex items-center justify-center ${(HELPLINE_CLASSES[h.c] || HELPLINE_CLASSES.red).icon} group-hover:scale-110 transition`}><Phone className="w-5 h-5" /></div>
                            <div><p className={`text-sm font-black ${(HELPLINE_CLASSES[h.c] || HELPLINE_CLASSES.red).textBig}`}>{h.num}</p><p className={`text-[10px] font-bold ${(HELPLINE_CLASSES[h.c] || HELPLINE_CLASSES.red).textSmall} truncate w-20 uppercase tracking-tighter`}>{h.n}</p></div>
                        </a>
                    ))}
                </div>
            </main>

            {/* Bottom App-like Navigation Bar for Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 p-3 flex justify-around items-center md:hidden z-50">
                <Link to="/dashboard" className="flex flex-col items-center text-teal-600"><Activity className="w-6 h-6" /><span className="text-[10px] font-black mt-1">HOME</span></Link>
                <Link to="/symptoms" className="flex flex-col items-center text-gray-400 group"><BrainCircuit className="w-6 h-6 group-hover:text-purple-500" /><span className="text-[10px] font-black mt-1">AI JAANCH</span></Link>
                <Link to="/health-news" className="flex flex-col items-center text-gray-400 group"><Newspaper className="w-6 h-6 group-hover:text-orange-500" /><span className="text-[10px] font-black mt-1">NEWS</span></Link>
                <Link to="/hospitals" className="flex flex-col items-center text-gray-400 group"><Building2 className="w-6 h-6 group-hover:text-cyan-500" /><span className="text-[10px] font-black mt-1">HOSPITAL</span></Link>
            </div>
        </div>
    );
}
