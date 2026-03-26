import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../services/LanguageContext';
import {
    ArrowLeft, Newspaper, ExternalLink, Clock, Globe,
    Heart, Shield, Baby, Droplets, Leaf, Loader2, RefreshCw, AlertCircle
} from 'lucide-react';

/* ── Government Health Scheme Cards (always shown, real links) ────────────── */
const GOV_SCHEMES = [
    {
        title_en: "Ayushman Bharat: Free Treatment Up to ₹5 Lakh",
        title_hi: "आयुष्मान भारत: ₹5 लाख तक मुफ़्त इलाज",
        desc_en: "Every eligible family gets free treatment up to ₹5 lakh/year at empanelled hospitals. 30+ crore cards issued.",
        desc_hi: "हर पात्र परिवार को सालाना ₹5 लाख तक मुफ़्त इलाज। 30 करोड़+ कार्ड जारी।",
        url: "https://pmjay.gov.in",
        source: "National Health Authority",
        icon: Heart, color: "text-red-600 bg-red-50",
    },
    {
        title_en: "Free Vaccination Drive — All Ages",
        title_hi: "मुफ़्त टीकाकरण अभियान — सभी उम्र",
        desc_en: "Universal Immunization: free vaccines for 12 diseases including TB, Polio, Hepatitis B, Measles.",
        desc_hi: "सार्वभौमिक टीकाकरण: TB, पोलियो, हेपेटाइटिस B, खसरा सहित 12 बीमारियों के मुफ़्त टीके।",
        url: "https://nhm.gov.in",
        source: "MoHFW",
        icon: Shield, color: "text-teal-600 bg-teal-50",
    },
    {
        title_en: "Janani Suraksha Yojana: Safe Motherhood",
        title_hi: "जननी सुरक्षा योजना: सुरक्षित मातृत्व",
        desc_en: "₹1,400 cash for rural & ₹1,000 for urban pregnant women. Free delivery at govt hospitals.",
        desc_hi: "ग्रामीण गर्भवती को ₹1,400 व शहरी को ₹1,000 नकद। सरकारी अस्पतालों में मुफ़्त प्रसव।",
        url: "https://nhm.gov.in",
        source: "NHM",
        icon: Baby, color: "text-pink-600 bg-pink-50",
    },
    {
        title_en: "Jan Aushadhi: 90% Cheaper Medicines",
        title_hi: "जन औषधि: 90% सस्ती दवाइयां",
        desc_en: "Quality generic medicines at up to 90% lower cost. Find nearby Jan Aushadhi stores.",
        desc_hi: "90% तक कम कीमत पर गुणवत्ता जेनेरिक दवाइयां। नज़दीकी जन औषधि केंद्र खोजें।",
        url: "https://janaushadhi.gov.in",
        source: "BPPI",
        icon: Droplets, color: "text-blue-600 bg-blue-50",
    },
    {
        title_en: "e-Sanjeevani: Free Telemedicine",
        title_hi: "ई-संजीवनी: मुफ़्त टेलीमेडिसिन",
        desc_en: "Free video call doctor consultations. 10 crore+ consultations done. Daily 8 AM–8 PM.",
        desc_hi: "मुफ़्त वीडियो कॉल डॉक्टर परामर्श। 10 करोड़+ परामर्श पूरे। रोज़ सुबह 8 – रात 8।",
        url: "https://esanjeevani.mohfw.gov.in",
        source: "MoH",
        icon: Globe, color: "text-indigo-600 bg-indigo-50",
    },
];

/* ── Real News Fetcher (Google News RSS → rss2json) ───────────────────────── */
const NEWS_RSS_URL = "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fnews.google.com%2Frss%2Fsearch%3Fq%3Dhealth%2Bindia%2Bgovernment%26hl%3Den-IN%26gl%3DIN%26ceid%3DIN%3Aen";

async function fetchRealNews() {
    try {
        const res = await fetch(NEWS_RSS_URL);
        if (!res.ok) throw new Error('Feed unavailable');
        const data = await res.json();
        if (data.status !== 'ok' || !data.items?.length) throw new Error('No items');

        return data.items.slice(0, 12).map((item, i) => ({
            id: i,
            title: item.title || 'Health News',
            link: item.link || '#',
            pubDate: item.pubDate || '',
            source: item.author || extractSource(item.title),
            thumbnail: item.thumbnail || item.enclosure?.link || '',
        }));
    } catch (err) {
        console.warn('News fetch failed:', err);
        return null; // fallback to static
    }
}

function extractSource(title) {
    // Google News titles often end with " - Source Name"
    const match = title?.match(/\s-\s([^-]+)$/);
    return match ? match[1].trim() : 'Health News';
}

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

/* ══════════════════════════════════════════════════════════════════════════════
   HEALTH NEWS PAGE
   ══════════════════════════════════════════════════════════════════════════════ */
