/**
 * GramSeva Health — AI Triage Service
 * =====================================
 * Two-phase architecture:
 *   Phase 1: POST /api/triage → Fast ML prediction (< 1s)
 *   Phase 2: GET /api/report/{disease} → Detailed AI report (lazy-loaded)
 * Falls back to client-side rule-based logic if backend is unreachable.
 */

const AI_SERVER = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000';

// ─── MAIN API CALL ───────────────────────────────────────────────────────────

/**
 * analyzeSymptoms — calls the real ML backend
 * Returns the full triage result including Gemini explanation
 */
export async function analyzeSymptoms(symptomsText) {
    try {
        const response = await fetch(`${AI_SERVER}/api/triage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptoms: symptomsText }),
            signal: AbortSignal.timeout(10000), // 10s — ML-only, very fast
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Server error ${response.status}`);
        }

        const data = await response.json();
        return {
            ...data,
            source: 'ml_model',
        };
    } catch (error) {
        // If backend is unreachable, fall back to client-side rules
        if (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('fetch')) {
            console.warn('⚠️ ML backend unreachable, using client-side fallback');
            return analyzeSymptomsFallback(symptomsText);
        }
        throw error;
    }
}

/**
 * fetchReport — lazy-loads the detailed AI medical report
 * Called AFTER triage results are shown to the user
 */
export async function fetchReport(disease) {
    try {
        const response = await fetch(
            `${AI_SERVER}/api/report/${encodeURIComponent(disease)}`,
            { signal: AbortSignal.timeout(60000) } // 60s for AI generation
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.detailed_report || null;
    } catch (error) {
        console.warn('⚠️ Report generation failed:', error.message);
        return null;
    }
}

/**
 * fetchModelInfo — get model stats from the backend
 */
export async function fetchModelInfo() {
    try {
        const res = await fetch(`${AI_SERVER}/api/model-info`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

/**
 * fetchSymptomsList — get all 132 known symptoms from the backend
 */
export async function fetchSymptomsList() {
    try {
        const res = await fetch(`${AI_SERVER}/api/symptoms`, {
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.symptoms || [];
    } catch {
        return [];
    }
}

/**
 * checkServerHealth — ping the server
 */
export async function checkServerHealth() {
    try {
        const res = await fetch(`${AI_SERVER}/api/health`, {
            signal: AbortSignal.timeout(3000),
        });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}

// ─── CLIENT-SIDE FALLBACK ────────────────────────────────────────────────────
// Used only when the FastAPI backend is unreachable

const SYMPTOM_MAP = {
    fever: 'General Physician:low', cold: 'General Physician:low',
    cough: 'General Physician:low', fatigue: 'General Physician:low',
    bukhar: 'General Physician:low', khansi: 'General Physician:low',
    'chest pain': 'Cardiologist:high', palpitation: 'Cardiologist:high',
    'breathing difficulty': 'Cardiologist:high',
    'seene mein dard': 'Cardiologist:high',
    'stomach pain': 'Gastroenterologist:medium', vomiting: 'Gastroenterologist:medium',
    diarrhea: 'Gastroenterologist:medium', nausea: 'Gastroenterologist:medium',
    'pet dard': 'Gastroenterologist:medium',
    headache: 'Neurologist:medium', migraine: 'Neurologist:medium',
    dizziness: 'Neurologist:medium', chakkar: 'Neurologist:medium',
    'skin rash': 'Dermatologist:low', itching: 'Dermatologist:low',
    khujli: 'Dermatologist:low',
    'joint pain': 'Orthopedic:medium', 'back pain': 'Orthopedic:medium',
    'throat pain': 'ENT:low', 'ear pain': 'ENT:low',
    unconscious: 'Emergency:emergency', bleeding: 'Emergency:emergency',
    accident: 'Emergency:emergency', behosh: 'Emergency:emergency',
};

const URGENCY_RANK = { emergency: 4, high: 3, medium: 2, low: 1 };

function analyzeSymptomsFallback(text) {
    const t = text.toLowerCase();
    let best = { specialist: 'General Physician', urgency: 'low', matched: [] };
    let bestRank = 0;

    for (const [kw, val] of Object.entries(SYMPTOM_MAP)) {
        if (t.includes(kw)) {
            const [spec, urg] = val.split(':');
            best.matched.push(kw);
            if (URGENCY_RANK[urg] > bestRank) {
                bestRank = URGENCY_RANK[urg];
                best.specialist = spec;
                best.urgency = urg;
            }
        }
    }

    return {
        disease: 'Undetermined',
        confidence: 0.5,
        specialist: best.specialist,
        urgency: best.urgency,
        emergency: best.urgency === 'emergency',
        top3: [{ disease: 'Undetermined', confidence: 0.5 }],
        medical_info: {
            description: `Based on your symptoms, a ${best.specialist} consultation is recommended. The AI backend is currently offline for detailed analysis.`,
            immediate_advice: 'Rest, stay hydrated, and consult a doctor. Avoid self-medication.',
            warning_signs: ['High fever', 'Difficulty breathing', 'Severe pain', 'Loss of consciousness'],
            disclaimer: 'This is a rule-based fallback. Please consult a qualified doctor.',
            detailed_report: '# Offline Mode\n\nDetailed medical report is unavailable while the AI server is offline.\nPlease start the server (`python server.py`) and try again for a comprehensive analysis.',
        },
        source: 'fallback',
    };
}
