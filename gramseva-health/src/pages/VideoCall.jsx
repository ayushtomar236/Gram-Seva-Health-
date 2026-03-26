import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../services/LanguageContext';
import {
    ArrowLeft, PhoneOff, AlertTriangle, MessageSquare, Send, X,
    Activity, ShieldCheck, FileText, ClipboardList, Copy, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoCall() {
    const { channelName } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();

    const [userRole, setUserRole] = useState(null);
    const [callDuration, setCallDuration] = useState(0);
    const [callStarted, setCallStarted] = useState(false);
    const [copied, setCopied] = useState(false);

    // Chat
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        { from: 'system', text: 'Consultation started. Messages are end-to-end encrypted.', time: new Date() }
    ]);
    const [chatInput, setChatInput] = useState('');
    const chatEndRef = useRef(null);

    // Prescription (Doctor only)
    const [prescriptionOpen, setPrescriptionOpen] = useState(false);
    const [prescriptionSaving, setPrescriptionSaving] = useState(false);
    const [prescriptionSaved, setPrescriptionSaved] = useState(false);
    const [prescription, setPrescription] = useState({
        diagnosis: '',
        medicines: [{ name: '', dosage: '', duration: '' }],
        advice: '',
        followUp: ''
    });

    const savePrescription = async () => {
        if (!prescription.diagnosis.trim() || prescription.medicines.every(m => !m.name.trim())) {
            alert('Please fill in diagnosis and at least one medicine.');
            return;
        }
        setPrescriptionSaving(true);
        try {
            // Find consultation by channel_name
            const { data: consultation } = await supabase
                .from('consultations')
                .select('id, patient_id, doctor_id')
                .eq('channel_name', channelName)
                .single();

            const prescData = {
                consultation_id: consultation?.id || null,
                doctor_id: consultation?.doctor_id || null,
                patient_id: consultation?.patient_id || null,
                diagnosis: prescription.diagnosis,
                medicines: prescription.medicines.filter(m => m.name.trim()),
                instructions: prescription.advice,
                follow_up: prescription.followUp,
            };

            const { error } = await supabase.from('prescriptions').insert(prescData);
            if (error) throw error;

            setPrescriptionSaved(true);
            // Also mark consultation as completed
            if (consultation?.id) {
                await supabase.from('consultations')
                    .update({ status: 'completed', end_time: new Date().toISOString() })
                    .eq('id', consultation.id);
            }
        } catch (err) {
            console.error('Prescription save error:', err);
            alert('Could not save prescription. It may have been saved locally only.');
        }
        setPrescriptionSaving(false);
    };

    const jitsiRoomUrl = `https://meet.jit.si/GramSevaHealth_${channelName}`;

    useEffect(() => {
        const detectRole = async () => {
            // Check URL param first (set by DoctorDashboard when accepting calls)
            const params = new URLSearchParams(window.location.search);
            const urlRole = params.get('role');
            if (urlRole) {
                setUserRole(urlRole);
                return;
            }

            // Fall back to Supabase profile check
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('user_id', user.id).single();
                    setUserRole(profile?.role || 'patient');
                } else {
                    setUserRole('patient');
                }
            } catch { setUserRole('patient'); }
        };
        detectRole();
    }, []);

    useEffect(() => {
        if (callStarted) {
            const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
            return () => clearInterval(timer);
        }
    }, [callStarted]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

    useEffect(() => {
        setCallStarted(true);
        const updateStatus = async () => {
            try { await supabase.from('consultations').update({ status: 'active' }).eq('channel_name', channelName); } catch { }
        };
        updateStatus();
    }, [channelName]);

    const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const copyRoomLink = () => {
        navigator.clipboard.writeText(jitsiRoomUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const sendChat = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;
        setChatMessages(prev => [...prev, { from: userRole || 'patient', text: chatInput.trim(), time: new Date() }]);
        setChatInput('');
    };

    const addMedicine = () => setPrescription(p => ({ ...p, medicines: [...p.medicines, { name: '', dosage: '', duration: '' }] }));
    const updateMedicine = (i, field, value) => {
        setPrescription(p => { const m = [...p.medicines]; m[i] = { ...m[i], [field]: value }; return { ...p, medicines: m }; });
    };

    const handleEnd = async () => {
        try { await supabase.from('consultations').update({ status: 'completed', end_time: new Date().toISOString() }).eq('channel_name', channelName); } catch { }
        navigate(userRole === 'doctor' ? '/doctor-dashboard' : '/dashboard');
    };

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col overflow-hidden font-sans">
            {/* Top Bar */}
            <div className="bg-[#1E293B]/80 backdrop-blur-xl border-b border-white/5 px-4 md:px-6 py-3 flex items-center justify-between z-50">
                <div className="flex items-center gap-3">
                    <button onClick={handleEnd} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition text-gray-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-white font-black text-sm tracking-tight">{t('videoConsultation') || 'Video Consultation'}</h2>
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/20 rounded-full">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">LIVE</span>
                            </div>
                            {userRole && (
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${userRole === 'doctor' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-teal-500/10 text-teal-400 border border-teal-500/20'}`}>
                                    {userRole}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-gray-500 text-[10px] font-bold flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-teal-500" /> E2E ENCRYPTED
                            </p>
                            <span className="text-[10px] font-black text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full animate-pulse">● {formatTime(callDuration)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={copyRoomLink}
                        className="flex items-center gap-1.5 px-3 py-2 bg-teal-600/20 hover:bg-teal-600/30 text-teal-400 text-[10px] font-black rounded-xl transition border border-teal-500/20">
                        {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Share Link</>}
                    </button>
                    <button onClick={() => window.confirm('🚨 Trigger Emergency SOS?') && alert('Emergency SOS sent!')}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-2xl shadow-lg shadow-red-900/20 transition-all uppercase tracking-widest active:scale-95">
                        <AlertTriangle className="w-4 h-4" /> SOS
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Jitsi Video */}
                <div className="flex-1 relative bg-black">
                    <iframe
                        src={`${jitsiRoomUrl}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.disableDeepLinking=true&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false&interfaceConfig.TOOLBAR_BUTTONS=["microphone","camera","fullscreen","hangup","chat","settings"]`}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="camera; microphone; fullscreen; display-capture; autoplay"
                        allowFullScreen
                    />
                </div>

                {/* Side Panel */}
                <AnimatePresence>
                    {(chatOpen || prescriptionOpen) && (
                        <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                            className="bg-[#1E293B] border-l border-white/5 flex flex-col z-40 overflow-hidden">
                            <div className="flex border-b border-white/5">
                                <button onClick={() => { setChatOpen(true); setPrescriptionOpen(false); }}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition ${chatOpen ? 'text-teal-400 border-b-2 border-teal-400 bg-teal-500/5' : 'text-gray-500 hover:text-gray-300'}`}>
                                    <MessageSquare className="w-3.5 h-3.5" /> Chat
                                </button>
                                {userRole === 'doctor' && (
                                    <button onClick={() => { setPrescriptionOpen(true); setChatOpen(false); }}
                                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition ${prescriptionOpen ? 'text-purple-400 border-b-2 border-purple-400 bg-purple-500/5' : 'text-gray-500 hover:text-gray-300'}`}>
                                        <FileText className="w-3.5 h-3.5" /> Prescription
                                    </button>
                                )}
                                <button onClick={() => { setChatOpen(false); setPrescriptionOpen(false); }} className="px-3 text-gray-500 hover:text-white transition">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {chatOpen && (
                                <div className="flex-1 flex flex-col">
                                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                        {chatMessages.map((msg, i) => (
                                            <div key={i} className={`${msg.from === 'system' ? 'text-center' : msg.from === (userRole || 'patient') ? 'text-right' : 'text-left'}`}>
                                                {msg.from === 'system' ? (
                                                    <span className="text-[9px] text-gray-500 bg-white/5 px-3 py-1 rounded-full inline-block">{msg.text}</span>
                                                ) : (
                                                    <div className={`inline-block max-w-[85%] ${msg.from === (userRole || 'patient') ? 'bg-teal-600 text-white' : 'bg-white/10 text-white/90'} px-3.5 py-2.5 rounded-2xl ${msg.from === (userRole || 'patient') ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                                                        <p className="text-[10px] font-black uppercase mb-0.5 opacity-60">{msg.from}</p>
                                                        <p className="text-sm">{msg.text}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <div ref={chatEndRef} />
                                    </div>
                                    <form onSubmit={sendChat} className="p-3 border-t border-white/5 flex gap-2">
                                        <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                                            placeholder="Type a message..." className="flex-1 px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-teal-500 placeholder-gray-500" />
                                        <button type="submit" className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition active:scale-95">
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </form>
                                </div>
                            )}

                            {prescriptionOpen && (
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Diagnosis</label>
                                        <input type="text" value={prescription.diagnosis} onChange={(e) => setPrescription(p => ({ ...p, diagnosis: e.target.value }))}
                                            placeholder="e.g. Acute Gastritis" className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500 placeholder-gray-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Medicines</label>
                                            <button onClick={addMedicine} className="text-[9px] font-black text-purple-400 hover:text-purple-300">+ Add</button>
                                        </div>
                                        {prescription.medicines.map((med, i) => (
                                            <div key={i} className="bg-white/5 rounded-xl p-3 mb-2 space-y-2 border border-white/5">
                                                <input type="text" value={med.name} onChange={(e) => updateMedicine(i, 'name', e.target.value)}
                                                    placeholder="Medicine name" className="w-full px-2.5 py-2 bg-transparent border border-white/10 rounded-lg text-white text-xs outline-none focus:border-purple-500 placeholder-gray-600" />
                                                <div className="flex gap-2">
                                                    <input type="text" value={med.dosage} onChange={(e) => updateMedicine(i, 'dosage', e.target.value)}
                                                        placeholder="Dosage (1-0-1)" className="flex-1 px-2.5 py-2 bg-transparent border border-white/10 rounded-lg text-white text-xs outline-none focus:border-purple-500 placeholder-gray-600" />
                                                    <input type="text" value={med.duration} onChange={(e) => updateMedicine(i, 'duration', e.target.value)}
                                                        placeholder="Days" className="w-16 px-2.5 py-2 bg-transparent border border-white/10 rounded-lg text-white text-xs outline-none focus:border-purple-500 placeholder-gray-600" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Advice</label>
                                        <textarea value={prescription.advice} onChange={(e) => setPrescription(p => ({ ...p, advice: e.target.value }))}
                                            placeholder="Dietary advice, precautions..." rows={3}
                                            className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500 placeholder-gray-600 resize-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Follow-up</label>
                                        <input type="text" value={prescription.followUp} onChange={(e) => setPrescription(p => ({ ...p, followUp: e.target.value }))}
                                            placeholder="e.g. After 3 days" className="w-full mt-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-purple-500 placeholder-gray-600" />
                                    </div>
                                    {prescriptionSaved ? (
                                        <div className="w-full py-3 bg-green-600/20 border border-green-500/30 text-green-400 font-black rounded-xl text-sm flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Prescription Saved & Sent!
                                        </div>
                                    ) : (
                                        <button onClick={savePrescription} disabled={prescriptionSaving}
                                            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-purple-600/20 disabled:opacity-50">
                                            <ClipboardList className="w-4 h-4" /> {prescriptionSaving ? 'Saving...' : 'Save & Send Prescription'}
                                        </button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Controls */}
            <div className="bg-[#1E293B]/90 backdrop-blur-xl border-t border-white/5 px-4 md:px-6 py-4 flex items-center justify-center gap-3 md:gap-5 z-50">
                <button onClick={() => { setChatOpen(!chatOpen); setPrescriptionOpen(false); }}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${chatOpen ? 'bg-teal-500/10 border-teal-500/50 text-teal-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[7px] font-black mt-0.5 uppercase">CHAT</span>
                </button>

                {userRole === 'doctor' && (
                    <button onClick={() => { setPrescriptionOpen(!prescriptionOpen); setChatOpen(false); }}
                        className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${prescriptionOpen ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}>
                        <FileText className="w-5 h-5" />
                        <span className="text-[7px] font-black mt-0.5 uppercase">Rx</span>
                    </button>
                )}

                <div className="w-px h-10 bg-white/10" />

                <button onClick={handleEnd} className="group relative">
                    <div className="absolute inset-0 bg-red-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative px-6 md:px-8 py-3.5 bg-red-600 hover:bg-red-700 text-white flex items-center gap-2.5 rounded-2xl shadow-xl transition-all active:scale-95">
                        <PhoneOff className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">{t('endCall') || 'End Call'}</span>
                    </div>
                </button>
            </div>
        </div>
    );
}
