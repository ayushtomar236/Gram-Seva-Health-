import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import {
    ArrowLeft, Building2, MapPin, Phone, Navigation,
    Loader2, AlertCircle, RefreshCw, Locate, ExternalLink
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Haversine distance (km) ──────────────────────────────────────────────── */
function getDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Overpass API query ───────────────────────────────────────────────────── */
async function fetchNearbyHospitals(lat, lon, radiusKm = 10) {
    const radiusM = radiusKm * 1000;
    const query = `
        [out:json][timeout:25];
        (
            node["amenity"="hospital"](around:${radiusM},${lat},${lon});
            way["amenity"="hospital"](around:${radiusM},${lat},${lon});
            node["amenity"="clinic"](around:${radiusM},${lat},${lon});
            way["amenity"="clinic"](around:${radiusM},${lat},${lon});
            node["amenity"="doctors"](around:${radiusM},${lat},${lon});
            node["healthcare"="hospital"](around:${radiusM},${lat},${lon});
            way["healthcare"="hospital"](around:${radiusM},${lat},${lon});
        );
        out center body;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
    });

    if (!response.ok) throw new Error(`Overpass error: ${response.status}`);
    const data = await response.json();

    return data.elements
        .map(el => {
            const elLat = el.lat || el.center?.lat;
            const elLon = el.lon || el.center?.lon;
            if (!elLat || !elLon) return null;
            const tags = el.tags || {};
            const name = tags.name || tags['name:en'] || tags['name:hi'] || 'Hospital / Clinic';
            const phone = tags.phone || tags['contact:phone'] || tags['contact:mobile'] || '';
            const amenity = tags.amenity || tags.healthcare || 'hospital';
            return {
                id: el.id, name, lat: elLat, lon: elLon,
                phone: phone.replace(/\s+/g, ''),
                type: amenity === 'clinic' ? 'Clinic' : amenity === 'doctors' ? 'Doctor' : 'Hospital',
                address: [tags['addr:street'], tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ') || '',
                distance: Math.round(getDistanceKm(lat, lon, elLat, elLon) * 10) / 10,
                emergency: tags.emergency === 'yes',
                beds: tags.beds ? parseInt(tags.beds) : null,
                operator: tags.operator || '',
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.distance - b.distance);
}

/* ══════════════════════════════════════════════════════════════════════════════
   HOSPITAL DIRECTORY — Plain Leaflet + Overpass
   ══════════════════════════════════════════════════════════════════════════════ */
export default function HospitalDirectory() {
    const { lang, t, toggleLang } = useLanguage();
    const [userLat, setUserLat] = useState(null);
    const [userLon, setUserLon] = useState(null);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [geoStatus, setGeoStatus] = useState('idle');
    const [searchRadius, setSearchRadius] = useState(10);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);

    /* ── Detect location ──────────────────────────────────────────────────── */
    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError(lang === 'hi' ? 'ब्राउज़र लोकेशन सपोर्ट नहीं करता' : 'Browser does not support geolocation');
            return;
        }
        setGeoStatus('detecting');
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (pos) => { setUserLat(pos.coords.latitude); setUserLon(pos.coords.longitude); setGeoStatus('done'); },
            (err) => {
                setGeoStatus('denied');
                setError(err.code === 1
                    ? (lang === 'hi' ? 'लोकेशन अस्वीकृत। ब्राउज़र में अनुमति दें।' : 'Location denied. Allow in browser settings.')
                    : (lang === 'hi' ? 'लोकेशन नहीं मिली' : 'Failed to detect location'));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => { detectLocation(); }, []);

    /* ── Init map when location found ─────────────────────────────────────── */
    useEffect(() => {
        if (!userLat || !userLon || !mapRef.current) return;

        // Create map only once
        if (!mapInstanceRef.current) {
            mapInstanceRef.current = L.map(mapRef.current).setView([userLat, userLon], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',
            }).addTo(mapInstanceRef.current);
        } else {
            mapInstanceRef.current.flyTo([userLat, userLon], 14, { duration: 1 });
        }

        // Clear old markers
        markersRef.current.forEach(m => mapInstanceRef.current.removeLayer(m));
        markersRef.current = [];

        // User marker (blue)
        const userMarker = L.circleMarker([userLat, userLon], {
            radius: 10, fillColor: '#3b82f6', color: '#1d4ed8', weight: 3, fillOpacity: 0.8,
        }).addTo(mapInstanceRef.current).bindPopup(`<strong>📍 ${lang === 'hi' ? 'आपकी लोकेशन' : 'Your Location'}</strong>`);
        markersRef.current.push(userMarker);

        // Radius circle
        const circle = L.circle([userLat, userLon], {
            radius: searchRadius * 1000, color: '#0891b2', fillColor: '#06b6d4', fillOpacity: 0.06, weight: 1,
        }).addTo(mapInstanceRef.current);
        markersRef.current.push(circle);

    }, [userLat, userLon]);

    /* ── Add hospital markers when results arrive ─────────────────────────── */
    useEffect(() => {
        if (!mapInstanceRef.current || hospitals.length === 0) return;
        console.log(`🏥 Adding ${hospitals.length} hospital markers to map`);

        // Remove old hospital markers only (keep user marker + circle = first 2)
        markersRef.current.slice(2).forEach(m => mapInstanceRef.current.removeLayer(m));
        markersRef.current = markersRef.current.slice(0, 2);

        hospitals.forEach(h => {
            // Red circle marker (no external image needed)
            const marker = L.circleMarker([h.lat, h.lon], {
                radius: 8, fillColor: '#dc2626', color: '#991b1b', weight: 2, fillOpacity: 0.9,
            })
                .addTo(mapInstanceRef.current)
                .bindPopup(`
                    <div style="min-width:180px">
                        <strong style="font-size:13px">${h.name}</strong>
                        <div style="font-size:11px;color:#666;margin-top:2px">${h.type} • ${h.distance} km</div>
                        ${h.phone ? `<a href="tel:${h.phone}" style="font-size:11px;color:#0d9488;display:block;margin-top:4px">📞 ${h.phone}</a>` : ''}
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}" target="_blank" style="font-size:11px;color:#2563eb;display:block;margin-top:2px">🗺️ Get Directions</a>
                    </div>
                `);
            markersRef.current.push(marker);
        });

        // Fit map to show all markers
        if (hospitals.length > 0 && userLat && userLon) {
            const allPoints = [[userLat, userLon], ...hospitals.map(h => [h.lat, h.lon])];
            const bounds = L.latLngBounds(allPoints);
            mapInstanceRef.current.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
    }, [hospitals]);

    /* ── Fetch hospitals ──────────────────────────────────────────────────── */
    useEffect(() => {
        if (!userLat || !userLon) return;
        const run = async () => {
            setLoading(true); setError(null);
            try {
                console.log(`🔍 Searching hospitals within ${searchRadius}km of [${userLat}, ${userLon}]`);
                const results = await fetchNearbyHospitals(userLat, userLon, searchRadius);
                console.log(`✅ Found ${results.length} hospitals:`, results.slice(0, 3));
                setHospitals(results);
                if (results.length === 0) setError(lang === 'hi' ? `${searchRadius} किमी में कोई अस्पताल नहीं मिला। रेडियस बढ़ाएं।` : `No hospitals found within ${searchRadius} km. Try a larger radius.`);
            } catch (err) {
                console.error('❌ Overpass fetch error:', err);
                setError(lang === 'hi' ? 'खोज विफल। पुनः प्रयास करें।' : 'Search failed. Try again.');
            }
            setLoading(false);
        };
        run();
    }, [userLat, userLon, searchRadius]);

    /* ── Cleanup map on unmount ────────────────────────────────────────────── */
    useEffect(() => {
        return () => { if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; } };
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* NAV */}
            <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-[1000]">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="w-10 h-10 bg-cyan-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-100">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-gray-900 text-sm md:text-lg tracking-tight">
                            {lang === 'hi' ? 'नज़दीकी अस्पताल' : 'Nearby Hospitals'}
                        </h1>
                        <p className="text-[10px] md:text-xs font-bold text-cyan-600 uppercase tracking-widest">
                            {lang === 'hi' ? 'OpenStreetMap से लाइव' : 'Live via OpenStreetMap'}
                        </p>
                    </div>
                </div>
                <button onClick={toggleLang} className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-full transition">
                    {t('switchLang')}
                </button>
            </nav>

            <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
                {/* LOCATION PROMPT */}
                {geoStatus !== 'done' && (
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                        <div className="relative z-10 text-center">
                            <h2 className="text-xl font-black mb-2">📍 {lang === 'hi' ? 'लोकेशन साझा करें' : 'Share Your Location'}</h2>
                            <p className="text-cyan-100 text-sm mb-4">{lang === 'hi' ? 'नज़दीकी अस्पताल खोजने के लिए' : 'To find nearby hospitals & clinics'}</p>
                            <button onClick={detectLocation} disabled={geoStatus === 'detecting'}
                                className="px-6 py-3 bg-white text-cyan-700 font-black text-sm rounded-2xl hover:bg-cyan-50 transition flex items-center gap-2 mx-auto disabled:opacity-50">
                                {geoStatus === 'detecting'
                                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {lang === 'hi' ? 'खोज रहे हैं...' : 'Detecting...'}</>
                                    : <><Locate className="w-4 h-4" /> {lang === 'hi' ? 'लोकेशन पता लगाएं' : 'Detect My Location'}</>
                                }
                            </button>
                        </div>
                    </div>
                )}

                {/* ERROR */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-red-700">{error}</p>
                            <button onClick={detectLocation} className="text-xs text-red-500 font-bold mt-1 underline">
                                {lang === 'hi' ? 'पुनः प्रयास' : 'Try Again'}
                            </button>
                        </div>
                    </div>
                )}

                {/* CONTROLS */}
                {geoStatus === 'done' && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-green-500" />
                            <span className="text-xs font-bold text-gray-600">{lang === 'hi' ? 'लोकेशन मिली' : 'Location detected'}</span>
                            <span className="text-[10px] text-gray-400">({userLat?.toFixed(4)}, {userLon?.toFixed(4)})</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select value={searchRadius} onChange={e => setSearchRadius(Number(e.target.value))}
                                className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-bold bg-white">
                                <option value={5}>5 km</option>
                                <option value={10}>10 km</option>
                                <option value={20}>20 km</option>
                                <option value={50}>50 km</option>
                            </select>
                            <button onClick={detectLocation} disabled={loading}
                                className="p-2 bg-cyan-50 text-cyan-600 rounded-xl hover:bg-cyan-100 transition">
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                )}

                {/* MAP */}
                {geoStatus === 'done' && (
                    <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
                        <div ref={mapRef} style={{ height: 350, width: '100%' }} />
                    </div>
                )}

                {/* LOADING */}
                {loading && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                        <Loader2 className="w-8 h-8 text-cyan-600 animate-spin mx-auto mb-3" />
                        <p className="text-sm font-bold text-gray-600">{lang === 'hi' ? 'अस्पताल खोज रहे हैं...' : 'Searching hospitals...'}</p>
                    </div>
                )}

                {/* RESULTS COUNT */}
                {!loading && geoStatus === 'done' && hospitals.length > 0 && (
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                        {hospitals.length} {lang === 'hi' ? 'अस्पताल मिले' : 'Hospitals Found'}
                    </p>
                )}

                {/* HOSPITAL CARDS */}
                {!loading && hospitals.map(h => (
                    <div key={h.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all">
                        <div className="p-4 flex items-start gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${h.type === 'Clinic' ? 'bg-green-50 text-green-600' : h.type === 'Doctor' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
                                }`}>
                                <Building2 className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="font-black text-gray-900 text-sm truncate">{h.name}</h3>
                                    <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${h.type === 'Clinic' ? 'bg-green-50 text-green-700' : h.type === 'Doctor' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'
                                        }`}>{h.type}</span>
                                    {h.emergency && <span className="px-2 py-0.5 text-[10px] font-black bg-orange-50 text-orange-700 rounded-full">🚨 Emergency</span>}
                                </div>
                                {h.operator && <p className="text-[10px] text-gray-400 mt-0.5">{h.operator}</p>}
                                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                                    <span className="flex items-center gap-1 font-bold text-cyan-600"><Navigation className="w-3 h-3" /> {h.distance} km</span>
                                    {h.phone && <a href={`tel:${h.phone}`} className="flex items-center gap-1 text-teal-600 hover:underline"><Phone className="w-3 h-3" /> {h.phone}</a>}
                                    {h.beds && <span>🛏️ {h.beds} beds</span>}
                                </div>
                                {h.address && <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {h.address}</p>}
                            </div>
                        </div>
                        <div className="px-4 pb-3 flex gap-2">
                            {h.phone && (
                                <a href={`tel:${h.phone}`} className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition">
                                    <Phone className="w-3 h-3" /> {lang === 'hi' ? 'कॉल करें' : 'Call Now'}
                                </a>
                            )}
                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${h.lat},${h.lon}`} target="_blank" rel="noopener noreferrer"
                                className="flex-1 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition border border-cyan-200">
                                <ExternalLink className="w-3 h-3" /> {lang === 'hi' ? 'गूगल मैप्स' : 'Google Maps'}
                            </a>
                        </div>
                    </div>
                ))}
            </main>
        </div>
    );
}
