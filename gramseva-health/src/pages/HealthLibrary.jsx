import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft, BookOpen, HeartPulse, Baby, ShieldAlert,
    Thermometer, PlusCircle, ChevronRight, Info, Search,
    Flame, Bug, Droplets, Wind, Clipboard, Activity
} from 'lucide-react';
import { useLanguage } from '../services/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

const HEALTH_CONTENT = {
    emergency: {
        id: 'emergency',
        icon: ShieldAlert,
        color: 'red',
        title: { en: 'Emergency First Aid', hi: 'आपातकालीन प्राथमिक चिकित्सा' },
        description: { en: 'Immediate actions for life-saving situations.', hi: 'जान बचाने के लिए तत्काल कदम।' },
        topics: [
            {
                name: { en: 'Snake Bites', hi: 'सांप का काटना' },
                steps: {
                    en: [
                        'Keep the person calm and still.',
                        'Remove jewelry or tight clothing before swelling starts.',
                        'Keep the bite area below the level of the heart.',
                        'Apply a clean, dry dressing.',
                        'Do NOT cut the wound or try to suck out the venom.',
                        'Go to the hospital immediately.'
                    ],
                    hi: [
                        'व्यक्ति को शांत और स्थिर रखें।',
                        'सूजन शुरू होने से पहले गहने या तंग कपड़े उतार दें।',
                        'काटने वाले हिस्से को दिल के स्तर से नीचे रखें।',
                        'साफ और सूखी पट्टी लगाएं।',
                        'घाव को न काटें और न ही जहर चूसने की कोशिश करें।',
                        'तुरंत अस्पताल जाएं।'
                    ]
                }
            },
            {
                name: { en: 'Heat Stroke', hi: 'लू लगना' },
                steps: {
                    en: [
                        'Move the person to a cool, shaded area.',
                        'Cool them down with wet cloths or a fan.',
                        'Give small sips of water if they are conscious.',
                        'Do NOT give medications to lower fever.',
                        'Seek medical help if they become unconscious.'
                    ],
                    hi: [
                        'व्यक्ति को ठंडी और छायादार जगह पर ले जाएं।',
                        'गीले कपड़ों या पंखे से उन्हें ठंडा करें।',
                        'होश में होने पर पानी के छोटे घूंट पीने को दें।',
                        'बुखार कम करने की दवाएं न दें।',
                        'बेहोश होने पर तुरंत डॉक्टर की मदद लें।'
                    ]
                }
            },
            {
                name: { en: 'Burns', hi: 'जलना' },
                steps: {
                    en: [
                        'Run cool (not cold) water over the burn for 10-20 minutes.',
                        'Remove rings or tight items gently.',
                        'Do NOT pop blisters.',
                        'Do NOT apply butter or grease.',
                        'Cover loosely with a sterile bandage.'
                    ],
                    hi: [
                        'जले हुए हिस्से पर 10-20 मिनट तक ठंडा (बर्फ नहीं) पानी डालें।',
                        'अंगूठी या तंग सामान धीरे से हटा दें।',
                        'छालों को न फोड़ें।',
                        'मक्खन या घी न लगाएं।',
                        'स्टेराइल पट्टी से ढीला ढक दें।'
                    ]
                }
            }
        ]
    },
    maternal: {
        id: 'maternal',
        icon: Baby,
        color: 'pink',
        title: { en: 'Maternal & Child Health', hi: 'नया जीवन और बाल स्वास्थ्य' },
        description: { en: 'Pregnancy care and infant wellness tips.', hi: 'गर्भावस्था की देखभाल और शिशु स्वास्थ्य टिप्स।' },
        topics: [
            {
                name: { en: 'Antenatal Care', hi: 'प्रसव पूर्व देखभाल' },
                steps: {
                    en: [
                        'Regular checkups with a doctor or midwife.',
                        'Take Iron and Folic Acid supplements as prescribed.',
                        'Eat a balanced diet rich in proteins and vitamins.',
                        'Avoid heavy lifting and get plenty of rest.',
                        'Get vaccinated for Tetanus.'
                    ],
                    hi: [
                        'डॉक्टर या नर्स के साथ नियमित जांच कराएं।',
                        'डॉक्टर द्वारा बताई गई आयरन और फोलिक एसिड की गोलियां लें।',
                        'प्रोटीन और विटामिन से भरपूर संतुलित आहार लें।',
                        'भारी सामान उठाने से बचें और भरपूर आराम करें।',
                        'टिटनेस का टीका जरूर लगवाएं।'
                    ]
                }
            },
            {
                name: { en: 'Breastfeeding', hi: 'स्तनपान' },
                steps: {
                    en: [
                        'Exclusive breastfeeding for the first 6 months.',
                        'Breast milk provides essential nutrients and immunity.',
                        'Feed the baby on demand.',
                        'Keep the mother hydrated and well-nourished.'
                    ],
                    hi: [
                        'पहले 6 महीनों तक केवल स्तनपान कराएं।',
                        'मां का दूध जरूरी पोषक तत्व और रोग प्रतिरोधक क्षमता प्रदान करता है।',
                        'शिशु को जरूरत के अनुसार दूध पिलाएं।',
                        'मां को पर्याप्त पानी और अच्छा पोषण दें।'
                    ]
                }
            }
        ]
    },
    prevention: {
        id: 'prevention',
        icon: ShieldAlert,
        color: 'teal',
        title: { en: 'Disease Prevention', hi: 'बीमारी से बचाव' },
        description: { en: 'Protecting your family from common illnesses.', hi: 'अपने परिवार को बीमारियों से बचाएं।' },
        topics: [
            {
                name: { en: 'Malaria & Dengue', hi: 'मलेरिया और डेंगू' },
                steps: {
                    en: [
                        'Use mosquito nets at night.',
                        'Prevent stagnant water around your home.',
                        'Wear long-sleeved clothes during the evening.',
                        'Use mosquito repellents.',
                        'Keep windows and doors screened.'
                    ],
                    hi: [
                        'रात में मच्छरदानी का प्रयोग करें।',
                        'घर के आस-पास पानी जमा न होने दें।',
                        'शाम के समय पूरी आस्तीन के कपड़े पहनें।',
                        'मच्छर भगाने वाली क्रीम या दवाओं का प्रयोग करें।',
                        'खिड़कियों और दरवाजों पर जाली लगाएं।'
                    ]
                }
            },
            {
                name: { en: 'Water-borne Diseases', hi: 'जल-जनित बीमारियां' },
                steps: {
                    en: [
                        'Always drink boiled or filtered water.',
                        'Wash hands with soap before eating.',
                        'Store water in clean, covered containers.',
                        'Avoid eating raw or street food of doubtful quality.'
                    ],
                    hi: [
                        'हमेशा उबला हुआ या छना हुआ पानी पिएं।',
                        'खाना खाने से पहले हाथ साबुन से धोएं।',
                        'पानी को साफ और ढके हुए बर्तनों में रखें।',
                        'कच्चा या संदिग्ध गुणवत्ता वाला बाहर का खाना न खाएं।'
                    ]
                }
            }
        ]
    },
    vaccinations: {
        id: 'vaccinations',
        icon: Syringe,
        color: 'blue',
        title: { en: 'Child Vaccination', hi: 'बच्चों का टीकाकरण' },
        description: { en: 'Essential immunization schedule for your child.', hi: 'आपके बच्चे के लिए जरूरी टीकाकरण सारणी।' },
        topics: [
            {
                name: { en: 'Birth to 6 Months', hi: 'जन्म से 6 महीने तक' },
                steps: {
                    en: [
                        'At Birth: BCG, OPV-0, Hepatitis B birth dose.',
                        '6 Weeks: OPV-1, Pentavalent-1, Rotavirus-1, PCV-1, fIPV-1.',
                        '10 Weeks: OPV-2, Pentavalent-2, Rotavirus-2.',
                        '14 Weeks: OPV-3, Pentavalent-3, Rotavirus-3, PCV-2, fIPV-2.'
                    ],
                    hi: [
                        'जन्म पर: BCG, OPV-0, हेपेटाइटिस बी जन्म खुराक।',
                        '6 सप्ताह: OPV-1, पेंटावेलेंट-1, रोटावायरस-1, PCV-1, fIPV-1।',
                        '10 सप्ताह: OPV-2, पेंटावेलेंट-2, रोटावायरस-2।',
                        '14 सप्ताह: OPV-3, पेंटावेलेंट-3, रोटावायरस-3, PCV-2, fIPV-2।'
                    ]
                }
            },
            {
                name: { en: '9 Months to 2 Years', hi: '9 महीने से 2 साल तक' },
                steps: {
                    en: [
                        '9-12 Months: MR-1, PCV-Booster, Vit. A-1, JE-1 (in some districts).',
                        '16-24 Months: MR-2, JE-2, Vit. A-2 to 9 (every 6 months), DPT Booster-1, OPV Booster.'
                    ],
                    hi: [
                        '9-12 महीने: MR-1, PCV-बूस्टर, विटामिन ए-1, JE-1 (कुछ जिलों में)।',
                        '16-24 महीने: MR-2, JE-2, विटामिन ए-2 से 9 (हर 6 महीने में), DPT बूस्टर-1, OPV बूस्टर।'
                    ]
                }
            }
        ]
    },
    nutrition: {
        id: 'nutrition',
        icon: Apple,
        color: 'orange',
        title: { en: 'Nutrition & Anaemia', hi: 'पोषण और एनीमिया' },
        description: { en: 'Fighting malnutrition and iron deficiency.', hi: 'कुपोषण और आयरन की कमी से लड़ना।' },
        topics: [
            {
                name: { en: 'Beating Anaemia', hi: 'एनीमिया को हराना' },
                steps: {
                    en: [
                        'Eat green leafy vegetables like Spinach (Palak).',
                        'Consume iron-rich foods: Jaggery (Gur), Legumes, and Nuts.',
                        'Vitamin C (Amla, Lemon) helps absorb iron.',
                        'Regular deworming (Albendazole) every 6 months.',
                        'Pregnant women must take IFA tablets daily.'
                    ],
                    hi: [
                        'हरी पत्तेदार सब्जियां जैसे पालक खाएं।',
                        'आयरन से भरपूर खाद्य पदार्थ: गुड़, दालें और मेवे खाएं।',
                        'विटामिन सी (आंवला, नींबू) आयरन सोखने में मदद करता है।',
                        'हर 6 महीने में कृमिनाशक (एल्बेंडाजोल) की गोली लें।',
                        'गर्भवती महिलाएं रोजाना आईएफए (IFA) की गोली जरूर लें।'
                    ]
                }
            }
        ]
    }
};

