import React, { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { detectSkinDisease, fetchSkinReport, checkSkinServerHealth } from '../services/skinDetect';
import {
    Camera, Upload, Loader2, AlertTriangle, ArrowLeft,
    ShieldAlert, ChevronRight, RefreshCw, Wifi, WifiOff,
    HeartPulse, Scan, Image as ImageIcon, X, FileText,
    CheckCircle2, AlertCircle
} from 'lucide-react';

const URGENCY_STYLES = {
    low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
    medium: { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-800' },
    high: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
    critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
};

/* ── Instant Disease Info (no API needed) ─────────────────────────────────── */
const DISEASE_INFO = {
    "Basal Cell Carcinoma": {
        what: "Most common type of skin cancer. Grows slowly on sun-exposed areas like face, neck, and arms. Rarely spreads to other body parts.",
        causes: ["Long-term sun exposure (UV rays)", "Fair skin / light complexion", "History of sunburns", "Age above 50 years", "Weakened immune system"],
        symptoms: ["Pearly or waxy bump on skin", "Flat, flesh-colored or brown scar-like lesion", "Bleeding or scabbing sore that heals and returns", "Small blood vessels visible on surface"],
        treatment: ["Surgical removal (most effective)", "Mohs surgery for facial lesions", "Cryotherapy (freezing)", "Topical medications", "Radiation therapy in some cases"],
        prevention: ["Use sunscreen SPF 30+ daily", "Avoid midday sun (10am–4pm)", "Wear protective clothing & hats", "Regular skin self-examinations", "Annual dermatologist checkup"],
        prognosis: "Excellent if caught early. 99%+ cure rate with proper treatment. Regular follow-up needed as recurrence is possible."
    },
    "Melanoma": {
        what: "Most dangerous type of skin cancer. Develops from pigment-producing cells (melanocytes). Can spread quickly to other organs if not treated early.",
        causes: ["Intense UV exposure & sunburns", "Multiple or unusual moles", "Family history of melanoma", "Fair skin, red or blonde hair", "Weakened immune system"],
        symptoms: ["Asymmetric mole (irregular shape)", "Uneven or blurred borders", "Multiple colors (brown, black, red, white, blue)", "Diameter larger than 6mm (pencil eraser)", "Evolving size, shape, or color over time"],
        treatment: ["Surgical excision with wide margins", "Sentinel lymph node biopsy", "Immunotherapy (advanced cases)", "Targeted therapy", "Chemotherapy or radiation if spread"],
        prevention: ["Avoid tanning beds completely", "Apply broad-spectrum sunscreen daily", "Check skin monthly (ABCDE rule)", "See dermatologist for suspicious moles", "Wear UV-protective clothing"],
        prognosis: "Early stage (localized): 99% 5-year survival. Later stages have lower survival rates. Early detection is critical."
    }
};

/* ── Simple Markdown Renderer ─────────────────────────────────────────────── */
function SimpleMarkdown({ text }) {
    if (!text) return null;
    const lines = text.split('\n');
    const elements = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) { elements.push(<br key={i} />); continue; }

        // Bold headings (like "Name:", "Definition:", etc.)
        if (/^[A-Z][a-zA-Z\s]+:/.test(trimmed)) {
            const [label, ...rest] = trimmed.split(':');
            elements.push(
                <div key={i} className="mb-2">
                    <span className="font-black text-gray-800 text-sm">{label}:</span>
                    <span className="text-gray-600 text-sm ml-1">{rest.join(':').trim()}</span>
                </div>
            );
            continue;
        }

        // Bullet points
        if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
            elements.push(
                <div key={i} className="flex gap-2 ml-2 mb-1">
                    <span className="text-teal-500 mt-0.5">•</span>
                    <span className="text-gray-600 text-sm">{trimmed.slice(2)}</span>
                </div>
            );
            continue;
        }

        // Headers
        if (trimmed.startsWith('# ')) {
            elements.push(<h3 key={i} className="text-lg font-black text-gray-900 mt-4 mb-2">{trimmed.slice(2)}</h3>);
            continue;
        }

        // Regular text
        elements.push(<p key={i} className="text-gray-600 text-sm mb-1">{trimmed}</p>);
    }

    return <div>{elements}</div>;
}

