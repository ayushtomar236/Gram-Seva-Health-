import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Pill, X, Search, Plus, AlertTriangle, ChevronDown,
    CheckCircle2, Clock, Trash2, ToggleLeft, ToggleRight,
    Info, Loader2, ShieldAlert, Package, FlaskConical,
    Building2, ChevronRight, Sparkles
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

/* ── Helpers ─────────────────────────────────────────────────── */
const LS_KEY = 'gramseva-known-medicines';

function loadFromStorage() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function saveToStorage(list) {
    localStorage.setItem(LS_KEY, JSON.stringify(list));
}

function dedup(list) {
    const seen = new Set();
    return list.filter(m => {
        const key = m.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

/* ── Medicine Card ───────────────────────────────────────────── */
function MedicineCard({ med, onDelete, onToggleStatus }) {
    const [expanded, setExpanded] = useState(false);
    const isCurrent = med.status === 'current';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden
                ${med.high_risk ? 'border-red-200 shadow-red-50' : 'border-gray-100'}
                ${isCurrent ? 'shadow-md' : 'shadow-sm opacity-75'}`}
        >
            {/* Card Header */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                        ${med.high_risk ? 'bg-red-50' : isCurrent ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                        {med.high_risk
                            ? <ShieldAlert className="w-5 h-5 text-red-500" />
                            : <Pill className={`w-5 h-5 ${isCurrent ? 'text-emerald-600' : 'text-gray-400'}`} />
                        }
                    </div>

                    {/* Title + Salt */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-gray-900 text-sm leading-tight truncate">{med.name}</h4>
                            {med.high_risk && (
                                <span className="flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                                    <AlertTriangle className="w-2.5 h-2.5" /> HIGH RISK
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-purple-600 mt-0.5 flex items-center gap-1">
                            <FlaskConical className="w-3 h-3" />
                            {med.salt !== 'Not Available' ? med.salt : <span className="text-gray-400">Unknown salt</span>}
                        </p>
                        <p className="text-[10px] text-gray-500 font-medium mt-0.5 line-clamp-1">
                            {med.used_for !== 'Not Available' ? med.used_for : '—'}
                        </p>
                    </div>

                    {/* Status Badge */}
                    <button
                        onClick={() => onToggleStatus(med.name)}
                        title={`Switch to ${isCurrent ? 'past' : 'current'}`}
                        className={`flex-shrink-0 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-wider transition-all
                            ${isCurrent
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    >
                        {isCurrent ? '● Current' : '○ Past'}
                    </button>
                </div>

                {/* Side effects chips (collapsed preview) */}
                {med.side_effects?.length > 0 && (
                    <div className="mt-3 flex gap-1.5 flex-wrap">
                        {med.side_effects.slice(0, expanded ? undefined : 3).map((se, i) => (
                            <span key={i}
                                className="text-[9px] font-bold bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full border border-orange-100">
                                {se}
                            </span>
                        ))}
                        {!expanded && med.side_effects.length > 3 && (
                            <span className="text-[9px] font-bold text-gray-400">+{med.side_effects.length - 3} more</span>
                        )}
                    </div>
                )}

                {/* Expanded details */}
                <AnimatePresence>
                    {expanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 space-y-2 pt-3 border-t border-gray-50"
                        >
                            {med.manufacturer && med.manufacturer !== 'Not Available' && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                    <Building2 className="w-3 h-3 text-gray-400" />
                                    <span className="font-bold">Mfr:</span> {med.manufacturer}
                                </div>
                            )}
                            {med.alternate_brands?.length > 0 && (
                                <div className="text-[10px] text-gray-500">
                                    <span className="font-bold text-gray-600">Same salt as:</span>{' '}
                                    {med.alternate_brands.join(', ')}
                                </div>
                            )}
                            {med.added_at && (
                                <div className="flex items-center gap-1 text-[10px] text-gray-400">
                                    <Clock className="w-3 h-3" />
                                    Added {new Date(med.added_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Card Footer */}
            <div className="border-t border-gray-50 px-4 py-2 flex items-center justify-between bg-gray-50/50">
                <button
                    onClick={() => setExpanded(e => !e)}
                    className="text-[10px] font-black text-gray-400 hover:text-teal-600 uppercase tracking-wider flex items-center gap-1 transition"
                >
                    {expanded ? 'Less' : 'More info'}
                    <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
                <button
                    onClick={() => onDelete(med.name)}
                    className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-gray-300 hover:text-red-500 transition border border-gray-100 hover:border-red-100"
                    title="Remove"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

/* ── Main Panel ──────────────────────────────────────────────── */
export default function KnownMedicinesPanel({ isOpen, onClose, patientId, onSyncSupabase }) {
    const [medicines, setMedicines]   = useState([]);
    const [filter, setFilter]         = useState('all'); // all | current | past | high_risk
    const [query, setQuery]           = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [sugLoading, setSugLoading] = useState(false);
    const [addStatus, setAddStatus]   = useState('current');
    const [customName, setCustomName] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const debounceRef = useRef(null);

    // Load from localStorage on mount
    useEffect(() => {
        setMedicines(loadFromStorage());
    }, []);

    // Auto-save on change
    useEffect(() => {
        saveToStorage(medicines);
        onSyncSupabase?.(medicines);
    }, [medicines]);

    // Autocomplete search
    useEffect(() => {
        if (!query.trim() || query.length < 2) { setSuggestions([]); return; }
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(async () => {
            setSugLoading(true);
            try {
                const res = await fetch(`${API_BASE}/api/medicines/search?q=${encodeURIComponent(query)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.results || []);
                }
            } catch {
                // server offline — still allow manual add
            } finally {
                setSugLoading(false);
            }
        }, 280);
    }, [query]);

    const addMedicine = useCallback((med, status = addStatus) => {
        const entry = {
            ...med,
            status,
            added_at: new Date().toISOString(),
        };
        setMedicines(prev => dedup([entry, ...prev]));
        setQuery('');
        setSuggestions([]);
        setCustomName('');
        setShowCustom(false);
    }, [addStatus]);

    const addCustom = () => {
        const name = customName.trim();
        if (!name) return;
        addMedicine({
            name,
            salt: 'Not Available',
            used_for: 'Not Available',
            side_effects: [],
            manufacturer: 'Not Available',
            high_risk: false,
            alternate_brands: [],
        });
    };

    const deleteMedicine = (name) => {
        setMedicines(prev => prev.filter(m => m.name.toLowerCase() !== name.toLowerCase()));
    };

    const toggleStatus = (name) => {
        setMedicines(prev => prev.map(m =>
            m.name.toLowerCase() === name.toLowerCase()
                ? { ...m, status: m.status === 'current' ? 'past' : 'current' }
                : m
        ));
    };

    // Filtered list
    const filtered = medicines.filter(m => {
        if (filter === 'current')   return m.status === 'current';
        if (filter === 'past')      return m.status === 'past';
        if (filter === 'high_risk') return m.high_risk;
        return true;
    });

    const counts = {
        all:       medicines.length,
        current:   medicines.filter(m => m.status === 'current').length,
        past:      medicines.filter(m => m.status === 'past').length,
        high_risk: medicines.filter(m => m.high_risk).length,
    };

    const FILTERS = [
        { key: 'all',       label: 'All',       color: 'bg-gray-100 text-gray-700' },
        { key: 'current',   label: '● Current',  color: 'bg-emerald-100 text-emerald-700' },
        { key: 'past',      label: '○ Past',     color: 'bg-gray-100 text-gray-500' },
        { key: 'high_risk', label: '⚠ High Risk', color: 'bg-red-100 text-red-700' },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-0 md:p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60 }}
                        className="relative w-full md:max-w-2xl max-h-[92vh] bg-white md:rounded-[2.5rem] rounded-t-[2rem] shadow-2xl flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-emerald-50 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Pill className="w-6 h-6 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="font-black text-gray-900 text-lg leading-tight">Known Medicines</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {counts.all} medicine{counts.all !== 1 ? 's' : ''} tracked
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-500 transition text-gray-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Search + Add */}
                        <div className="px-6 pt-5 pb-3 flex-shrink-0 space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Search medicine name or use (e.g. Crocin, diabetes...)"
                                    className="w-full pl-10 pr-10 py-3.5 border border-gray-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 outline-none transition-all"
                                />
                                {sugLoading && <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-300" />}
                            </div>

                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                                {suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                                        className="bg-white border border-gray-100 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                                    >
                                        {/* Status switcher */}
                                        <div className="flex gap-2 px-4 pt-3 pb-2 border-b border-gray-50">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest self-center">Add as:</span>
                                            {['current','past'].map(s => (
                                                <button key={s} onClick={() => setAddStatus(s)}
                                                    className={`px-3 py-1 rounded-full text-[10px] font-black transition
                                                        ${addStatus === s
                                                            ? s === 'current' ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white'
                                                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                                    {s === 'current' ? '● Current' : '○ Past'}
                                                </button>
                                            ))}
                                        </div>
                                        {suggestions.map((sug, i) => (
                                            <button key={i} onClick={() => addMedicine(sug)}
                                                className="w-full px-4 py-3.5 text-left hover:bg-emerald-50 transition flex items-start gap-3 border-b border-gray-50 last:border-0">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5
                                                    ${sug.high_risk ? 'bg-red-50' : 'bg-emerald-50'}`}>
                                                    {sug.high_risk
                                                        ? <ShieldAlert className="w-4 h-4 text-red-500" />
                                                        : <Pill className="w-4 h-4 text-emerald-600" />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-bold text-sm text-gray-900">{sug.name}</span>
                                                        {sug.high_risk && (
                                                            <span className="text-[9px] font-black text-red-500 bg-red-50 px-1.5 rounded-full border border-red-100">⚠ High Risk</span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-purple-600 font-bold">{sug.salt}</p>
                                                    <p className="text-[10px] text-gray-400 font-medium truncate">{sug.used_for}</p>
                                                </div>
                                                <Plus className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-2" />
                                            </button>
                                        ))}
                                        {/* Manual add custom */}
                                        <button
                                            onClick={() => { setShowCustom(true); setCustomName(query); setSuggestions([]); }}
                                            className="w-full px-4 py-3 text-left hover:bg-gray-50 transition flex items-center gap-3 text-[11px] font-bold text-gray-400 border-t border-gray-100"
                                        >
                                            <Plus className="w-4 h-4" /> Add "{query}" manually
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Custom add form */}
                            <AnimatePresence>
                                {showCustom && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3"
                                    >
                                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Add Custom Medicine</p>
                                        <input
                                            type="text"
                                            value={customName}
                                            onChange={e => setCustomName(e.target.value)}
                                            placeholder="Medicine name..."
                                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-100"
                                        />
                                        <div className="flex gap-2">
                                            <div className="flex gap-1.5 flex-1">
                                                {['current','past'].map(s => (
                                                    <button key={s} onClick={() => setAddStatus(s)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition
                                                            ${addStatus === s
                                                                ? s === 'current' ? 'bg-emerald-600 text-white' : 'bg-gray-600 text-white'
                                                                : 'bg-gray-100 text-gray-500'}`}>
                                                        {s === 'current' ? '● Current' : '○ Past'}
                                                    </button>
                                                ))}
                                            </div>
                                            <button onClick={addCustom}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-black hover:bg-emerald-700 transition">
                                                ADD
                                            </button>
                                            <button onClick={() => setShowCustom(false)}
                                                className="px-3 py-2 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black hover:bg-gray-200 transition">
                                                CANCEL
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* If no suggestions and query has text, offer manual add */}
                            {query.length >= 2 && suggestions.length === 0 && !sugLoading && !showCustom && (
                                <button
                                    onClick={() => { setShowCustom(true); setCustomName(query); }}
                                    className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-[10px] font-black text-gray-400 hover:border-emerald-300 hover:text-emerald-600 transition flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Add "{query}" manually
                                </button>
                            )}
                        </div>

                        {/* Filter Tabs */}
                        <div className="px-6 pb-3 flex gap-2 flex-shrink-0 overflow-x-auto">
                            {FILTERS.map(f => (
                                <button key={f.key} onClick={() => setFilter(f.key)}
                                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all
                                        ${filter === f.key ? f.color + ' ring-2 ring-offset-1 ring-gray-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}`}>
                                    {f.label}
                                    {counts[f.key] > 0 && (
                                        <span className="ml-1.5 bg-white/60 px-1.5 py-0.5 rounded-full text-[9px]">
                                            {counts[f.key]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Medicine List */}
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
                            {filtered.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center mb-4">
                                        <Pill className="w-8 h-8 text-emerald-200" />
                                    </div>
                                    <h3 className="font-black text-gray-700 mb-1">No medicines here</h3>
                                    <p className="text-xs text-gray-400 font-medium max-w-xs leading-relaxed">
                                        {filter === 'all'
                                            ? 'Search for a medicine above and add it to your list.'
                                            : `No medicines marked as "${filter.replace('_', ' ')}". Change the filter or add medicines.`}
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence>
                                    {filtered.map(med => (
                                        <MedicineCard
                                            key={med.name}
                                            med={med}
                                            onDelete={deleteMedicine}
                                            onToggleStatus={toggleStatus}
                                        />
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {/* Footer disclaimer */}
                        <div className="px-6 py-3 border-t border-gray-100 flex-shrink-0">
                            <p className="text-[9px] text-gray-300 font-bold text-center uppercase tracking-wider flex items-center justify-center gap-1">
                                <Info className="w-3 h-3" />
                                Reference only — not a prescription system. Consult your doctor for medical advice.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
