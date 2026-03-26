import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoImg from '../assets/logo.jpg';
import { motion, useInView } from 'framer-motion';
import {
    Shield, Video, Phone, Globe, Zap,
    UserCheck, Activity, Pill, BarChart3, Mic,
    Star, ArrowRight, Play, Check,
    Wifi, WifiOff, Stethoscope, BrainCircuit, Clock,
    Smartphone, Languages, AlertTriangle, HeartPulse,
    Sparkles, Eye, TrendingUp, LogIn
} from 'lucide-react';

/* ====== SCROLL REVEAL HOOK ====== */
function useReveal() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });
    return { ref, isInView };
}

/* ====== ANIMATED COUNTER ====== */
function Counter({ end, suffix = '', duration = 2000 }) {
    const [count, setCount] = useState(0);
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });
    useEffect(() => {
        if (!isInView) return;
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
        }, 16);
        return () => clearInterval(timer);
    }, [isInView, end, duration]);
    return <span ref={ref}>{count}{suffix}</span>;
}

/* ====== HEARTBEAT SVG ====== */
function HeartbeatLine() {
    return (
        <svg className="heartbeat-svg" viewBox="0 0 1200 100" style={{ width: '100%', height: 60, position: 'absolute', bottom: 0, left: 0, opacity: 0.15 }}>
            <path
                d="M0,50 L200,50 L230,50 L250,20 L270,80 L290,10 L310,90 L330,30 L350,50 L400,50 L600,50 L630,50 L650,20 L670,80 L690,10 L710,90 L730,30 L750,50 L800,50 L1000,50 L1030,50 L1050,20 L1070,80 L1090,10 L1110,90 L1130,30 L1150,50 L1200,50"
                fill="none" stroke="var(--primary)" strokeWidth="2"
            />
        </svg>
    );
}

function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    return (
        <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                    <img src={logoImg} alt="GramSeva Logo" style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'contain', filter: 'drop-shadow(0 2px 8px rgba(15,118,110,0.2))' }} />
                    <div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.4rem', color: 'var(--dark)', lineHeight: 1 }}>
                                Gram<span style={{ color: 'var(--primary)' }}>Seva</span>
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary)', background: 'rgba(15,118,110,0.08)', padding: '2px 8px', borderRadius: 6, letterSpacing: '0.5px' }}>TELEHEALTH</span>
                        </div>
                        <div style={{ fontSize: '0.58rem', color: 'var(--gray)', fontWeight: 500, letterSpacing: '0.3px', marginTop: 1 }}>☸ Ministry of Health & Family Welfare | Govt. of India</div>
                    </div>
                </Link>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Link to="/dashboard" style={{
                        textDecoration: 'none', color: 'var(--dark)', fontWeight: 600, fontSize: '0.9rem',
                        padding: '8px 16px', borderRadius: 10, transition: '0.3s'
                    }}>Dashboard</Link>
                    <Link to="/login" style={{
                        textDecoration: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem',
                        padding: '8px 16px', borderRadius: 10, border: '1.5px solid var(--primary)', transition: '0.3s',
                        display: 'flex', alignItems: 'center', gap: 6
                    }}><LogIn size={15} /> Login</Link>
                    <Link to="/register" style={{
                        textDecoration: 'none', color: 'white', fontWeight: 600, fontSize: '0.9rem',
                        padding: '8px 20px', borderRadius: 10, background: 'var(--gradient-1)', transition: '0.3s',
                        display: 'flex', alignItems: 'center', gap: 6
                    }}><UserCheck size={15} /> Register</Link>
                </div>
            </div>
        </nav>
    );
}

