import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analyzeSymptoms, fetchReport, checkServerHealth } from '../services/aiTriage';
import { useLanguage } from '../services/LanguageContext';
import { useSpeechToText, useTextToSpeech } from '../hooks/useSpeech';
import {
    Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft, BrainCircuit, AlertTriangle, Sparkles,
    ChevronRight, Loader2, Wifi, WifiOff, Activity, ShieldAlert,
    Stethoscope, Info, AlertCircle, ChevronDown, ChevronUp, FileText,
    Languages
} from 'lucide-react';

const urgencyColors = {
    low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
};

/* Simple markdown renderer — handles headings, bold, bullets, and line breaks */
function SimpleMarkdown({ text }) {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];
    let inList = false;
    let listItems = [];

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`list-${elements.length}`} className="list-disc list-inside space-y-1 mb-3 text-sm text-gray-700 ml-2">
                    {listItems.map((li, i) => <li key={i} dangerouslySetInnerHTML={{ __html: boldify(li) }} />)}
                </ul>
            );
            listItems = [];
            inList = false;
        }
    };

    const boldify = (str) =>
        str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) { flushList(); elements.push(<div key={`br-${i}`} className="h-2" />); continue; }

        // Headings
        if (line.startsWith('# ')) {
            flushList();
            elements.push(<h2 key={i} className="text-xl font-bold text-gray-900 mt-5 mb-2 border-b border-gray-200 pb-2">{line.slice(2)}</h2>);
        } else if (line.startsWith('## ')) {
            flushList();
            elements.push(<h3 key={i} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.slice(3)}</h3>);
        } else if (line.startsWith('### ')) {
            flushList();
            elements.push(<h4 key={i} className="text-base font-semibold text-gray-800 mt-3 mb-1">{line.slice(4)}</h4>);
        } else if (/^\d+\.\s/.test(line)) {
            // Numbered heading-like lines (e.g. "1. Name of the Disease")
            flushList();
            elements.push(
                <h3 key={i} className="text-base font-bold text-teal-700 mt-4 mb-2 flex items-center gap-2">
                    <span className="w-7 h-7 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {line.match(/^(\d+)/)[1]}
                    </span>
                    {line.replace(/^\d+\.\s*/, '')}
                </h3>
            );
        } else if (line.startsWith('- ') || line.startsWith('• ') || line.startsWith('* ')) {
            inList = true;
            listItems.push(line.slice(2));
        } else if (line.startsWith('> ')) {
            flushList();
            elements.push(
                <blockquote key={i} className="border-l-4 border-teal-300 pl-4 py-2 my-2 bg-teal-50 rounded-r-lg text-sm text-gray-700 italic"
                    dangerouslySetInnerHTML={{ __html: boldify(line.slice(2)) }} />
            );
        } else {
            flushList();
            elements.push(
                <p key={i} className="text-sm text-gray-700 mb-2 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: boldify(line) }} />
            );
        }
    }
    flushList();
    return <div>{elements}</div>;
}

