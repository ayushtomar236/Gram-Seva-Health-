import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, FileText, Pill, Download, Share2, Phone, CheckCircle2, Clock, User } from 'lucide-react';

export default function Prescription() {
    const { id } = useParams();
    const [prescription, setPrescription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            // Try to load by consultation_id first
            let { data } = await supabase
                .from('prescriptions')
                .select('*, consultations(symptoms, channel_name, created_at, doctors(name, specialization), patients(name, age, gender, village))')
                .eq('consultation_id', id)
                .single();

            // If not found by consultation_id, try by prescription id directly
            if (!data) {
                const res = await supabase
                    .from('prescriptions')
                    .select('*, consultations(symptoms, channel_name, created_at, doctors(name, specialization), patients(name, age, gender, village))')
                    .eq('id', id)
                    .single();
                data = res.data;
            }

            setPrescription(data);
            setLoading(false);
        };
        load();
    }, [id]);

    const shareWhatsApp = () => {
        if (!prescription) return;
        const meds = (prescription.medicines || [])
            .map((m, i) => `${i + 1}. ${m.name} — ${m.dosage || ''} — ${m.duration || ''}`)
            .join('\n');

        const text = `🏥 *GramSeva Health — Digital Prescription*\n\n` +
            `👨‍⚕️ *Doctor:* Dr. ${prescription.consultations?.doctors?.name || 'Doctor'}\n` +
            `📋 *Specialization:* ${prescription.consultations?.doctors?.specialization || 'General'}\n` +
            `📅 *Date:* ${new Date(prescription.created_at).toLocaleDateString('en-IN')}\n\n` +
            `🔍 *Diagnosis:* ${prescription.diagnosis || 'N/A'}\n\n` +
            `💊 *Medicines:*\n${meds || 'None'}\n\n` +
            `📝 *Instructions:* ${prescription.instructions || 'N/A'}\n` +
            `🔄 *Follow-up:* ${prescription.follow_up || 'As needed'}\n\n` +
            `⚠️ _This is an AI-assisted preliminary prescription. Please consult a doctor in person if symptoms persist._`;

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const downloadPrescription = () => {
        if (!prescription) return;
        const meds = (prescription.medicines || [])
            .map((m, i) => `${i + 1}. ${m.name} - ${m.dosage || ''} - ${m.duration || ''}`)
            .join('\n');

        const content = [
            '═══════════════════════════════════════════',
            '       GRAMSEVA HEALTH — PRESCRIPTION',
            '═══════════════════════════════════════════',
            '',
            `Doctor: Dr. ${prescription.consultations?.doctors?.name || 'Doctor'}`,
            `Specialization: ${prescription.consultations?.doctors?.specialization || 'General'}`,
            `Date: ${new Date(prescription.created_at).toLocaleString('en-IN')}`,
            '',
            `Patient: ${prescription.consultations?.patients?.name || 'Patient'}`,
            `Age/Gender: ${prescription.consultations?.patients?.age || '-'} / ${prescription.consultations?.patients?.gender || '-'}`,
            `Village: ${prescription.consultations?.patients?.village || '-'}`,
            '',
            '───────────────────────────────────────────',
            `DIAGNOSIS: ${prescription.diagnosis || 'N/A'}`,
            '───────────────────────────────────────────',
            '',
            'MEDICINES:',
            meds || 'None prescribed',
            '',
            `INSTRUCTIONS: ${prescription.instructions || 'N/A'}`,
            `FOLLOW-UP: ${prescription.follow_up || 'As needed'}`,
            '',
            '═══════════════════════════════════════════',
            '  This is a digitally generated prescription',
            '  via GramSeva Health Telemedicine Platform',
            '═══════════════════════════════════════════',
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prescription_${new Date(prescription.created_at).toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center text-gray-400">
            <div className="text-center">
                <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Loading prescription...</p>
            </div>
        </div>
    );

    if (!prescription) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg font-bold">No prescription found</p>
                <p className="text-gray-400 text-sm mt-1">This consultation may not have a prescription yet.</p>
                <Link to="/dashboard" className="mt-4 inline-block text-teal-600 font-medium hover:underline">← Back to Dashboard</Link>
            </div>
        </div>
    );

    const meds = prescription.medicines || [];
    const doctorName = prescription.consultations?.doctors?.name || 'Doctor';
    const specialization = prescription.consultations?.doctors?.specialization || 'Specialist';
    const patientName = prescription.consultations?.patients?.name || 'Patient';

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
                <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition"><ArrowLeft className="w-5 h-5 text-gray-600" /></Link>
                <h1 className="font-bold text-gray-900 flex-1">Digital Prescription</h1>
                <div className="flex items-center gap-2">
                    <button onClick={shareWhatsApp}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition active:scale-95">
                        <Phone className="w-3.5 h-3.5" /> WhatsApp
                    </button>
                    <button onClick={downloadPrescription}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95">
                        <Download className="w-3.5 h-3.5" /> Download
                    </button>
                </div>
            </nav>

            <main className="max-w-2xl mx-auto p-6">
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-emerald-600 p-6 text-white">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                                <Pill className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="font-black text-xl">Digital Prescription</h2>
                                <p className="text-teal-100 text-sm">GramSeva Health Telemedicine</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-teal-200" />
                                <span><span className="text-teal-200">Doctor:</span> Dr. {doctorName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-teal-200" />
                                <span>{new Date(prescription.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Patient Info */}
                    {prescription.consultations?.patients && (
                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Patient</p>
                            <p className="font-bold text-gray-900">{patientName}</p>
                            <p className="text-xs text-gray-500">
                                {prescription.consultations.patients.age && `${prescription.consultations.patients.age} yrs`}
                                {prescription.consultations.patients.gender && ` • ${prescription.consultations.patients.gender}`}
                                {prescription.consultations.patients.village && ` • ${prescription.consultations.patients.village}`}
                            </p>
                        </div>
                    )}

                    <div className="p-6 space-y-6">
                        {/* Diagnosis */}
                        {prescription.diagnosis && (
                            <div>
                                <h3 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-teal-600" /> Diagnosis
                                </h3>
                                <p className="text-gray-700 bg-teal-50 border border-teal-100 rounded-xl p-4 font-medium">{prescription.diagnosis}</p>
                            </div>
                        )}

                        {/* Medicines */}
                        <div>
                            <h3 className="font-black text-gray-900 mb-3 text-sm uppercase tracking-wider flex items-center gap-2">
                                <Pill className="w-4 h-4 text-purple-600" /> Medicines ({meds.length})
                            </h3>
                            <div className="space-y-2">
                                {meds.map((m, i) => (
                                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900">{i + 1}. {m.name}</p>
                                            <p className="text-sm text-gray-500 mt-0.5">{m.dosage}{m.dosage && ' • '}{m.frequency || ''}</p>
                                        </div>
                                        {m.duration && (
                                            <span className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg font-bold border border-purple-100">{m.duration}</span>
                                        )}
                                    </div>
                                ))}
                                {meds.length === 0 && (
                                    <p className="text-gray-400 text-sm italic">No medicines prescribed</p>
                                )}
                            </div>
                        </div>

                        {/* Instructions */}
                        {prescription.instructions && (
                            <div>
                                <h3 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">📝 Instructions</h3>
                                <p className="text-gray-600 bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm leading-relaxed">{prescription.instructions}</p>
                            </div>
                        )}

                        {/* Follow-up */}
                        {prescription.follow_up && (
                            <div>
                                <h3 className="font-black text-gray-900 mb-2 text-sm uppercase tracking-wider">🔄 Follow-up</h3>
                                <p className="text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm">{prescription.follow_up}</p>
                            </div>
                        )}

                        {/* Share Actions */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={shareWhatsApp}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition active:scale-95 shadow-lg shadow-green-600/20">
                                <Phone className="w-4 h-4" /> Share on WhatsApp
                            </button>
                            <button onClick={downloadPrescription}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition active:scale-95">
                                <Download className="w-4 h-4" /> Download
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center pt-2">
                            ⚠️ This is a digitally generated prescription via GramSeva Health. Consult a doctor in person if symptoms persist.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
