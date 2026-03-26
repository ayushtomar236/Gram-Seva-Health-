import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Activity, ChevronRight, ChevronLeft, CheckCircle2, RefreshCw, Heart } from 'lucide-react';

const initialFormData = {
    // 1. Basic Bio
    age: 30,
    gender: 'male',
    height: 170, // cm
    weight: 70,  // kg
    
    // 2. Daily Log
    steps: 8000,
    exercise: 150, // mins/week
    sedentary: 6,  // hours/day
    sleep: 7.5,
    sleepQuality: 7, // 1-10
    water: 3, // Liters

    // 3. Medical / Clinical
    hr: 72,
    sysBp: 120,
    diaBp: 80,
    spo2: 98,
    bodyFat: 18,
    fbs: 90, // mg/dL
    hba1c: 5.4, // %
    hdl: 65,
    ldl: 90,
    trigly: 120,

    // 4. Wellbeing
    stress: 4, // 1-10 (lower is better)
    clarity: 8, // 1-10
    smoking: 'no',
    alcohol: 'no'
};

export default function HealthScoreCalculator({ isOpen, onClose, onScoreCalculated }) {
    const [step, setStep] = useState(1);
    
    // Form State
    const [formData, setFormData] = useState(initialFormData);

    const handleReset = () => {
        setFormData(initialFormData);
        setStep(1);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /**
     * Normalizes a value between 0 and 1.
     * invert=true means lower values are better.
     * invert=false means higher values are better.
     */
    const normalize = (val, min, max, invert = false) => {
        let norm = (val - min) / (max - min);
        norm = Math.max(0, Math.min(1, norm)); // Clamp between 0 and 1
        return invert ? 1 - norm : norm;
    };

    /**
     * Normalizes based on distance from an ideal target.
     * 1 is perfect, drops to 0 at max deviation.
     */
    const targetNormalize = (val, target, maxDev) => {
        const dev = Math.abs(val - target);
        return normalize(dev, 0, maxDev, true);
    };

    const calculateScore = () => {
        // BMI = weight(kg) / (height(m))^2
        const heightM = formData.height / 100;
        const bmi = formData.weight / (heightM * heightM);
        
        // --- 1. Physical & Physiological (25%) ---
        const bmiScore = targetNormalize(bmi, 22, 10); // target 22, worst at 12 or 32
        const hrScore = targetNormalize(formData.hr, 70, 40); // target 70, worst <30 or >110
        const sysScore = targetNormalize(formData.sysBp, 115, 50); // target 115
        const diaScore = targetNormalize(formData.diaBp, 75, 30); // target 75
        const spo2Score = normalize(formData.spo2, 90, 100, false);
        const fatTarget = formData.gender === 'male' ? 15 : 24;
        const fatScore = targetNormalize(formData.bodyFat, fatTarget, 15);
        
        const physicalScore = (bmiScore * 0.2 + hrScore * 0.15 + sysScore * 0.15 + diaScore * 0.15 + spo2Score * 0.2 + fatScore * 0.15) * 100;

        // --- 2. Lifestyle & Habits (30%) ---
        const stepScore = normalize(formData.steps, 2000, 10000, false);
        const exScore = normalize(formData.exercise, 0, 300, false);
        const sedScore = normalize(formData.sedentary, 4, 12, true); // lower is better
        const slpScore = targetNormalize(formData.sleep, 8, 4); // target 8 hrs
        const slpQualScore = normalize(formData.sleepQuality, 1, 10, false);
        const waterScore = targetNormalize(formData.water, 3.5, 2.5); // target ~3.5L

        const lifestyleScore = (stepScore * 0.2 + exScore * 0.2 + sedScore * 0.15 + slpScore * 0.15 + slpQualScore * 0.15 + waterScore * 0.15) * 100;

        // --- 3. Clinical Markers (30%) ---
        const fbsScore = targetNormalize(formData.fbs, 85, 50); // Target 85 mg/dL
        const hba1cScore = targetNormalize(formData.hba1c, 5.0, 3.0);
        const hdlScore = normalize(formData.hdl, 30, 80, false); // higher is better
        const ldlScore = normalize(formData.ldl, 50, 160, true); // lower is better
        const trigScore = normalize(formData.trigly, 50, 250, true); // lower is better

        const clinicalScore = (fbsScore * 0.2 + hba1cScore * 0.2 + hdlScore * 0.2 + ldlScore * 0.2 + trigScore * 0.2) * 100;

        // --- 4. Wellbeing & Subjective (15%) ---
        const stressScore = normalize(formData.stress, 1, 10, true); // lower is better
        const clarityScore = normalize(formData.clarity, 1, 10, false); // higher is better
        const smokeScore = formData.smoking === 'no' ? 1 : 0;
        const alcoholScore = formData.alcohol === 'no' ? 1 : 0.5;

        const wellbeingScore = (stressScore * 0.3 + clarityScore * 0.3 + smokeScore * 0.2 + alcoholScore * 0.2) * 100;

        // Final Aggregate (Weighted Avg)
        const finalScore = Math.round(
            (physicalScore * 0.25) + 
            (lifestyleScore * 0.30) + 
            (clinicalScore * 0.30) + 
            (wellbeingScore * 0.15)
        );

        return { finalScore, physicalScore, lifestyleScore, clinicalScore, wellbeingScore, bmi };
    };

    const handleCalculate = () => {
        const result = calculateScore();
        onScoreCalculated(result.finalScore);
        setStep(5); // Show Result Step
    };

    if (!isOpen) return null;

    const InputLabel = ({ title, children }) => (
        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 flex flex-col gap-1.5">
            {title}
            {children}
        </label>
    );

    const TextInput = ({ name, type = "number", placeholder }) => (
        <input 
            type={type} 
            name={name} 
            value={formData[name]} 
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black text-gray-700 outline-none focus:ring-2 focus:ring-teal-100 transition"
        />
    );

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
                
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }} 
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center"><Activity className="w-5 h-5 text-teal-600" /></div>
                            <div>
                                <h3 className="font-black text-gray-900 tracking-tight">Health Score Calculator</h3>
                                <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Weighted Clinical Analysis</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-xs font-black text-gray-400 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl transition uppercase tracking-widest">
                                <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Reset</span>
                            </button>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-xl transition">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex px-6 pt-4 gap-2 shrink-0">
                        {[1,2,3,4,5].map(s => (
                            <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-teal-500' : 'bg-gray-100'}`} />
                        ))}
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        
                        {/* 1. Basic Bio */}
                        {step === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <h4 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2"><Heart className="w-5 h-5 text-rose-500" /> 1. Physiology & Vitals</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                    <InputLabel title="Age"><TextInput name="age" /></InputLabel>
                                    <InputLabel title="Gender">
                                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black text-gray-700 outline-none">
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                        </select>
                                    </InputLabel>
                                    <InputLabel title="Height (cm)"><TextInput name="height" /></InputLabel>
                                    <InputLabel title="Weight (kg)"><TextInput name="weight" /></InputLabel>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InputLabel title="Resting HR (bpm)"><TextInput name="hr" /></InputLabel>
                                    <InputLabel title="Sys BP (mmHg)"><TextInput name="sysBp" /></InputLabel>
                                    <InputLabel title="Dia BP (mmHg)"><TextInput name="diaBp" /></InputLabel>
                                    <InputLabel title="SpO2 (%)"><TextInput name="spo2" /></InputLabel>
                                    <InputLabel title="Body Fat (%)"><TextInput name="bodyFat" /></InputLabel>
                                </div>
                            </motion.div>
                        )}

                        {/* 2. Daily Log */}
                        {step === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <h4 className="text-lg font-black text-gray-900 mb-6 text-blue-600">2. Lifestyle & Activity Habits</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InputLabel title="Daily Steps"><TextInput name="steps" /></InputLabel>
                                    <InputLabel title="Exercise (mins/wk)"><TextInput name="exercise" /></InputLabel>
                                    <InputLabel title="Sedentary (hrs/day)"><TextInput name="sedentary" /></InputLabel>
                                    <InputLabel title="Sleep (hrs/night)"><TextInput name="sleep" /></InputLabel>
                                    <InputLabel title="Sleep Quality (1-10)"><TextInput name="sleepQuality" /></InputLabel>
                                    <InputLabel title="Water (Liters/day)"><TextInput name="water" /></InputLabel>
                                </div>
                            </motion.div>
                        )}

                        {/* 3. Medical */}
                        {step === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <h4 className="text-lg font-black text-gray-900 mb-6 text-purple-600">3. Clinical & Metabolic Markers</h4>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <InputLabel title="Fasting Sugar (mg/dL)"><TextInput name="fbs" /></InputLabel>
                                    <InputLabel title="HbA1c (%)"><TextInput name="hba1c" /></InputLabel>
                                    <InputLabel title="HDL (mg/dL)"><TextInput name="hdl" /></InputLabel>
                                    <InputLabel title="LDL (mg/dL)"><TextInput name="ldl" /></InputLabel>
                                    <InputLabel title="Triglycerides"><TextInput name="trigly" /></InputLabel>
                                </div>
                            </motion.div>
                        )}

                        {/* 4. Subjective */}
                        {step === 4 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <h4 className="text-lg font-black text-gray-900 mb-6 text-emerald-600">4. Mental & Subjective Well-being</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <InputLabel title="Stress Level (1-10)"><TextInput name="stress" /></InputLabel>
                                    <InputLabel title="Mental Clarity (1-10)"><TextInput name="clarity" /></InputLabel>
                                    <InputLabel title="Smoking Habits">
                                        <select name="smoking" value={formData.smoking} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black text-gray-700 outline-none">
                                            <option value="no">Non-Smoker</option>
                                            <option value="yes">Smoker</option>
                                        </select>
                                    </InputLabel>
                                    <InputLabel title="Alcohol Usage">
                                        <select name="alcohol" value={formData.alcohol} onChange={handleChange} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black text-gray-700 outline-none">
                                            <option value="no">Rarely / Never</option>
                                            <option value="yes">Frequently</option>
                                        </select>
                                    </InputLabel>
                                </div>
                            </motion.div>
                        )}

                        {/* 5. Result */}
                        {step === 5 && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                                <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90 absolute inset-0">
                                        <circle cx="80" cy="80" r="70" fill="none" stroke="#f3f4f6" strokeWidth="12" />
                                        <circle cx="80" cy="80" r="70" fill="none" stroke="#0d9488" strokeWidth="12"
                                            strokeDasharray={2 * Math.PI * 70}
                                            strokeDashoffset={2 * Math.PI * 70 * (1 - calculateScore().finalScore / 100)}
                                            strokeLinecap="round" className="transition-all duration-1000 delay-300" />
                                    </svg>
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl font-black text-gray-900">{calculateScore().finalScore}</span>
                                        <span className="text-[10px] font-black uppercase text-gray-400">OUT OF 100</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-rose-50 p-4 rounded-2xl text-left border border-rose-100">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-rose-500 mb-1">Physical</p>
                                        <p className="text-xl font-black text-rose-700">{calculateScore().physicalScore.toFixed(0)}<span className="text-xs">/100</span></p>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-2xl text-left border border-blue-100">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mb-1">Lifestyle</p>
                                        <p className="text-xl font-black text-blue-700">{calculateScore().lifestyleScore.toFixed(0)}<span className="text-xs">/100</span></p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-2xl text-left border border-purple-100">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-purple-500 mb-1">Clinical</p>
                                        <p className="text-xl font-black text-purple-700">{calculateScore().clinicalScore.toFixed(0)}<span className="text-xs">/100</span></p>
                                    </div>
                                    <div className="bg-emerald-50 p-4 rounded-2xl text-left border border-emerald-100">
                                        <p className="text-[10px] uppercase font-black tracking-widest text-emerald-500 mb-1">Wellbeing</p>
                                        <p className="text-xl font-black text-emerald-700">{calculateScore().wellbeingScore.toFixed(0)}<span className="text-xs">/100</span></p>
                                    </div>
                                </div>
                                <button onClick={onClose} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-black tracking-widest text-sm transition shadow-xl">
                                    SAVE & CLOSE
                                </button>
                            </motion.div>
                        )}
                    </div>

                    {/* Footer Nav */}
                    {step < 5 && (
                        <div className="p-6 border-t border-gray-100 flex justify-between shrink-0 bg-gray-50/50 rounded-b-3xl">
                            {step > 1 ? (
                                <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 font-bold text-gray-500 flex items-center gap-2 hover:bg-white rounded-xl transition">
                                    <ChevronLeft className="w-4 h-4" /> BACK
                                </button>
                            ) : <div></div>}
                            
                            {step < 4 ? (
                                <button onClick={() => setStep(s => s + 1)} className="px-6 py-3 bg-gray-900 hover:bg-black text-white font-black rounded-xl shadow-lg transition flex items-center gap-2">
                                    NEXT <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <button onClick={handleCalculate} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl shadow-lg shadow-teal-200 transition flex items-center gap-2">
                                   <CheckCircle2 className="w-4 h-4" /> CALCULATE SCORE
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