export default function SymptomInput() {
    const navigate = useNavigate();
    const { lang, t, toggleLang } = useLanguage();

    const [symptoms, setSymptoms] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [serverOnline, setServerOnline] = useState(null);
    const [showReport, setShowReport] = useState(false);
    const [reportLoading, setReportLoading] = useState(false);
    const [reportText, setReportText] = useState('');

    // Voice input
    const { transcript, isListening, error: voiceError, startListening, stopListening } = useSpeechToText(lang);
    // Voice output
    const { isSpeaking, speak, stopSpeaking } = useTextToSpeech(lang);

    useEffect(() => {
        if (transcript) {
            setSymptoms(prev => {
                // If the same exact transcript comes twice (interim), don't duplicate
                if (prev.endsWith(transcript)) return prev;
                return prev ? `${prev} ${transcript}` : transcript;
            });
        }
    }, [transcript]);

    useEffect(() => {
        checkServerHealth().then(h => setServerOnline(!!h?.status));
    }, []);

    const handleAnalyze = async () => {
        if (!symptoms.trim()) return;
        setLoading(true);
        setError('');
        setResult(null);
        setShowReport(false);
        setReportText('');

        try {
            const data = await analyzeSymptoms(symptoms);
            setResult(data);
            if (data.source === 'fallback') setServerOnline(false);

            // Phase 2: lazy-load detailed report in background
            if (data.disease && data.source !== 'fallback') {
                setReportLoading(true);
                fetchReport(data.disease).then(report => {
                    if (report) setReportText(report);
                    setReportLoading(false);
                });
            }
        } catch (err) {
            setError(err.message || 'Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const speakResult = () => {
        if (!result) return;
        const text = lang === 'hi'
            ? `AI निदान: ${result.disease}। Urgency: ${result.urgency}। विशेषज्ञ: ${result.specialist}। ${result.medical_info?.immediate_advice || ''}`
            : `AI Diagnosis: ${result.disease}. Urgency: ${result.urgency}. Recommended Specialist: ${result.specialist}. ${result.medical_info?.immediate_advice || ''}`;
        speak(text);
    };

    const handleProceed = () => {
        // Get current vitals & mood for the doctor
        const currentVitals = JSON.parse(localStorage.getItem('gramseva-vitals') || '{}');
        const currentMood = localStorage.getItem('gramseva-mood-' + new Date().toDateString()) || 'N/A';

        navigate('/doctors', {
            state: {
                specialist: result.specialist,
                urgency: result.urgency,
                symptoms,
                disease: result.disease,
                vitals: currentVitals,
                mood: currentMood
            },
        });
    };

    const uc = urgencyColors[result?.urgency] || urgencyColors.low;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav */}
            <nav className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
                <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div className="flex-1">
                    <h1 className="font-bold text-gray-900 text-sm md:text-base">{t('symptomAnalysis')}</h1>
                    <p className="text-xs text-gray-400">{t('poweredBy')}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleLang}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-full transition border border-purple-200">
                        <Languages className="w-3.5 h-3.5" />
                        {(t('switchLang') || 'Switch').toString()}
                    </button>
                    <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${serverOnline === null ? 'bg-gray-100 text-gray-500' :
                        serverOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                        {serverOnline === null ? (
                            <><Loader2 className="w-3 h-3 animate-spin" /> {t('connecting')}</>
                        ) : serverOnline ? (
                            <><Wifi className="w-3 h-3" /> {t('mlServerOnline')}</>
                        ) : (
                            <><WifiOff className="w-3 h-3" /> {t('offlineMode')}</>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
                {/* Emergency Banner */}
                {result?.emergency && (
                    <div className="bg-red-600 text-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                        <ShieldAlert className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-bold">{t('emergencyDetected')}</p>
                            <p className="text-sm text-red-100">{t('emergencyCall')}</p>
                        </div>
                    </div>
                )}

                {/* Input Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                            <BrainCircuit className="w-5 h-5 text-teal-600" />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">{t('describeSymptoms')}</p>
                            <p className="text-xs text-gray-400">{t('describeHint')}</p>
                        </div>
                    </div>

                    <div className="relative">
                        <textarea
                            value={symptoms}
                            onChange={(e) => setSymptoms(e.target.value)}
                            placeholder={t('symptomPlaceholder')}
                            rows={5}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none resize-none text-gray-800 text-sm min-h-[140px]"
                        />
                        {/* 🎤 Voice Input */}
                        <button
                            onClick={isListening ? stopListening : startListening}
                            className={`absolute right-3 bottom-3 p-2.5 rounded-xl transition shadow-sm ${isListening
                                ? 'bg-red-100 text-red-600 animate-pulse'
                                : 'bg-gray-100 text-gray-500 hover:bg-teal-50 hover:text-teal-600'
                                }`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>
                    </div>

                    {isListening && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-red-600 font-medium">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                            {lang === 'hi' ? 'बोलिए, मैं सुन रहा हूं...' : 'Listening, please speak...'}
                        </div>
                    )}

                    {/* Chips */}
                    <div className="flex flex-wrap gap-2 mt-4">
                        {t('chips').map(s => (
                            <button
                                key={s}
                                onClick={() => setSymptoms(p => p ? `${p}, ${s}` : s)}
                                className="px-3 py-1.5 bg-gray-50 hover:bg-teal-50 border border-gray-200 hover:border-teal-300 text-xs text-gray-600 hover:text-teal-700 rounded-full transition"
                            >
                                + {s}
                            </button>
                        ))}
                    </div>

                    {(error || voiceError) && (
                        <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 rounded-xl px-4 py-3 text-sm">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            {error || voiceError}
                        </div>
                    )}

                    <div className="flex gap-3 mt-5">
                        <button
                            onClick={handleAnalyze}
                            disabled={!symptoms.trim() || loading}
                            className="flex-1 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-teal-100"
                        >
                            {loading ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> {t('analyzing')}</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> {t('analyzeBtn')}</>
                            )}
                        </button>
                    </div>
                </div>

                {/* ═══ RESULTS ═══ */}
                {result && (
                    <div className="space-y-4 animate-in fade-in duration-500 slide-in-from-bottom-4">
                        {/* Diagnosis Header with Speech Output */}
                        <div className={`rounded-2xl border p-6 relative overflow-hidden ${uc.bg} ${uc.border} shadow-sm`}>
                            <div className="bg-white/40 absolute -right-4 -top-4 w-24 h-24 rounded-full" />
                            <div className="relative z-10 flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{t('aiDiagnosis')}</p>
                                    <h2 className={`text-2xl md:text-3xl font-black ${uc.text}`}>{result.disease}</h2>
                                </div>
                                <div className="text-right flex-shrink-0 space-y-2">
                                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black tracking-wide ${uc.badge} shadow-sm`}>
                                        <Activity className="w-3.5 h-3.5" />
                                        {(result?.urgency || 'low').toString().toUpperCase()}
                                    </div>
                                    {/* 🔊 Voice Result */}
                                    <div className="flex justify-end">
                                        <button
                                            onClick={isSpeaking ? stopSpeaking : speakResult}
                                            className={`p-2 rounded-xl transition ${isSpeaking
                                                ? 'bg-purple-100 text-purple-600 animate-pulse'
                                                : 'bg-white/80 text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                                                } shadow-sm border border-gray-100`}
                                        >
                                            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <div className="flex justify-between text-xs font-bold text-gray-400 mb-1.5 px-1 uppercase tracking-wide">
                                    <span>{t('confidence')}</span>
                                    <span className={uc.text}>{(result.confidence * 100).toFixed(1)}%</span>
                                </div>
                                <div className="h-2.5 bg-white/60 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ease-out ${result.confidence > 0.8 ? 'bg-green-500' :
                                            result.confidence > 0.6 ? 'bg-yellow-500' : 'bg-orange-500'
                                            }`}
                                        style={{ width: `${result.confidence * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 p-3 bg-white/50 rounded-xl flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${uc.bg} shadow-sm border ${uc.border}`}>
                                    <Stethoscope className={`w-5 h-5 ${uc.text}`} />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tight">Recommended Specialist</p>
                                    <p className={`text-sm font-bold ${uc.text}`}>{result.specialist}</p>
                                </div>
                                <button
                                    onClick={() => navigate('/doctors', { state: { specialist: result.specialist } })}
                                    className="ml-auto px-3 py-1.5 bg-white text-teal-600 text-xs font-bold rounded-lg border border-teal-100 hover:bg-teal-50 transition"
                                >
                                    {t('findSpecialist')}
                                </button>
                            </div>
                        </div>

                        {/* Top 3 */}
                        {result.top3?.length > 1 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">{t('otherPossibilities')}</p>
                                <div className="space-y-3">
                                    {result.top3.map((p, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black flex-shrink-0 ${i === 0 ? 'bg-teal-600 text-white' : 'bg-gray-50 text-gray-400'
                                                } shadow-sm`}>{i + 1}</span>
                                            <span className="text-sm font-bold text-gray-700 flex-1">{p.disease}</span>
                                            <div className="w-20 md:w-32 h-2 bg-gray-50 rounded-full overflow-hidden shadow-inner">
                                                <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${p.confidence * 100}%` }} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-400 w-10 text-right">{(p.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Medical Summary */}
                        {result.medical_info && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-9 h-9 bg-teal-50 rounded-xl flex items-center justify-center">
                                        <BrainCircuit className="w-5 h-5 text-teal-600" />
                                    </div>
                                    <p className="font-black text-gray-900 text-sm tracking-tight">{t('medicalSummary')}</p>
                                </div>

                                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-50">
                                    <p className="text-sm text-blue-900 leading-relaxed">{result.medical_info.description}</p>
                                </div>

                                <div className="bg-teal-50/50 rounded-xl p-4 border border-teal-50">
                                    <p className="text-xs font-black text-teal-600 mb-2 uppercase tracking-widest">{t('immediateAdvice')}</p>
                                    <p className="text-sm text-teal-900 font-medium leading-relaxed">{result.medical_info.immediate_advice}</p>
                                </div>

                                {result.medical_info.warning_signs?.length > 0 && (
                                    <div className="bg-red-50/50 rounded-xl p-4 border border-red-50">
                                        <p className="text-xs font-black text-red-600 mb-3 uppercase tracking-widest flex items-center gap-2">
                                            <AlertTriangle className="w-3.5 h-3.5" /> {t('warningSignsLabel')}
                                        </p>
                                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {result.medical_info.warning_signs.map((sign, i) => (
                                                <li key={i} className="text-sm text-red-900 flex items-center gap-2 font-medium bg-white/60 p-2 rounded-lg">
                                                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full flex-shrink-0" />
                                                    {sign}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <div className="flex items-start gap-2 text-gray-400 p-2">
                                    <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] leading-tight font-medium outline-none italic">{result.medical_info.disclaimer}</p>
                                </div>
                            </div>
                        )}

                        {/* DETAILED REPORT */}
                        {(reportLoading || reportText) && (
                            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => !reportLoading && setShowReport(!showReport)}
                                    className={`w-full px-6 py-5 flex items-center justify-between transition ${reportLoading ? 'cursor-wait' : 'hover:bg-gray-50'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm ${reportLoading ? 'bg-blue-50' : 'bg-indigo-50'} border ${reportLoading ? 'border-blue-100' : 'border-indigo-100'}`}>
                                            {reportLoading
                                                ? <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                                                : <FileText className="w-6 h-6 text-indigo-600" />
                                            }
                                        </div>
                                        <div className="text-left">
                                            <p className="font-black text-gray-900 text-sm tracking-tight uppercase">
                                                {reportLoading ? t('generatingReport') : t('detailedReport')}
                                            </p>
                                            <p className="text-xs text-gray-400 font-bold mt-0.5">
                                                {reportLoading ? t('reportSubtitle') : t('reportSections')}
                                            </p>
                                        </div>
                                    </div>
                                    {!reportLoading && (
                                        <div className="bg-gray-50 p-2 rounded-lg">
                                            {showReport ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                        </div>
                                    )}
                                </button>

                                {showReport && reportText && (
                                    <div className="px-6 pb-8 pt-4 border-t border-gray-50 bg-gray-50/30">
                                        <SimpleMarkdown text={reportText} />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* CTA */}
                        <button
                            onClick={handleProceed}
                            className="w-full py-4 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2full flex items-center justify-center gap-2 transition text-sm shadow-lg shadow-teal-200 uppercase tracking-widest"
                            style={{ borderRadius: '100px' }}
                        >
                            <Send className="w-5 h-5" />
                            Find {result.specialist}
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </main>

            {/* Bottom Disclaimer */}
            <div className="max-w-2xl mx-auto px-6 pb-12 text-center">
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">{t('footerDisclaimer')}</p>
            </div>
        </div>
    );
}