export default function HealthNews() {
    const { lang, t, toggleLang } = useLanguage();
    const [liveNews, setLiveNews] = useState(null);
    const [newsLoading, setNewsLoading] = useState(true);
    const [newsError, setNewsError] = useState(false);

    const loadNews = async () => {
        setNewsLoading(true);
        setNewsError(false);
        const news = await fetchRealNews();
        if (news) {
            setLiveNews(news);
        } else {
            setNewsError(true);
        }
        setNewsLoading(false);
    };

    useEffect(() => { loadNews(); }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Nav */}
            <nav className="bg-white border-b border-gray-100 px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link to="/dashboard" className="p-2 hover:bg-gray-50 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div className="w-10 h-10 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-100">
                        <Newspaper className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-gray-900 text-sm md:text-lg tracking-tight">{t('newsTitle')}</h1>
                        <p className="text-[10px] md:text-xs font-bold text-teal-600 uppercase tracking-widest">{t('newsSubtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={toggleLang}
                        className="px-3 py-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-full transition">
                        {t('switchLang')}
                    </button>
                </div>
            </nav>

            <main className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">

                {/* ═══ LIVE NEWS SECTION ═══ */}
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">
                                {lang === 'hi' ? 'ताज़ा स्वास्थ्य समाचार' : 'Live Health News'}
                            </p>
                        </div>
                        <button 
                            onClick={loadNews} 
                            disabled={newsLoading}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition
                                ${newsLoading 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-teal-600 hover:bg-teal-700 text-white hover:shadow-md'
                                }`}
                        >
                            <RefreshCw className={`w-4 h-4 ${newsLoading ? 'animate-spin' : ''}`} />
                            {lang === 'hi' ? 'ताज़ा ख़बरें प्राप्त करें' : 'Latest News'}
                        </button>
                    </div>

                    {newsLoading && (
                        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                            <Loader2 className="w-6 h-6 text-teal-600 animate-spin mx-auto mb-2" />
                            <p className="text-xs text-gray-400">{lang === 'hi' ? 'समाचार लोड हो रहे हैं...' : 'Loading news...'}</p>
                        </div>
                    )}

                    {newsError && !newsLoading && (
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-bold text-orange-700">
                                    {lang === 'hi' ? 'समाचार लोड करने में असफल' : 'Could not load live news'}
                                </p>
                                <button onClick={loadNews} className="text-xs text-orange-500 font-bold mt-1 underline">
                                    {lang === 'hi' ? 'पुनः प्रयास' : 'Retry'}
                                </button>
                            </div>
                        </div>
                    )}

                    {!newsLoading && liveNews && liveNews.length > 0 && (
                        <div className="space-y-3">
                            {liveNews.map(news => (
                                <a key={news.id}
                                    href={news.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md hover:border-teal-200 transition-all block group"
                                >
                                    {news.thumbnail && (
                                        <img src={news.thumbnail} alt=""
                                            className="w-20 h-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
                                            onError={e => { e.target.style.display = 'none'; }}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-teal-700 transition line-clamp-2">
                                            {news.title}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {timeAgo(news.pubDate)}
                                            </span>
                                            <span className="font-bold text-gray-500">{news.source}</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-teal-500 flex-shrink-0 mt-1 transition" />
                                </a>
                            ))}
                        </div>
                    )}
                </div>

                {/* ═══ GOVERNMENT SCHEMES (always shown) ═══ */}
                <div>
                    <div className="bg-gradient-to-r from-orange-500 via-white to-green-600 rounded-2xl p-1 mb-4">
                        <div className="bg-white rounded-xl p-4 text-center">
                            <p className="text-base font-black text-gray-900">
                                {lang === 'hi' ? '🇮🇳 सरकारी स्वास्थ्य योजनाएं' : '🇮🇳 Government Health Schemes'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                                {lang === 'hi' ? 'सभी भारतीय नागरिकों के लिए उपलब्ध' : 'Available for all Indian citizens'}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {GOV_SCHEMES.map((s, i) => (
                            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                                className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-4 hover:shadow-md transition block group">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                                    <s.icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-teal-700 transition">
                                        {lang === 'hi' ? s.title_hi : s.title_en}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        {lang === 'hi' ? s.desc_hi : s.desc_en}
                                    </p>
                                    <p className="text-[10px] text-gray-400 mt-1.5">
                                        {t('source')}: {s.source}
                                    </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-teal-500 flex-shrink-0 transition" />
                            </a>
                        ))}
                    </div>
                </div>

                {/* ═══ Official Links ═══ */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                    <h3 className="font-bold text-gray-900 text-sm mb-3">
                        {lang === 'hi' ? '🔗 आधिकारिक वेबसाइटें' : '🔗 Official Websites'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {[
                            { name: 'National Health Portal', url: 'https://nhp.gov.in', name_hi: 'राष्ट्रीय स्वास्थ्य पोर्टल' },
                            { name: 'Ayushman Bharat (PM-JAY)', url: 'https://pmjay.gov.in', name_hi: 'आयुष्मान भारत (PM-JAY)' },
                            { name: 'Jan Aushadhi (Cheap Medicines)', url: 'https://janaushadhi.gov.in', name_hi: 'जन औषधि (सस्ती दवाइयां)' },
                            { name: 'e-Sanjeevani Telemedicine', url: 'https://esanjeevani.mohfw.gov.in', name_hi: 'ई-संजीवनी टेलीमेडिसिन' },
                        ].map(site => (
                            <a key={site.url} href={site.url} target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 hover:text-teal-700 transition border border-gray-100">
                                <Globe className="w-4 h-4 text-teal-500 flex-shrink-0" />
                                {lang === 'hi' ? site.name_hi : site.name}
                                <ExternalLink className="w-3 h-3 ml-auto text-gray-300" />
                            </a>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