/* ====== HERO ====== */
function Hero() {
    const words = ['Healthcare', 'Suraksha', 'Swasthya', 'Sehat'];
    const [wordIndex, setWordIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setWordIndex(i => (i + 1) % words.length), 2500);
        return () => clearInterval(interval);
    }, []);

    return (
        <section style={{ background: 'var(--gradient-hero)', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80, position: 'relative', overflow: 'hidden' }}>
            {/* Morphing Blob Background */}
            <div className="morph-blob" style={{
                position: 'absolute', width: 500, height: 500, top: -100, right: -100,
                background: 'linear-gradient(135deg, rgba(14,165,233,0.06), rgba(20,184,166,0.06))',
            }} />
            <div className="morph-blob" style={{
                position: 'absolute', width: 400, height: 400, bottom: -80, left: -80,
                background: 'linear-gradient(135deg, rgba(20,184,166,0.04), rgba(14,165,233,0.04))',
                animationDelay: '3s'
            }} />
            <HeartbeatLine />

            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '4rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }}
                className="md:grid-cols-2">
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(14, 165, 233, 0.1)',
                        padding: '6px 16px', borderRadius: 100, marginBottom: 24, fontWeight: 600, fontSize: '0.85rem'
                    }}>
                        <Sparkles size={14} color="var(--accent)" /> <span className="health-badge">Gemini AI-Powered Platform</span>
                    </div>

                    <h1 style={{ fontFamily: 'Outfit', fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 24 }}>
                        <span style={{ color: 'var(--dark)' }}>Delivering </span>
                        <span style={{ position: 'relative', display: 'inline-block' }}>
                            <motion.span
                                key={words[wordIndex]}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                style={{ background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}>
                                {words[wordIndex]}
                            </motion.span>
                        </span>
                        <br />
                        <span style={{ color: 'var(--dark)' }}>to Every Village</span>
                    </h1>

                    <p style={{ fontSize: '1.15rem', color: 'var(--gray)', lineHeight: 1.8, marginBottom: 32, maxWidth: 520 }}>
                        Connect with verified doctors via <strong>low-bandwidth video calls</strong>, get AI-translated consultations in your language, and access <strong>emergency SOS</strong> even without internet.
                    </p>

                    <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center' }}>
                        {[
                            { icon: <UserCheck size={18} />, text: '500+ Verified Doctors' },
                            { icon: <Shield size={18} />, text: 'End-to-End Encrypted' },
                            { icon: <Globe size={18} />, text: '10+ Languages' },
                        ].map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--gray)', fontSize: '0.9rem' }}>
                                <span style={{ color: 'var(--primary)' }}>{item.icon}</span>
                                <span style={{ fontWeight: 500 }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* RIGHT: Interactive Telehealth Mock UI */}
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'center' }} className="hidden md:flex">
                    <div style={{ position: 'relative', width: 500, height: 540 }}>

                        {/* ─── Main: Video Call Window ─── */}
                        <div style={{
                            width: 420, height: 460, borderRadius: '1.5rem', overflow: 'hidden', position: 'relative',
                            background: '#1E293B', boxShadow: '0 30px 80px rgba(0,0,0,0.2)'
                        }}>
                            {/* Video call top bar */}
                            <div style={{
                                background: '#0F172A', padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                                </div>
                                <span style={{ color: '#94A3B8', fontSize: '0.7rem', fontWeight: 500 }}>GramSeva Telehealth • Live</span>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
                                    <span style={{ color: '#10B981', fontSize: '0.65rem', fontWeight: 600 }}>CONNECTED</span>
                                </div>
                            </div>

                            {/* Doctor video area — REAL IMAGE */}
                            <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
                                <img src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80"
                                    alt="Dr. Priya Sharma on video call" loading="eager"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(180deg, #1E293B, #0F172A)'; }} />
                                {/* Dark gradient overlay on image */}
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(transparent 40%, rgba(15,23,42,0.85))' }} />
                                {/* Doctor label */}
                                <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 2 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                        <div style={{ background: '#10B981', width: 8, height: 8, borderRadius: '50%' }} />
                                        <span style={{ color: '#10B981', fontSize: '0.7rem', fontWeight: 600 }}>Dr. Priya Sharma • Live</span>
                                    </div>
                                    <span style={{ color: '#94A3B8', fontSize: '0.65rem' }}>General Physician • AIIMS Delhi</span>
                                </div>
                                {/* Call duration */}
                                <motion.div animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 2, repeat: Infinity }}
                                    style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.2)', backdropFilter: 'blur(8px)', padding: '4px 12px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} />
                                    <span style={{ color: '#EF4444', fontSize: '0.7rem', fontWeight: 600 }}>12:34</span>
                                </motion.div>
                                {/* Patient small window — REAL IMAGE */}
                                <div style={{
                                    position: 'absolute', bottom: 12, right: 12, zIndex: 2,
                                    width: 100, height: 70, borderRadius: 10,
                                    border: '2px solid rgba(255,255,255,0.15)', overflow: 'hidden'
                                }}>
                                    <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
                                        alt="Patient" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = '#334155'; }} />
                                    <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', fontSize: '0.5rem', color: 'white', background: 'rgba(0,0,0,0.5)', padding: '1px 6px', borderRadius: 4 }}>You</span>
                                </div>
                            </div>

                            {/* Bottom controls */}
                            <div style={{
                                display: 'flex', justifyContent: 'center', gap: 16, padding: '16px',
                                background: '#0F172A'
                            }}>
                                {[
                                    { icon: <Mic size={16} />, bg: 'rgba(255,255,255,0.1)', color: 'white' },
                                    { icon: <Video size={16} />, bg: 'rgba(255,255,255,0.1)', color: 'white' },
                                    { icon: <Languages size={16} />, bg: 'rgba(14,165,233,0.2)', color: '#38BDF8', label: 'AI' },
                                    { icon: <Phone size={16} />, bg: '#EF4444', color: 'white' },
                                ].map((ctrl, i) => (
                                    <div key={i} style={{
                                        width: 40, height: 40, borderRadius: 12, background: ctrl.bg, color: ctrl.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer'
                                    }}>
                                        {ctrl.icon}
                                        {ctrl.label && <span style={{ position: 'absolute', top: -4, right: -4, background: '#0EA5E9', color: 'white', fontSize: '0.5rem', fontWeight: 700, padding: '1px 4px', borderRadius: 4 }}>{ctrl.label}</span>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ─── Floating: Live Health Vitals ─── */}
                        <motion.div animate={{ y: [-8, 8, -8] }} transition={{ duration: 5, repeat: Infinity }}
                            style={{
                                position: 'absolute', top: 60, right: -40,
                                background: 'white', borderRadius: 16, padding: '16px', width: 170,
                                boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0'
                            }}>
                            <div style={{ fontSize: '0.65rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Live Vitals</div>
                            {[
                                { label: 'Heart Rate', value: '72 bpm', color: '#EF4444', icon: <HeartPulse size={14} /> },
                                { label: 'SpO₂', value: '98%', color: '#0EA5E9', icon: <Activity size={14} /> },
                                { label: 'BP', value: '120/80', color: '#10B981', icon: <TrendingUp size={14} /> },
                            ].map((v, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: i < 2 ? 10 : 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <span style={{ color: v.color }}>{v.icon}</span>
                                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{v.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: v.color }}>{v.value}</span>
                                </div>
                            ))}
                        </motion.div>

                        {/* ─── Floating: AI Translation Badge ─── */}
                        <motion.div animate={{ y: [6, -6, 6] }} transition={{ duration: 4, repeat: Infinity }}
                            style={{
                                position: 'absolute', bottom: 120, left: -50,
                                background: 'white', borderRadius: 14, padding: '12px 16px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0', width: 200
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Languages size={14} color="white" />
                                </div>
                                <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--dark)' }}>AI Translating</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.7rem', color: '#64748B' }}>
                                <span style={{ background: '#F59E0B', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: '0.6rem' }}>HI</span>
                                Hindi →
                                <span style={{ background: '#0EA5E9', color: 'white', padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: '0.6rem' }}>TA</span>
                                Tamil
                            </div>
                        </motion.div>

                        {/* ─── Floating: E-Prescription ─── */}
                        <motion.div animate={{ y: [10, -5, 10] }} transition={{ duration: 6, repeat: Infinity }}
                            style={{
                                position: 'absolute', bottom: 10, right: -20,
                                background: 'white', borderRadius: 14, padding: '14px 16px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0', width: 190
                            }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                <Pill size={14} color="#EC4899" />
                                <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>E-Prescription</span>
                                <Check size={12} color="#10B981" style={{ marginLeft: 'auto' }} />
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#64748B', lineHeight: 1.6 }}>
                                <div>1. Paracetamol 500mg × 3</div>
                                <div>2. ORS Sachets × 10</div>
                                <div style={{ color: '#10B981', fontWeight: 600, marginTop: 4 }}>✓ Sent to nearest pharmacy</div>
                            </div>
                        </motion.div>

                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ====== SCROLLING MARQUEE BAR ====== */
function MarqueeTrust() {
    const items = ['🏥 HIPAA Compliant', '🔒 AES-256 Encrypted', '🌐 10+ Languages', '📱 Works on 2G', '🤖 Gemini AI Powered', '🚨 Offline SOS', '💊 Pharmacy Tracking', '🗣️ Voice Triage'];
    return (
        <div style={{ background: 'var(--dark)', padding: '14px 0', overflow: 'hidden' }}>
            <div style={{ display: 'flex', animation: 'marquee 25s linear infinite', width: 'max-content' }}>
                {[...items, ...items].map((item, i) => (
                    <span key={i} style={{ color: '#94A3B8', fontWeight: 500, fontSize: '0.9rem', padding: '0 32px', whiteSpace: 'nowrap' }}>{item}</span>
                ))}
            </div>
        </div>
    );
}

/* ====== STATS ====== */
function StatsBar() {
    const stats = [
        { number: 500, suffix: '+', label: 'Verified Doctors', icon: <Stethoscope size={22} /> },
        { number: 50, suffix: 'K+', label: 'Consultations', icon: <Video size={22} /> },
        { number: 10, suffix: '+', label: 'Languages', icon: <Languages size={22} /> },
        { number: 99, suffix: '.9%', label: 'Uptime', icon: <Zap size={22} /> },
    ];
    return (
        <section style={{ padding: '4rem 1.5rem', background: 'white' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {stats.map((s, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                        className="stat-glow"
                        style={{ textAlign: 'center', padding: '2rem 1rem', borderRadius: '1.5rem', border: '1px solid #E2E8F0', transition: 'all 0.3s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}>
                        <div style={{ color: 'var(--primary)', marginBottom: 8 }}>{s.icon}</div>
                        <div className="stat-number"><Counter end={s.number} suffix={s.suffix} /></div>
                        <div style={{ color: 'var(--gray)', fontWeight: 500, marginTop: 4, fontSize: '0.9rem' }}>{s.label}</div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}

/* ====== 3D TILT FEATURE CARDS WITH IMAGES ====== */
function Features() {
    const { ref, isInView } = useReveal();
    const features = [
        { icon: <Video size={28} />, title: 'Low-Bandwidth Video', desc: 'Adaptive bitrate streaming. Works on 2G/3G with auto audio-only fallback.', color: '#0EA5E9', bg: '#EFF6FF', img: 'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?auto=format&fit=crop&w=400&q=80' },
        { icon: <Shield size={28} />, title: 'Doctor Verification', desc: 'Strict 2-step verification. Medical Council check + Manual admin approval.', color: '#10B981', bg: '#ECFDF5', img: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80' },
        { icon: <AlertTriangle size={28} />, title: 'Emergency SOS', desc: 'One-click SOS sends GPS location to family, nearest PHC & ambulance.', color: '#EF4444', bg: '#FEF2F2', img: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?auto=format&fit=crop&w=400&q=80' },
        { icon: <Languages size={28} />, title: 'AI Auto-Translation', desc: 'Gemini API translates doctor↔patient conversation in real-time across 10+ Indian languages.', color: '#8B5CF6', bg: '#F5F3FF', img: 'https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=400&q=80' },
        { icon: <Mic size={28} />, title: 'Voice-Based Triage', desc: 'Speak symptoms in any language. AI routes you to the correct specialist.', color: '#F59E0B', bg: '#FFFBEB', img: 'https://images.unsplash.com/photo-1590650153855-d9e808231d41?auto=format&fit=crop&w=400&q=80' },
        { icon: <Pill size={28} />, title: 'Pharmacy Stock Check', desc: 'Know medicine availability at your nearest pharmacy before visiting.', color: '#EC4899', bg: '#FDF2F8', img: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=400&q=80' },
    ];
    return (
        <section id="features" style={{ padding: '6rem 1.5rem', background: 'var(--light)' }}>
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>What We Offer</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>Everything Rural Healthcare Needs</h2>
                        <p className="section-subtitle" style={{ margin: '16px auto 0' }}>
                            From AI consultations to emergency alerts — all optimized for low-connectivity areas.
                        </p>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
                    {features.map((f, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="tilt-card"
                            style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '1.5rem', overflow: 'hidden', cursor: 'default' }}
                            whileHover={{ rotateY: 3, rotateX: -3, scale: 1.02, boxShadow: '0 25px 60px rgba(0,0,0,0.08)' }}>
                            <div style={{ height: 160, overflow: 'hidden', position: 'relative' }}>
                                <img src={f.img} alt={f.title} loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = `linear-gradient(135deg, ${f.bg}, ${f.color}15)`; }} />
                                <div style={{ position: 'absolute', top: 12, left: 12, width: 44, height: 44, borderRadius: 12, background: f.bg, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                    {f.icon}
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', marginBottom: 10 }}>{f.title}</h3>
                                <p style={{ color: 'var(--gray)', lineHeight: 1.7, fontSize: '0.95rem' }}>{f.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== INTERACTIVE VOICE TRIAGE DEMO ====== */
function VoiceTriageDemo() {
    const { ref, isInView } = useReveal();
    const [step, setStep] = useState(0);
    const [typing, setTyping] = useState(false);

    const conversation = [
        { role: 'user', text: '🎤 "Mera pet bahut dard kar raha hai aur ulti aa rahi hai"', lang: 'Hindi' },
        { role: 'ai', text: '🤖 Analyzing symptoms with Gemini AI...', wait: true },
        { role: 'ai', text: '✅ Detected: Abdominal Pain + Nausea\n🏥 Severity: Medium\n👨‍⚕️ Recommended: Dr. Sharma (Gastroenterologist)\n⏱️ Available in: 5 minutes' },
    ];

    const runDemo = () => {
        setStep(0);
        setTyping(false);
        let s = 0;
        const next = () => {
            if (s < conversation.length) {
                setStep(s);
                if (conversation[s].wait) {
                    setTyping(true);
                    setTimeout(() => { setTyping(false); s++; next(); }, 2000);
                } else {
                    s++;
                    setTimeout(next, 1800);
                }
            }
        };
        next();
    };

    return (
        <section id="demo" style={{ padding: '6rem 1.5rem', background: 'white' }}>
            <div ref={ref} style={{ maxWidth: 1000, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>🎤 Interactive Demo</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>Try Our AI Voice Triage</h2>
                        <p className="section-subtitle" style={{ margin: '16px auto 0' }}>See how a patient speaking Hindi gets instantly routed to the right specialist.</p>
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 }}
                    className="demo-terminal" style={{ maxWidth: 600, margin: '0 auto' }}>
                    <div className="demo-terminal-bar">
                        <div className="demo-terminal-dot" style={{ background: '#EF4444' }} />
                        <div className="demo-terminal-dot" style={{ background: '#F59E0B' }} />
                        <div className="demo-terminal-dot" style={{ background: '#10B981' }} />
                        <span style={{ color: '#64748B', fontSize: '0.8rem', marginLeft: 8 }}>GramSeva AI Triage Engine</span>
                    </div>
                    <div style={{ padding: '1.5rem', minHeight: 250 }}>
                        {conversation.slice(0, step + 1).map((msg, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                style={{
                                    padding: '12px 16px', borderRadius: 12, marginBottom: 12,
                                    background: msg.role === 'user' ? 'rgba(14,165,233,0.15)' : 'rgba(16,185,129,0.1)',
                                    color: msg.role === 'user' ? '#0EA5E9' : '#10B981',
                                    fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line'
                                }}>
                                {msg.wait && typing ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                                            <BrainCircuit size={16} />
                                        </motion.div>
                                        Processing symptoms...
                                    </div>
                                ) : msg.text}
                            </motion.div>
                        ))}
                        {step === 0 && !typing && (
                            <div style={{ textAlign: 'center', paddingTop: 16 }}>
                                <button onClick={runDemo}
                                    style={{
                                        background: 'var(--gradient-1)', color: 'white', border: 'none',
                                        padding: '12px 28px', borderRadius: 100, cursor: 'pointer', fontWeight: 600,
                                        display: 'inline-flex', alignItems: 'center', gap: 8, transition: '0.3s'
                                    }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'}>
                                    <Play size={16} /> Run Demo
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ====== HOW IT WORKS ====== */
function HowItWorks() {
    const { ref, isInView } = useReveal();
    const steps = [
        { step: '01', title: 'Register with Phone OTP', desc: 'No passwords. Just your mobile number + OTP.', icon: <Smartphone size={28} />, color: '#0EA5E9' },
        { step: '02', title: 'Speak Your Symptoms', desc: 'Talk in your language. AI understands Hindi, Tamil, Bengali & more.', icon: <Mic size={28} />, color: '#8B5CF6' },
        { step: '03', title: 'AI Routes to Specialist', desc: 'Gemini AI analyzes and connects you to the right doctor.', icon: <BrainCircuit size={28} />, color: '#F59E0B' },
        { step: '04', title: 'Video Consultation', desc: 'Face-to-face consultation optimized for your network.', icon: <Video size={28} />, color: '#10B981' },
        { step: '05', title: 'QR-Verified Prescription', desc: 'Digital prescription with pharmacy stock check built-in.', icon: <Pill size={28} />, color: '#EC4899' },
    ];

    return (
        <section id="how-it-works" style={{ padding: '6rem 1.5rem', background: 'var(--light)' }}>
            <div ref={ref} style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>Simple Process</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>5 Steps to Better Health</h2>
                    </motion.div>
                </div>

                <div style={{ position: 'relative' }}>
                    {/* Connecting Line */}
                    <div style={{ position: 'absolute', left: 35, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, var(--primary-light), var(--accent))', zIndex: 0 }} className="hidden md:block" />

                    {steps.map((s, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, x: -40 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ duration: 0.5, delay: i * 0.15 }}
                            style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', position: 'relative', zIndex: 1 }}>
                            <div style={{
                                width: 72, height: 72, borderRadius: '50%', background: 'white',
                                border: `3px solid ${s.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexShrink: 0, color: s.color, boxShadow: `0 0 0 6px ${s.color}15`
                            }}>
                                {s.icon}
                            </div>
                            <div style={{
                                flex: 1, background: 'white', borderRadius: '1.25rem', padding: '1.5rem 2rem',
                                border: '1px solid #E2E8F0', transition: 'all 0.3s'
                            }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = s.color; e.currentTarget.style.boxShadow = `0 10px 30px ${s.color}10`; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}>
                                <span style={{ color: s.color, fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 2 }}>Step {s.step}</span>
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.2rem', margin: '6px 0 6px' }}>{s.title}</h3>
                                <p style={{ color: 'var(--gray)', lineHeight: 1.6, fontSize: '0.95rem' }}>{s.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== AI SECTION (Dark) WITH IMAGE ====== */
function AISection() {
    const { ref, isInView } = useReveal();
    return (
        <section id="ai" style={{ padding: '6rem 1.5rem', background: 'var(--dark)', color: 'white', overflow: 'hidden', position: 'relative' }}>
            {/* Background image overlay */}
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'url(https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&h=900&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary-light)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>⚡ Powered By Gemini API</span>
                        <h2 className="section-title" style={{ marginTop: 12, color: 'white' }}>AI That Speaks Your Language</h2>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { icon: <Languages size={32} />, title: 'Real-time Translation', desc: 'Doctor speaks Hindi → Patient hears Tamil. Live voice translation during calls.', gradient: 'linear-gradient(135deg, #0F766E, #14B8A6)', img: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop' },
                        { icon: <Mic size={32} />, title: 'Voice Triage', desc: '"Mera pet dard kar raha hai" → AI routes you to a Gastroenterologist. Just speak!', gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', img: 'https://images.unsplash.com/photo-1589254065878-42c9da997008?w=400&h=200&fit=crop' },
                        { icon: <BarChart3 size={32} />, title: 'Demand Prediction', desc: 'AI predicts disease outbreaks before they happen. Government-ready analytics.', gradient: 'linear-gradient(135deg, #8B5CF6, #A78BFA)', img: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop' },
                    ].map((item, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, y: 30 }}
                            animate={isInView ? { opacity: 1, y: 0 } : {}}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                            whileHover={{ y: -8, scale: 1.02 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)', borderRadius: '1.5rem', overflow: 'hidden',
                                border: '1px solid rgba(255,255,255,0.08)', cursor: 'default'
                            }}>
                            <div style={{ height: 140, overflow: 'hidden' }}>
                                <img src={item.img} alt={item.title} loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, transition: 'all 0.4s' }}
                                    onMouseEnter={e => e.target.style.opacity = '0.7'}
                                    onMouseLeave={e => e.target.style.opacity = '0.5'} />
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 14, background: item.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: -48, position: 'relative', border: '3px solid #1E293B' }}>
                                    {item.icon}
                                </div>
                                <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.3rem', marginBottom: 12 }}>{item.title}</h3>
                                <p style={{ color: '#94A3B8', lineHeight: 1.7 }}>{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== BEFORE vs AFTER (Unique) ====== */
function BeforeAfter() {
    const { ref, isInView } = useReveal();
    const items = [
        { before: 'Travel 50+ km to see a doctor', after: 'Video call from your village' },
        { before: 'Language barrier with city doctors', after: 'AI translates in real-time' },
        { before: 'No emergency support in villages', after: 'One-click SOS with GPS tracking' },
        { before: 'Fake doctors, no verification', after: 'Double-verified specialists only' },
        { before: 'Walk to pharmacy, medicine out of stock', after: 'Stock check before prescription' },
    ];
    return (
        <section style={{ padding: '6rem 1.5rem', background: 'white' }}>
            <div ref={ref} style={{ maxWidth: 900, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>The Difference</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>Before vs After GramSeva</h2>
                    </motion.div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {items.map((item, i) => (
                        <motion.div key={i}
                            initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                            animate={isInView ? { opacity: 1, x: 0 } : {}}
                            transition={{ delay: i * 0.1 }}
                            style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ background: '#FEF2F2', padding: '16px 20px', borderRadius: 12, color: '#991B1B', fontWeight: 500, fontSize: '0.95rem', textAlign: 'right' }}>
                                ❌ {item.before}
                            </div>
                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <ArrowRight size={18} color="white" />
                            </div>
                            <div style={{ background: '#ECFDF5', padding: '16px 20px', borderRadius: 12, color: '#065F46', fontWeight: 500, fontSize: '0.95rem' }}>
                                ✅ {item.after}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== CONNECTIVITY ====== */
function ConnectivitySection() {
    const { ref, isInView } = useReveal();
    return (
        <section style={{ padding: '6rem 1.5rem', background: 'var(--light)' }}>
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '4rem', alignItems: 'center' }} className="md:grid-cols-2">
                <motion.div initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }}>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>Never Offline</span>
                    <h2 className="section-title" style={{ marginTop: 12 }}>Works Even Without Internet</h2>
                    <p style={{ color: 'var(--gray)', lineHeight: 1.8, margin: '16px 0 32px', fontSize: '1.05rem' }}>
                        Built for real India — where network drops mid-call, 2G is normal, and lives depend on reaching a doctor.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[
                            { icon: <Wifi size={20} />, text: '4G/3G: Full HD video', tag: 'Best' },
                            { icon: <Wifi size={20} />, text: '2G: Auto low-quality or audio-only', tag: 'Good' },
                            { icon: <WifiOff size={20} />, text: 'No Internet: SMS/IVR conference call', tag: 'Fallback' },
                            { icon: <Phone size={20} />, text: 'Offline SOS: Queued & sent on reconnect', tag: 'Emergency' },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.3 + i * 0.1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 14, background: 'white', border: '1px solid #E2E8F0', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ color: 'var(--primary)' }}>{item.icon}</span>
                                    <span style={{ fontWeight: 500 }}>{item.text}</span>
                                </div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(14,165,233,0.1)', padding: '3px 10px', borderRadius: 100 }}>{item.tag}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.7, delay: 0.2 }} className="hidden md:flex" style={{ justifyContent: 'center' }}>
                    <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #EFF6FF)', borderRadius: '2rem', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%', maxWidth: 400 }}>
                        {[
                            { label: '4G/LTE', bars: 4, color: '#10B981', status: 'HD Video' },
                            { label: '3G', bars: 3, color: '#F59E0B', status: 'SD Video' },
                            { label: '2G', bars: 2, color: '#EF4444', status: 'Audio Call' },
                            { label: 'No Signal', bars: 0, color: '#6B7280', status: 'SMS/IVR' },
                        ].map((n, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ delay: 0.4 + i * 0.15 }}
                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'white', borderRadius: 16, padding: '14px 20px', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20 }}>
                                        {[1, 2, 3, 4].map(bar => (
                                            <div key={bar} style={{ width: 4, height: bar * 5, borderRadius: 2, background: bar <= n.bars ? n.color : '#E2E8F0' }} />
                                        ))}
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{n.label}</span>
                                </div>
                                <span style={{ color: n.color, fontWeight: 700, fontSize: '0.8rem', background: `${n.color}15`, padding: '4px 12px', borderRadius: 100 }}>{n.status}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ====== IMPACT ====== */
function Impact() {
    const { ref, isInView } = useReveal();
    return (
        <section id="impact" style={{ padding: '6rem 1.5rem', background: 'white' }}>
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>Success Metrics</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>Built for Performance</h2>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {[
                        { icon: <Clock size={28} />, stat: '< 5s', label: 'Call Setup', desc: 'On 4G networks' },
                        { icon: <Shield size={28} />, stat: '0%', label: 'Fake Doctors', desc: 'Double verification' },
                        { icon: <Zap size={28} />, stat: '< 2s', label: 'SOS Delivery', desc: 'Alert to contacts' },
                        { icon: <Smartphone size={28} />, stat: '< 50MB', label: 'App Size', desc: 'Low-end phones' },
                    ].map((item, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ y: -8, boxShadow: '0 20px 50px rgba(0,0,0,0.06)' }}
                            style={{ background: 'var(--light)', borderRadius: '1.5rem', padding: '2rem', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(14,165,233,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--primary)' }}>
                                {item.icon}
                            </div>
                            <div style={{ fontFamily: 'Outfit', fontSize: '2rem', fontWeight: 800, background: 'var(--gradient-1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{item.stat}</div>
                            <div style={{ fontWeight: 700, marginTop: 4 }}>{item.label}</div>
                            <div style={{ color: 'var(--gray)', marginTop: 4, fontSize: '0.9rem' }}>{item.desc}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== ECG DIVIDER ====== */
function EcgDivider() {
    return (
        <div className="ecg-divider">
            <svg viewBox="0 0 800 40" style={{ width: '100%', height: '100%' }} preserveAspectRatio="none">
                <path d="M0,20 L150,20 L170,20 L180,5 L190,35 L200,2 L210,38 L220,10 L230,20 L400,20 L420,20 L430,5 L440,35 L450,2 L460,38 L470,10 L480,20 L650,20 L670,20 L680,5 L690,35 L700,2 L710,38 L720,10 L730,20 L800,20"
                    fill="none" stroke="var(--primary)" strokeWidth="1.5" />
            </svg>
        </div>
    );
}

/* ====== CTA ====== */
function CTA() {
    const navigate = useNavigate();
    const { ref, isInView } = useReveal();
    return (
        <section style={{ padding: '6rem 1.5rem' }}>
            <motion.div ref={ref} initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ duration: 0.6 }}
                style={{ maxWidth: 1000, margin: '0 auto', background: 'var(--gradient-1)', borderRadius: '2rem', padding: 'clamp(3rem, 6vw, 5rem)', textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden' }}>
                {/* Decorative circles */}
                <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', top: -60, right: -60 }} />
                <div style={{ position: 'absolute', width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -40, left: -40 }} />
                {/* ECG heartbeat background */}
                <svg viewBox="0 0 800 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.06 }} preserveAspectRatio="none">
                    <path d="M0,50 L150,50 L180,50 L200,15 L220,85 L240,5 L260,95 L280,25 L300,50 L450,50 L480,50 L500,15 L520,85 L540,5 L560,95 L580,25 L600,50 L750,50 L780,50 L800,50"
                        fill="none" stroke="white" strokeWidth="2" />
                </svg>
                {/* Live pulse badge */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', padding: '8px 20px', borderRadius: 100, marginBottom: 20, position: 'relative' }}>
                    <div className="pulse-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34D399' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>2,847 patients connected today</span>
                </div>
                <h2 style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginBottom: 16, position: 'relative' }}>
                    Ready to Transform Rural Healthcare?
                </h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 500, margin: '0 auto 32px', lineHeight: 1.7, position: 'relative' }}>
                    Join hundreds of doctors and thousands of patients bridging the healthcare gap.
                </p>
                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', position: 'relative' }}>
                    <motion.button onClick={() => navigate('/login')} whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}
                        style={{ background: 'white', color: 'var(--primary)', padding: '16px 36px', borderRadius: 100, fontWeight: 700, fontSize: '1.05rem', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <HeartPulse size={18} /> Join as Patient <ArrowRight size={18} />
                    </motion.button>
                    <motion.button onClick={() => navigate('/login')} whileHover={{ y: -3, borderColor: 'white' }}
                        style={{ background: 'transparent', color: 'white', padding: '16px 36px', borderRadius: 100, fontWeight: 700, fontSize: '1.05rem', border: '2px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                        Register as Doctor <Stethoscope size={18} />
                    </motion.button>
                </div>
            </motion.div>
        </section>
    );
}

/* ====== FOOTER ====== */
function Footer() {
    return (
        <footer style={{ background: 'var(--dark)', color: '#94A3B8', padding: '4rem 1.5rem 2rem' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2.5rem', marginBottom: '3rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <img src={logoImg} alt="GramSeva Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'contain' }} />
                            <span style={{ fontFamily: 'Outfit', fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>GramSeva</span>
                        </div>
                        <p style={{ lineHeight: 1.7, fontSize: '0.9rem' }}>Bridging the urban-rural healthcare divide through AI-powered telehealth.</p>
                    </div>
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16 }}>Platform</h4>
                        {['Patient Portal', 'Doctor Registration', 'Admin Dashboard', 'Emergency SOS'].map(l => (
                            <a key={l} href="#" style={{ display: 'block', color: '#94A3B8', textDecoration: 'none', marginBottom: 10, fontSize: '0.9rem', transition: '0.3s' }}
                                onMouseEnter={e => e.target.style.color = 'var(--primary-light)'}
                                onMouseLeave={e => e.target.style.color = '#94A3B8'}>{l}</a>
                        ))}
                    </div>
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16 }}>AI Features</h4>
                        {['Auto Translation', 'Voice Triage', 'Demand Prediction', 'Symptom Checker'].map(l => (
                            <a key={l} href="#" style={{ display: 'block', color: '#94A3B8', textDecoration: 'none', marginBottom: 10, fontSize: '0.9rem', transition: '0.3s' }}
                                onMouseEnter={e => e.target.style.color = 'var(--primary-light)'}
                                onMouseLeave={e => e.target.style.color = '#94A3B8'}>{l}</a>
                        ))}
                    </div>
                    <div>
                        <h4 style={{ color: 'white', fontWeight: 700, marginBottom: 16 }}>Support</h4>
                        {['help@gramseva.in', 'Toll-free: 1800-XXX-XXXX', 'FAQ', 'Privacy Policy'].map(l => (
                            <a key={l} href="#" style={{ display: 'block', color: '#94A3B8', textDecoration: 'none', marginBottom: 10, fontSize: '0.9rem', transition: '0.3s' }}
                                onMouseEnter={e => e.target.style.color = 'var(--primary-light)'}
                                onMouseLeave={e => e.target.style.color = '#94A3B8'}>{l}</a>
                        ))}
                    </div>
                </div>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                    <p style={{ fontSize: '0.85rem' }}>© 2026 GramSeva Telehealth. All rights reserved.</p>
                    <p style={{ fontSize: '0.85rem' }}>Made with ❤️ for Rural India</p>
                </div>
            </div>
        </footer>
    );
}

/* ====== TESTIMONIALS WITH REAL PHOTOS ====== */
function Testimonials() {
    const { ref, isInView } = useReveal();
    const testimonials = [
        {
            name: 'Ramesh Kumar',
            role: 'Patient, Jharkhand',
            text: 'Pehle 50km jaana padta tha doctor ke liye. Ab phone se hi consultation ho jaata hai. Mere gaon ke liye itna bada change!',
            img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
            rating: 5
        },
        {
            name: 'Dr. Ananya Mehta',
            role: 'Gynecologist, Mumbai',
            text: 'The AI translation is a game-changer. I can now consult patients who speak Tamil or Bengali effortlessly. The platform handles everything.',
            img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=100&q=80',
            rating: 5
        },
        {
            name: 'Sunita Devi',
            role: 'ASHA Worker, Bihar',
            text: 'SOS button ne ek pregnant mahila ki jaan bachayi. Ambulance 15 minute mein aa gayi. Ye app har gaon mein hona chahiye.',
            img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&q=80',
            rating: 5
        },
    ];
    return (
        <section style={{ padding: '6rem 1.5rem', background: 'var(--light)' }}>
            <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>Real Stories</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>What Our Users Say</h2>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {testimonials.map((t, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.15 }}
                            whileHover={{ y: -6 }}
                            style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', border: '1px solid #E2E8F0', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: 2, marginBottom: 16 }}>
                                {Array(t.rating).fill(0).map((_, j) => <Star key={j} size={16} fill="#F59E0B" color="#F59E0B" />)}
                            </div>
                            <p style={{ color: 'var(--gray)', lineHeight: 1.7, fontSize: '0.95rem', fontStyle: 'italic', marginBottom: 20 }}>"{t.text}"</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <img src={t.img} alt={t.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #E2E8F0' }}
                                    onError={(e) => { e.target.style.display = 'none'; }} />
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.name}</div>
                                    <div style={{ color: 'var(--gray)', fontSize: '0.8rem' }}>{t.role}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== FULL-WIDTH IMAGE BANNER ====== */
function ImageBanner() {
    const { ref, isInView } = useReveal();
    return (
        <section style={{ position: 'relative', height: 340, overflow: 'hidden' }}>
            <img src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?auto=format&fit=crop&w=1600&q=80" alt="Rural healthcare" loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg, #0F766E, #0EA5E9)'; }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(15,118,110,0.85), rgba(14,165,233,0.75))' }} />
            <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}}
                style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white', textAlign: 'center', padding: '2rem' }}>
                <h2 style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: 800, marginBottom: 12, maxWidth: 700 }}>
                    Reaching the Unreached — From Metros to the Last Mile
                </h2>
                <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: 600 }}>
                    Our platform is designed for the 65% of India that lives in villages with limited healthcare access.
                </p>
            </motion.div>
        </section>
    );
}

/* ====== GOVERNMENT PARTNERS / SUPPORTED BY ====== */
function GovtPartners() {
    const { ref, isInView } = useReveal();
    const partners = [
        { name: 'Ministry of Health', subtitle: '& Family Welfare', icon: '🏥' },
        { name: 'Ayushman Bharat', subtitle: 'Digital Mission', icon: '🇮🇳' },
        { name: 'National Health', subtitle: 'Mission (NHM)', icon: '🏥' },
        { name: 'Digital India', subtitle: 'Health Initiative', icon: '📱' },
        { name: 'ICMR', subtitle: 'Research Council', icon: '🔬' },
        { name: 'NITI Aayog', subtitle: 'Health Vertical', icon: '🏢' },
    ];
    return (
        <section style={{ padding: '4rem 1.5rem', background: 'white', borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0' }}>
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}
                    style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <span style={{ color: 'var(--gray)', fontWeight: 600, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: 2 }}>Aligned With National Healthcare Goals</span>
                    <h3 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.5rem', marginTop: 8 }}>Supported By Government Initiatives</h3>
                </motion.div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1.5rem' }}>
                    {partners.map((p, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.08 }}
                            style={{ textAlign: 'center', padding: '1.5rem 1rem', borderRadius: '1rem', border: '1px solid #E2E8F0', transition: 'all 0.3s' }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-light)'; e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.04)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{p.icon}</div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.name}</div>
                            <div style={{ color: 'var(--gray)', fontSize: '0.75rem' }}>{p.subtitle}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== PHOTO GALLERY ====== */
function PhotoGallery() {
    const { ref, isInView } = useReveal();
    const photos = [
        { src: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?w=500&h=400&fit=crop', caption: 'Teleconsultation in progress' },
        { src: 'https://images.unsplash.com/photo-1584982751601-97dcc096659c?w=500&h=400&fit=crop', caption: 'Doctor reviewing patient records' },
        { src: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&h=400&fit=crop', caption: 'Medical team collaboration' },
        { src: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?w=500&h=400&fit=crop', caption: 'Digital health monitoring' },
        { src: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=500&h=400&fit=crop', caption: 'Hospital facility' },
        { src: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?w=500&h=400&fit=crop', caption: 'Healthcare for all communities' },
    ];
    return (
        <section style={{ padding: '6rem 1.5rem', background: 'white' }}>
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>📸 Our Impact in Action</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>Ground Reality — Real Photos</h2>
                        <p className="section-subtitle" style={{ margin: '16px auto 0' }}>See how GramSeva is transforming healthcare delivery across rural India.</p>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }} className="gallery-grid">
                    {photos.map((p, i) => (
                        <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={isInView ? { opacity: 1, scale: 1 } : {}} transition={{ delay: i * 0.1 }}
                            style={{ borderRadius: '1rem', overflow: 'hidden', position: 'relative', cursor: 'pointer', height: 280 }}
                            whileHover={{ scale: 1.03 }}>
                            <img src={p.src} alt={p.caption} loading="lazy"
                                style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s' }}
                                onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.style.background = 'linear-gradient(135deg, #0F766E22, #0EA5E922)'; }} />
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 16px',
                                background: 'linear-gradient(transparent, rgba(0,0,0,0.7))', color: 'white',
                                fontSize: '0.85rem', fontWeight: 500
                            }}>{p.caption}</div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== GOVERNMENT INITIATIVE SECTION ====== */
function GovtInitiative() {
    const { ref, isInView } = useReveal();
    return (
        <section style={{ padding: '5rem 1.5rem', background: '#F0FDF4', borderTop: '3px solid var(--primary)', borderBottom: '3px solid var(--primary)' }}>
            <div ref={ref} style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr', gap: '3rem', alignItems: 'center' }} className="md:grid-cols-2">
                <motion.div initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(15,118,110,0.1)', padding: '6px 16px', borderRadius: 100, marginBottom: 16, color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                        🇮🇳 Government of India Initiative
                    </div>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
                        Aligned with Ayushman Bharat Digital Mission
                    </h2>
                    <p style={{ color: 'var(--gray)', lineHeight: 1.8, fontSize: '1rem', marginBottom: 24 }}>
                        GramSeva is built to integrate with India’s national health infrastructure — ABHA health IDs, e-Sanjeevani telemedicine,
                        and Digital Health Incentives under the National Health Mission. Every consultation generates ABDM-compliant health records.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {[
                            { label: 'ABHA ID Integration', icon: <UserCheck size={18} /> },
                            { label: 'ABDM Compliant Records', icon: <Shield size={18} /> },
                            { label: 'e-Sanjeevani Compatible', icon: <Video size={18} /> },
                            { label: 'NHM Reporting Ready', icon: <BarChart3 size={18} /> },
                        ].map((item, i) => (
                            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.3 + i * 0.1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, background: 'white', border: '1px solid #D1FAE5' }}>
                                <span style={{ color: 'var(--primary)' }}>{item.icon}</span>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 30 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }} className="hidden md:block">
                    <div style={{ position: 'relative' }}>
                        <img src="https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=600&h=450&fit=crop"
                            alt="Healthcare in India" loading="lazy"
                            style={{ width: '100%', borderRadius: '1.5rem', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }} />
                        <div style={{
                            position: 'absolute', bottom: -16, right: -16,
                            background: 'var(--primary)', color: 'white', borderRadius: '1rem', padding: '16px 20px',
                            boxShadow: '0 10px 30px rgba(15,118,110,0.3)', display: 'flex', alignItems: 'center', gap: 10
                        }}>
                            <Shield size={20} />
                            <div>
                                <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>Data Residency</div>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>100% India Servers</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}

/* ====== TEAM / DOCTORS SHOWCASE ====== */
function DoctorsShowcase() {
    const { ref, isInView } = useReveal();
    const doctors = [
        { name: 'Dr. Rajesh Patel', specialty: 'General Medicine', exp: '15 yrs', img: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&h=350&fit=crop&crop=face', rating: '4.9' },
        { name: 'Dr. Priya Singh', specialty: 'Gynecology', exp: '12 yrs', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&h=350&fit=crop&crop=face', rating: '4.8' },
        { name: 'Dr. Amit Kumar', specialty: 'Pediatrics', exp: '10 yrs', img: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&h=350&fit=crop&crop=face', rating: '4.9' },
        { name: 'Dr. Sneha Reddy', specialty: 'Dermatology', exp: '8 yrs', img: 'https://images.unsplash.com/photo-1594824476967-48c8b964dc31?w=300&h=350&fit=crop&crop=face', rating: '4.7' },
    ];
    return (
        <section style={{ padding: '6rem 1.5rem', background: 'var(--light)' }}>
            <div ref={ref} style={{ maxWidth: 1200, margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: 2 }}>🩺 Our Doctors</span>
                        <h2 className="section-title" style={{ marginTop: 12 }}>Meet Our Verified Specialists</h2>
                        <p className="section-subtitle" style={{ margin: '16px auto 0' }}>Every doctor is double-verified through Medical Council + manual admin review.</p>
                    </motion.div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                    {doctors.map((d, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.12 }}
                            whileHover={{ y: -8 }}
                            style={{ background: 'white', borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                            <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
                                <img src={d.img} alt={d.name} loading="lazy"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
                                    onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
                                    onMouseLeave={e => e.target.style.transform = 'scale(1)'} />
                                <div style={{
                                    position: 'absolute', top: 12, right: 12,
                                    background: '#10B981', color: 'white', borderRadius: 100, padding: '4px 10px',
                                    fontSize: '0.7rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4
                                }}>
                                    <Check size={12} /> Verified
                                </div>
                            </div>
                            <div style={{ padding: '1.5rem' }}>
                                <h4 style={{ fontFamily: 'Outfit', fontWeight: 700, fontSize: '1.1rem', marginBottom: 4 }}>{d.name}</h4>
                                <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem', marginBottom: 8 }}>{d.specialty}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--gray)', fontSize: '0.85rem' }}>{d.exp} experience</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{d.rating}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ====== MAIN LANDING ====== */
function Landing() {
    return (
        <div id="landing-page">
            <Navbar />
            <Hero />
            <MarqueeTrust />
            <GovtPartners />
            <StatsBar />
            <Features />
            <EcgDivider />
            <VoiceTriageDemo />
            <DoctorsShowcase />
            <HowItWorks />
            <AISection />
            <EcgDivider />
            <GovtInitiative />
            <ImageBanner />
            <PhotoGallery />
            <BeforeAfter />
            <Testimonials />
            <EcgDivider />
            <ConnectivitySection />
            <Impact />
            <Footer />
        </div>
    );
}

export default Landing;