function Syringe({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m18 2 4 4" /><path d="m17 7 3-3" /><path d="M19 9 8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5" /><path d="m9 11 4 4" /><path d="m5 19-3 3" /><path d="m14 4 6 6" />
        </svg>
    );
}

function Apple({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78c0 4.22 3 12.22 6 12.22 1.25 0 2.5-1.06 4-1.06Z" /><path d="M12 5V2" />
        </svg>
    );
}

export default function HealthLibrary() {
    const { lang } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // BMI State
    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bmi, setBmi] = useState(null);
    const [bmiMsg, setBmiMsg] = useState('');

    const calculateBMI = () => {
        if (!weight || !height) return;
        const hMeter = height / 100;
        const val = (weight / (hMeter * hMeter)).toFixed(1);
        setBmi(val);

        if (val < 18.5) setBmiMsg(lang === 'hi' ? 'कम वजन (Underweight)' : 'Underweight');
        else if (val < 25) setBmiMsg(lang === 'hi' ? 'सामान्य वजन (Normal)' : 'Normal');
        else if (val < 30) setBmiMsg(lang === 'hi' ? 'अधिक वजन (Overweight)' : 'Overweight');
        else setBmiMsg(lang === 'hi' ? 'मोटापा (Obese)' : 'Obese');
    };

    // WtH Ratio State
    const [wthWaist, setWthWaist] = useState('');
    const [wthHeight, setWthHeight] = useState('');
    const [wthResult, setWthResult] = useState(null);
    const [wthMsg, setWthMsg] = useState('');

    const calculateWtH = () => {
        const w = parseFloat(wthWaist);
        const h = parseFloat(wthHeight);
        if (!w || !h || h === 0) return;
        const ratio = (w / h).toFixed(2);
        setWthResult(ratio);
        if (ratio <= 0.5) setWthMsg(lang === 'hi' ? 'स्वस्थ' : 'Healthy');
        else if (ratio <= 0.60) setWthMsg(lang === 'hi' ? 'बढ़ा हुआ जोखिम' : 'Increased Risk');
        else setWthMsg(lang === 'hi' ? 'उच्च जोखिम' : 'High Risk');
    };

    // BFP State
    const [bfpGender, setBfpGender] = useState('male');
    const [bfpHeight, setBfpHeight] = useState('');
    const [bfpWaist, setBfpWaist] = useState('');
    const [bfpNeck, setBfpNeck] = useState('');
    const [bfpHip, setBfpHip] = useState('');
    const [bfpResult, setBfpResult] = useState(null);
    const [bfpMsg, setBfpMsg] = useState('');

    const calculateBFP = () => {
        const h = parseFloat(bfpHeight);
        const w = parseFloat(bfpWaist);
        const n = parseFloat(bfpNeck);
        if (!h || !w || !n || h <= 0 || w <= n) return;
        let bfp;
        if (bfpGender === 'male') {
            bfp = 495 / (1.0324 - 0.19077 * Math.log10(w - n) + 0.15456 * Math.log10(h)) - 450;
        } else {
            const hip = parseFloat(bfpHip);
            if (!hip) return;
            bfp = 495 / (1.29579 - 0.35004 * Math.log10(w + hip - n) + 0.22100 * Math.log10(h)) - 450;
        }
        const val = bfp.toFixed(1);
        setBfpResult(val);
        // Category thresholds differ by gender
        if (bfpGender === 'male') {
            if (bfp < 6) setBfpMsg(lang === 'hi' ? 'आवश्यक वसा' : 'Essential Fat');
            else if (bfp < 14) setBfpMsg(lang === 'hi' ? 'एथलीट' : 'Athlete');
            else if (bfp < 18) setBfpMsg(lang === 'hi' ? 'फिटनेस' : 'Fitness');
            else if (bfp < 25) setBfpMsg(lang === 'hi' ? 'स्वीकार्य' : 'Acceptable');
            else setBfpMsg(lang === 'hi' ? 'मोटापा (Obese)' : 'Obese');
        } else {
            if (bfp < 14) setBfpMsg(lang === 'hi' ? 'आवश्यक वसा' : 'Essential Fat');
            else if (bfp < 21) setBfpMsg(lang === 'hi' ? 'एथलीट' : 'Athlete');
            else if (bfp < 25) setBfpMsg(lang === 'hi' ? 'फिटनेस' : 'Fitness');
            else if (bfp < 32) setBfpMsg(lang === 'hi' ? 'स्वीकार्य' : 'Acceptable');
            else setBfpMsg(lang === 'hi' ? 'मोटापा (Obese)' : 'Obese');
        }
    };

    const t = (en, hi) => (lang === 'hi' ? hi : en);

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            {/* Header */}
            <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="font-black text-gray-900 text-lg tracking-tight">
                            {t('Health Library', 'स्वास्थ्य पुस्तकालय')}
                        </h1>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">
                            {t('Safe & Healthy Living', 'सुरक्षित और स्वस्थ जीवन')}
                        </p>
                    </div>
                </div>
                <div className="w-10 h-10 bg-teal-50 rounded-2xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-teal-600" />
                </div>
            </nav>

            <main className="max-w-4xl mx-auto p-6 space-y-8">
                {/* Search Bar */}
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-teal-600 transition-colors" />
                    <input
                        type="text"
                        placeholder={t('Search health topics...', 'स्वास्थ्य विषयों की खोज करें...')}
                        className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-3xl shadow-sm outline-none focus:ring-4 focus:ring-teal-50 focus:border-teal-200 transition-all text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {!selectedCategory ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.values(HEALTH_CONTENT).map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`bg-white border border-gray-100 rounded-[2.5rem] p-6 text-left hover:shadow-xl hover:shadow-${cat.color}-100 hover:border-${cat.color}-200 transition-all duration-300 group relative overflow-hidden`}
                                >
                                    <div className={`absolute -right-6 -bottom-6 w-32 h-32 bg-${cat.color}-50 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500`} />

                                    <div className={`w-14 h-14 bg-${cat.color}-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-${cat.color}-600 transition-colors duration-300`}>
                                        <cat.icon className={`w-7 h-7 text-${cat.color}-600 group-hover:text-white transition-colors duration-300`} />
                                    </div>

                                    <h2 className="text-xl font-black text-gray-900 mb-2">{t(cat.title.en, cat.title.hi)}</h2>
                                    <p className="text-xs text-gray-400 font-bold leading-relaxed mb-6 italic">{t(cat.description.en, cat.description.hi)}</p>

                                    <div className="flex items-center gap-2 text-teal-600 font-black text-[10px] uppercase tracking-widest">
                                        {t('Learn More', 'अधिक जानें')} <ChevronRight className="w-4 h-4" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* BMI Calculator Tool */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <Activity className="w-6 h-6 text-teal-600" />
                                <h3 className="text-xl font-black text-gray-900">{t('BMI Calculator', 'बीएमआई कैलकुलेटर')}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Weight (kg)', 'वजन (किग्रा)')}</label>
                                    <input
                                        type="number"
                                        placeholder="70"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-bold"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Height (cm)', 'ऊंचाई (सेमी)')}</label>
                                    <input
                                        type="number"
                                        placeholder="170"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-teal-500/20 transition-all font-bold"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={calculateBMI}
                                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-2xl transition shadow-lg shadow-teal-600/20 active:scale-95"
                                    >
                                        {t('Calculate', 'गणना करें')}
                                    </button>
                                </div>
                            </div>

                            <AnimatePresence>
                                {bmi && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-8 p-6 bg-teal-50 rounded-3xl border border-teal-100 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1">{t('YOUR BMI RESULT', 'आपका बीएमआई परिणाम')}</p>
                                            <h4 className="text-2xl font-black text-teal-900">{bmi}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${bmiMsg.includes('Normal') || bmiMsg.includes('सामान्य') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {bmiMsg}
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* WtH Ratio Calculator */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                                    <Activity className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{t('Waist-to-Height Ratio', 'कमर-ऊंचाई अनुपात')}</h3>
                                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{t('Abdominal Obesity & Cardiovascular Risk', 'पेट की चर्बी और हृदय जोखिम')}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mb-6 ml-1">{t('Use the same unit (cm or inches) for both measurements.', 'दोनों मापों में एक ही इकाई (सेमी या इंच) का उपयोग करें।')}</p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Waist Circumference', 'कमर की परिधि')}</label>
                                    <input
                                        type="number"
                                        placeholder={t('e.g. 80 cm', 'जैसे 80 सेमी')}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                                        value={wthWaist}
                                        onChange={(e) => setWthWaist(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Height', 'ऊंचाई')}</label>
                                    <input
                                        type="number"
                                        placeholder={t('e.g. 170 cm', 'जैसे 170 सेमी')}
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all font-bold"
                                        value={wthHeight}
                                        onChange={(e) => setWthHeight(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <button
                                        onClick={calculateWtH}
                                        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl transition shadow-lg shadow-indigo-600/20 active:scale-95"
                                    >
                                        {t('Calculate', 'गणना करें')}
                                    </button>
                                </div>
                            </div>

                            {/* WtH Interpretation guide */}
                            <div className="mt-4 flex flex-wrap gap-2">
                                {[
                                    { label: t('≤ 0.50 — Healthy', '≤ 0.50 — स्वस्थ'), color: 'green' },
                                    { label: t('0.51–0.60 — Increased Risk', '0.51–0.60 — बढ़ा जोखिम'), color: 'amber' },
                                    { label: t('≥ 0.61 — High Risk', '≥ 0.61 — उच्च जोखिम'), color: 'red' },
                                ].map((b) => (
                                    <span key={b.label} className={`px-3 py-1 rounded-full text-[10px] font-black bg-${b.color}-50 text-${b.color}-700`}>{b.label}</span>
                                ))}
                            </div>

                            <AnimatePresence>
                                {wthResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-6 p-6 bg-indigo-50 rounded-3xl border border-indigo-100 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">{t('YOUR WtH RATIO', 'आपका WtH अनुपात')}</p>
                                            <h4 className="text-2xl font-black text-indigo-900">{wthResult}</h4>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${
                                            wthMsg === 'Healthy' || wthMsg === 'स्वस्थ' ? 'bg-green-100 text-green-700' :
                                            wthMsg === 'Increased Risk' || wthMsg === 'बढ़ा हुआ जोखिम' ? 'bg-amber-100 text-amber-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>{wthMsg}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Body Fat Percentage Calculator */}
                        <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-violet-50 rounded-2xl flex items-center justify-center">
                                    <HeartPulse className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">{t('Body Fat Percentage', 'शरीर में वसा प्रतिशत')}</h3>
                                    <p className="text-[10px] font-bold text-violet-500 uppercase tracking-widest">{t('U.S. Navy Circumference Method', 'यू.एस. नेवी परिधि विधि')}</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 font-medium mb-6 ml-1">{t('All measurements in centimetres (cm).', 'सभी माप सेंटीमीटर (सेमी) में।')}</p>

                            {/* Gender Toggle */}
                            <div className="flex gap-3 mb-6">
                                {['male', 'female'].map((g) => (
                                    <button
                                        key={g}
                                        onClick={() => { setBfpGender(g); setBfpResult(null); setBfpHip(''); }}
                                        className={`flex-1 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition ${bfpGender === g ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30' : 'bg-gray-50 text-gray-500'}`}
                                    >
                                        {g === 'male' ? t('Male', 'पुरुष') : t('Female', 'महिला')}
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Height (cm)', 'ऊंचाई (सेमी)')}</label>
                                    <input type="number" placeholder="170" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-sm" value={bfpHeight} onChange={(e) => setBfpHeight(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Waist (cm)', 'कमर (सेमी)')}</label>
                                    <input type="number" placeholder="80" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-sm" value={bfpWaist} onChange={(e) => setBfpWaist(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Neck (cm)', 'गर्दन (सेमी)')}</label>
                                    <input type="number" placeholder="37" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-sm" value={bfpNeck} onChange={(e) => setBfpNeck(e.target.value)} />
                                </div>
                                {bfpGender === 'female' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase ml-2">{t('Hip (cm)', 'कूल्हे (सेमी)')}</label>
                                        <input type="number" placeholder="95" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-violet-500/20 font-bold text-sm" value={bfpHip} onChange={(e) => setBfpHip(e.target.value)} />
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={calculateBFP}
                                className="mt-6 w-full py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl transition shadow-lg shadow-violet-600/20 active:scale-95"
                            >
                                {t('Calculate Body Fat %', 'शरीर में वसा % की गणना करें')}
                            </button>

                            <AnimatePresence>
                                {bfpResult && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="mt-6 p-6 bg-violet-50 rounded-3xl border border-violet-100 flex items-center justify-between"
                                    >
                                        <div>
                                            <p className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-1">{t('YOUR BODY FAT', 'आपकी शरीर की वसा')}</p>
                                            <h4 className="text-2xl font-black text-violet-900">{bfpResult}%</h4>
                                        </div>
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${
                                            bfpMsg === 'Obese' || bfpMsg === 'मोटापा (Obese)' ? 'bg-red-100 text-red-700' :
                                            bfpMsg === 'Acceptable' || bfpMsg === 'स्वीकार्य' ? 'bg-amber-100 text-amber-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>{bfpMsg}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Emergency Quick Tips */}
                        <div className="bg-red-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-red-100">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 rounded-xl">
                                        <PlusCircle className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-2xl font-black">{t('Emergency Quick Tips', 'आपातकालीन त्वरित जानकारी')}</h3>
                                </div>
                                <p className="text-red-100 text-sm font-medium mb-6 max-w-md">
                                    {t('Carry this information with you. In case of emergency, call 108 immediately.', 'यह जानकारी अपने साथ रखें। आपात स्थिति में तुरंत 108 पर कॉल करें।')}
                                </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <a href="tel:108" className="px-6 py-3 bg-white text-red-600 rounded-2xl font-black text-center text-sm shadow-lg active:scale-95 transition">
                                        CALL 108
                                    </a>
                                    <button onClick={() => setSelectedCategory(HEALTH_CONTENT.emergency)} className="px-6 py-3 bg-red-700/50 text-white border border-white/20 rounded-2xl font-black text-center text-sm active:scale-95 transition">
                                        {t('VIEW FIRST AID', 'प्राथमिक चिकित्सा देखें')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => setSelectedCategory(null)}
                                className="px-4 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black text-gray-500 hover:text-teal-600 transition flex items-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" /> {t('BACK', 'वापस')}
                            </button>
                            <div className={`p-3 bg-${selectedCategory.color}-50 rounded-2xl`}>
                                <selectedCategory.icon className={`w-6 h-6 text-${selectedCategory.color}-600`} />
                            </div>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-3xl font-black text-gray-900">{t(selectedCategory.title.en, selectedCategory.title.hi)}</h2>
                            <p className="text-sm text-gray-400 font-bold mt-1 tracking-wider">{t(selectedCategory.description.en, selectedCategory.description.hi)}</p>
                        </div>

                        <div className="space-y-4">
                            {selectedCategory.topics.map((topic, i) => (
                                <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm overflow-hidden">
                                    <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3">
                                        <span className={`w-8 h-8 bg-${selectedCategory.color}-50 text-${selectedCategory.color}-600 rounded-full flex items-center justify-center text-xs`}>{i + 1}</span>
                                        {t(topic.name.en, topic.name.hi)}
                                    </h3>
                                    <ul className="space-y-3">
                                        {topic.steps[lang === 'hi' ? 'hi' : 'en'].map((step, si) => (
                                            <li key={si} className="flex gap-3 text-sm text-gray-600 font-medium leading-relaxed">
                                                <CheckCircle2 className={`w-5 h-5 text-${selectedCategory.color}-500 shrink-0 mt-0.5`} />
                                                {step}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

function CheckCircle2({ className }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="m9 12 2 2 4-4" />
        </svg>
    );
}