/* ══════════════════════════════════════════════════════════════════════════════
   SKIN SCAN PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function SkinScan() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);

    // ── State ────────────────────────────────────────────────────────────────
    const [imagePreview, setImagePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const [reportText, setReportText] = useState(null);
    const [reportLoading, setReportLoading] = useState(false);
    const [serverOnline, setServerOnline] = useState(null);

    // ── Check server health on mount ─────────────────────────────────────────
    React.useEffect(() => {
        checkSkinServerHealth().then(h => setServerOnline(!!h?.status));
    }, []);

    // ── File Upload ──────────────────────────────────────────────────────────
    const handleFileSelect = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file (JPG, PNG, etc.)');
            return;
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setResult(null);
        setReportText(null);
        setError(null);
    };

    // ── Camera ───────────────────────────────────────────────────────────────
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 640, height: 480 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
            setCameraActive(true);
            setError(null);
        } catch (err) {
            setError('Camera access denied. Please allow camera permission or use file upload.');
        }
    }, []);

    const stopCamera = useCallback(() => {
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
            videoRef.current.srcObject = null;
        }
        setCameraActive(false);
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], 'skin_capture.jpg', { type: 'image/jpeg' });
                setImageFile(file);
                setImagePreview(canvas.toDataURL('image/jpeg'));
                setResult(null);
                setReportText(null);
                stopCamera();
            }
        }, 'image/jpeg', 0.9);
    }, [stopCamera]);

    // ── Analyze ──────────────────────────────────────────────────────────────
    const handleAnalyze = async () => {
        if (!imageFile) return;
        setIsAnalyzing(true);
        setError(null);
        setResult(null);
        setReportText(null);

        try {
            const res = await detectSkinDisease(imageFile);
            setResult(res);
        } catch (err) {
            setError(err.message || 'Detection failed. Please try again.');
        }
        setIsAnalyzing(false);
    };

    // ── Load Report ──────────────────────────────────────────────────────────
    const handleLoadReport = async () => {
        if (!result?.disease) return;
        setReportLoading(true);
        try {
            const report = await fetchSkinReport(result.disease);
            setReportText(report || 'Report could not be generated. Please consult a dermatologist.');
        } catch {
            setReportText('Report generation failed. Please try again later.');
        }
        setReportLoading(false);
    };

    // ── Reset ────────────────────────────────────────────────────────────────
    const handleReset = () => {
        setImagePreview(null);
        setImageFile(null);
        setResult(null);
        setReportText(null);
        setError(null);
        stopCamera();
    };

    const urgencyStyle = result ? URGENCY_STYLES[result.urgency] || URGENCY_STYLES.medium : null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* ═══ NAVIGATION ═══ */}
            <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-50 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="w-10 h-10 bg-rose-600 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-100">
                        <Scan className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-gray-900 text-sm md:text-lg tracking-tight">Skin Disease Scanner</h1>
                        <p className="text-[10px] md:text-xs font-bold text-rose-600 uppercase tracking-widest">AI-Powered Detection</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${serverOnline ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                    {serverOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                    {serverOnline ? 'AI Live' : 'Offline'}
                </div>
            </nav>

            <main className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
                {/* ═══ INSTRUCTIONS ═══ */}
                {!imagePreview && !cameraActive && (
                    <div className="bg-gradient-to-br from-rose-500 via-rose-600 to-pink-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-rose-100">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-2">🔬 Skin Disease Detection</h2>
                            <p className="text-rose-100 text-sm font-medium leading-relaxed mb-4">
                                Take a clear photo of the affected skin area or upload an existing image. Our AI will analyze it for potential skin conditions.
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Basal Cell Carcinoma</span>
                                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Melanoma</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ CAPTURE / UPLOAD ═══ */}
                {!imagePreview && !cameraActive && (
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={startCamera}
                            className="bg-white border-2 border-dashed border-rose-200 rounded-3xl p-8 flex flex-col items-center gap-4 hover:border-rose-400 hover:shadow-xl hover:shadow-rose-50 transition-all group">
                            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Camera className="w-8 h-8 text-rose-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-gray-900 text-sm">Take Photo</p>
                                <p className="text-[10px] text-gray-400 font-bold">Use camera</p>
                            </div>
                        </button>

                        <button onClick={() => fileInputRef.current?.click()}
                            className="bg-white border-2 border-dashed border-indigo-200 rounded-3xl p-8 flex flex-col items-center gap-4 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-50 transition-all group">
                            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-gray-900 text-sm">Upload Image</p>
                                <p className="text-[10px] text-gray-400 font-bold">From gallery</p>
                            </div>
                        </button>
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />
                    </div>
                )}

                {/* ═══ CAMERA VIEW ═══ */}
                {cameraActive && (
                    <div className="bg-black rounded-3xl overflow-hidden relative shadow-xl">
                        <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-[4/3] object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-center gap-4">
                            <button onClick={stopCamera} className="p-3 bg-white/20 backdrop-blur rounded-full text-white hover:bg-white/30">
                                <X className="w-6 h-6" />
                            </button>
                            <button onClick={capturePhoto}
                                className="w-16 h-16 bg-white rounded-full border-4 border-rose-500 shadow-lg hover:scale-110 transition-transform flex items-center justify-center">
                                <div className="w-12 h-12 bg-rose-500 rounded-full" />
                            </button>
                            <div className="w-12" /> {/* spacer */}
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                )}

                {/* ═══ IMAGE PREVIEW ═══ */}
                {imagePreview && (
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="relative">
                            <img src={imagePreview} alt="Skin image preview" className="w-full aspect-square object-cover" />
                            <button onClick={handleReset}
                                className="absolute top-3 right-3 p-2.5 bg-black/50 backdrop-blur text-white rounded-xl hover:bg-black/70 transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {!result && (
                            <div className="p-5">
                                <button onClick={handleAnalyze} disabled={isAnalyzing}
                                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-rose-100 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                    {isAnalyzing ? (
                                        <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing with AI...</>
                                    ) : (
                                        <><Scan className="w-5 h-5" /> ANALYZE SKIN CONDITION</>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ ERROR ═══ */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-700">{error}</p>
                            <button onClick={handleReset} className="text-xs text-red-500 font-bold mt-1 underline">Try Again</button>
                        </div>
                    </div>
                )}

                {/* ═══ RESULT CARD ═══ */}
                {result && (
                    <div className={`${urgencyStyle.bg} ${urgencyStyle.border} border rounded-3xl p-6 shadow-sm`}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">AI Detection Result</p>
                                <h3 className="text-2xl font-black text-gray-900">{result.disease}</h3>
                            </div>
                            <span className={`${urgencyStyle.badge} px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider`}>
                                {result.urgency === 'critical' ? '🚨' : '⚠️'} {result.urgency}
                            </span>
                        </div>

                        {/* Confidence Bar */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-gray-500">Confidence</span>
                                <span className="text-sm font-black text-gray-800">{(result.confidence * 100).toFixed(1)}%</span>
                            </div>
                            <div className="h-2 bg-white/80 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${result.confidence > 0.8 ? 'bg-green-500' : result.confidence > 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${result.confidence * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* All Predictions */}
                        {result.all_predictions?.length > 1 && (
                            <div className="mb-4 space-y-2">
                                {result.all_predictions.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-xl">
                                        <span className="text-xs font-bold text-gray-700">{p.disease}</span>
                                        <span className="text-xs font-black text-gray-500">{(p.confidence * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Specialist */}
                        <div className="bg-white/60 rounded-2xl p-4 mb-4 flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                                <HeartPulse className="w-5 h-5 text-rose-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recommended Specialist</p>
                                <p className="text-sm font-black text-gray-800">{result.specialist}</p>
                            </div>
                        </div>

                        {/* ═══ INSTANT DISEASE INFO ═══ */}
                        {DISEASE_INFO[result.disease] && (() => {
                            const info = DISEASE_INFO[result.disease];
                            return (
                                <div className="mt-4 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disease Information</p>
                                    </div>

                                    {/* What is it */}
                                    <div>
                                        <p className="text-xs font-black text-gray-800 mb-1">📋 What is it?</p>
                                        <p className="text-xs text-gray-600 leading-relaxed">{info.what}</p>
                                    </div>

                                    {/* Causes */}
                                    <div>
                                        <p className="text-xs font-black text-gray-800 mb-1">⚡ Common Causes</p>
                                        <div className="space-y-1">
                                            {info.causes.map((c, i) => (
                                                <div key={i} className="flex items-start gap-2 ml-1">
                                                    <span className="text-rose-400 mt-0.5 text-[10px]">•</span>
                                                    <span className="text-xs text-gray-600">{c}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Symptoms */}
                                    <div>
                                        <p className="text-xs font-black text-gray-800 mb-1">🔍 Symptoms to Watch</p>
                                        <div className="space-y-1">
                                            {info.symptoms.map((s, i) => (
                                                <div key={i} className="flex items-start gap-2 ml-1">
                                                    <span className="text-amber-400 mt-0.5 text-[10px]">•</span>
                                                    <span className="text-xs text-gray-600">{s}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Treatment */}
                                    <div>
                                        <p className="text-xs font-black text-gray-800 mb-1">💊 Treatment Options</p>
                                        <div className="space-y-1">
                                            {info.treatment.map((t, i) => (
                                                <div key={i} className="flex items-start gap-2 ml-1">
                                                    <span className="text-green-400 mt-0.5 text-[10px]">•</span>
                                                    <span className="text-xs text-gray-600">{t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prevention */}
                                    <div>
                                        <p className="text-xs font-black text-gray-800 mb-1">🛡️ Prevention</p>
                                        <div className="space-y-1">
                                            {info.prevention.map((p, i) => (
                                                <div key={i} className="flex items-start gap-2 ml-1">
                                                    <span className="text-blue-400 mt-0.5 text-[10px]">•</span>
                                                    <span className="text-xs text-gray-600">{p}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Prognosis */}
                                    <div className="bg-green-50 rounded-xl p-3">
                                        <p className="text-xs font-black text-green-800 mb-1">✅ Prognosis</p>
                                        <p className="text-xs text-green-700 leading-relaxed">{info.prognosis}</p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Actions */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <button onClick={handleReset}
                                className="py-3 bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs rounded-2xl border border-gray-200 flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4" /> Scan Again
                            </button>
                            <Link to="/doctors"
                                className="py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-rose-100 flex items-center justify-center gap-2">
                                Find Doctor <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                )}

                {/* ═══ DISCLAIMER ═══ */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-amber-800 mb-1">Medical Disclaimer</p>
                        <p className="text-[10px] text-amber-700 leading-relaxed">
                            This AI tool is for informational purposes only and is NOT a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified dermatologist for skin conditions.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
