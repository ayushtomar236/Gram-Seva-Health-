/**
 * GramSeva Health — Skin Disease Detection Service
 * ==================================================
 * Two-phase architecture:
 *   Phase 1: POST /api/skin-detect → Image classification (< 2s)
 *   Phase 2: GET /api/skin-report/{disease} → Detailed AI report (cached)
 */

const SKIN_SERVER = import.meta.env.VITE_SKIN_SERVER_URL || 'http://localhost:8001';

/**
 * detectSkinDisease — sends an image file to the ML backend
 */
export async function detectSkinDisease(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);

    try {
        const response = await fetch(`${SKIN_SERVER}/api/skin-detect`, {
            method: 'POST',
            body: formData,
            signal: AbortSignal.timeout(30000), // 30s for image processing
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || `Server error ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'AbortError' || error.name === 'TypeError' || error.message.includes('fetch')) {
            console.warn('⚠️ Skin detection server unreachable');
            throw new Error('Skin detection server is offline. Please start it with: python skin_server.py');
        }
        throw error;
    }
}

/**
 * fetchSkinReport — lazy-loads the detailed AI report
 */
export async function fetchSkinReport(disease) {
    try {
        const response = await fetch(
            `${SKIN_SERVER}/api/skin-report/${encodeURIComponent(disease)}`,
            { signal: AbortSignal.timeout(60000) } // 60s for AI generation
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.detailed_report || null;
    } catch (error) {
        console.warn('⚠️ Skin report generation failed:', error.message);
        return null;
    }
}

/**
 * checkSkinServerHealth — ping the skin server
 */
export async function checkSkinServerHealth() {
    try {
        const res = await fetch(`${SKIN_SERVER}/api/skin-health`, {
            signal: AbortSignal.timeout(3000),
        });
        return res.ok ? await res.json() : null;
    } catch {
        return null;
    }
}
