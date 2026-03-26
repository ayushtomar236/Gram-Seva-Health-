import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Shield, Check, X, Users, BarChart2, HeartPulse, LogOut, Clock } from 'lucide-react';

export default function AdminPanel() {
    const navigate = useNavigate();
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [stats, setStats] = useState({ users: 0, doctors: 0, consultations: 0, emergencies: 0 });
    const [tab, setTab] = useState('pending');
    const [insights, setInsights] = useState({ diseases: {}, villages: {} });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            const { data: pd } = await supabase.from('doctors').select('*').eq('is_verified', false);
            setPendingDoctors(pd || []);

            const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            const { count: dCount } = await supabase.from('doctors').select('*', { count: 'exact', head: true });
            const { count: cCount } = await supabase.from('consultations').select('*', { count: 'exact', head: true });
            const { count: pCount } = await supabase.from('prescriptions').select('*', { count: 'exact', head: true });
            setStats({ users: uCount || 0, doctors: dCount || 0, consultations: cCount || 0, emergencies: pCount || 0 });

            // Fetch consultations and patients for insights
            const { data: consultations } = await supabase.from('consultations').select('ai_suggestion, patient_id');
            const { data: patients } = await supabase.from('patients').select('id, village');

            const diseaseMap = {};
            const villageMap = {};
            const patientToVillage = {};

            patients?.forEach(p => { if (p.village) patientToVillage[p.id] = p.village; });

            consultations?.forEach(c => {
                try {
                    const meta = JSON.parse(c.ai_suggestion);
                    if (meta.disease) {
                        diseaseMap[meta.disease] = (diseaseMap[meta.disease] || 0) + 1;
                        const vil = patientToVillage[c.patient_id] || 'Unknown';
                        villageMap[vil] = (villageMap[vil] || 0) + 1;
                    }
                } catch (e) {
                    // Fallback if not JSON
                    if (c.ai_suggestion && typeof c.ai_suggestion === 'string' && !c.ai_suggestion.startsWith('{')) {
                        diseaseMap[c.ai_suggestion] = (diseaseMap[c.ai_suggestion] || 0) + 1;
                    }
                }
            });

            setInsights({
                diseases: Object.entries(diseaseMap).sort((a, b) => b[1] - a[1]).slice(0, 5),
                villages: Object.entries(villageMap).sort((a, b) => b[1] - a[1])
            });
        } catch (err) {
            console.error('Admin load error:', err);
        }
    };

    const verifyDoctor = async (id, approve) => {
        if (approve) {
            await supabase.from('doctors').update({ is_verified: true, verified_at: new Date().toISOString() }).eq('id', id);
        } else {
            const reason = prompt('Rejection reason:');
            if (!reason) return;
            await supabase.from('doctors').update({ rejection_reason: reason }).eq('id', id);
        }
        loadData();
    };

    const handleLogout = async () => { await supabase.auth.signOut(); navigate('/'); };

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center"><HeartPulse className="w-5 h-5 text-white" /></div>
                    <div><h1 className="font-display font-bold text-gray-900">Admin Panel</h1><p className="text-xs text-gray-500">GramSeva Health</p></div>
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 text-gray-500 hover:text-red-500 text-sm"><LogOut className="w-4 h-4" /> Logout</button>
            </nav>

            <main className="max-w-6xl mx-auto p-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Users', value: stats.users, icon: Users, color: 'bg-teal-500' },
                        { label: 'Doctors', value: stats.doctors, icon: Shield, color: 'bg-blue-500' },
                        { label: 'Consultations', value: stats.consultations, icon: BarChart2, color: 'bg-purple-500' },
                        { label: 'Prescriptions', value: stats.emergencies, icon: Clock, color: 'bg-purple-500' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
                            <div className={`${s.color} w-12 h-12 rounded-xl flex items-center justify-center`}><s.icon className="w-6 h-6 text-white" /></div>
                            <div><p className="text-2xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-gray-200 mb-6">
                    <button onClick={() => setTab('pending')} className={`pb-3 px-2 text-sm font-bold transition-all ${tab === 'pending' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400'}`}>
                        Doctor Verifications ({pendingDoctors.length})
                    </button>
                    <button onClick={() => setTab('insights')} className={`pb-3 px-2 text-sm font-bold transition-all ${tab === 'insights' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400'}`}>
                        Health Intelligence
                    </button>
                </div>

                {/* Content */}
                {tab === 'pending' && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Pending Doctor Verifications</h2>
                        </div>

                        {pendingDoctors.length === 0 ? (
                            <div className="p-12 text-center text-gray-400">
                                <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                <p>All doctors verified ✓</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {pendingDoctors.map(d => (
                                    <div key={d.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition">
                                        <div>
                                            <p className="font-medium text-gray-900">Dr. {d.name}</p>
                                            <p className="text-sm text-gray-500">{d.specialization || 'General'} • {d.experience_years || 0} yrs</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => verifyDoctor(d.id, true)} className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-sm font-bold transition">Approve</button>
                                            <button onClick={() => verifyDoctor(d.id, false)} className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-sm font-bold transition">Reject</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'insights' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Disease Distribution */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-black text-gray-900 text-sm mb-5 uppercase tracking-wide">Most Frequent AI-Diagnoses</h3>
                            <div className="space-y-4">
                                {insights.diseases.length > 0 ? insights.diseases.map(([disease, count], i) => (
                                    <div key={i} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold text-gray-600">
                                            <span>{disease}</span>
                                            <span className="text-gray-400">{count} cases</span>
                                        </div>
                                        <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal-500 animate-pulse-slow" style={{ width: `${(count / stats.consultations) * 100}%` }} />
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">Insufficient data for distribution.</p>
                                )}
                            </div>
                        </div>

                        {/* Village Clusters */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h3 className="font-black text-gray-900 text-sm mb-5 uppercase tracking-wide">Consultation Clusters (by Village)</h3>
                            <div className="space-y-3">
                                {insights.villages.length > 0 ? insights.villages.map(([vil, count], i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center text-xs font-black">{i + 1}</div>
                                            <p className="text-sm font-bold text-gray-700">{vil}</p>
                                        </div>
                                        <p className="text-xs font-black text-teal-600">{count} Active Sessions</p>
                                    </div>
                                )) : (
                                    <p className="text-sm text-gray-400 italic">No village data mapped yet.</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
