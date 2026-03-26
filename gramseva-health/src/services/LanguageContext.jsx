import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
    en: {
        // Navbar
        appName: 'GramSeva Health',
        patientDashboard: 'Patient Dashboard',
        logout: 'Logout',

        // Greetings
        goodMorning: 'Good Morning',
        goodAfternoon: 'Good Afternoon',
        goodEvening: 'Good Evening',
        namaste: 'Namaste',
        howAreYou: 'How are you feeling today?',

        // Quick Triage
        quickAiCheck: 'Quick AI Health Check',
        tellSymptoms: 'Tell your symptoms',
        symptomPlaceholder: 'e.g. fever, headache, cough...',
        check: 'Check',
        prediction: 'AI Prediction',
        confidence: 'confidence',
        quickAdvice: '💡 Quick Advice',
        viewFullReport: 'View Full Report',
        emergency: '⚠️ EMERGENCY — Call 108 immediately!',

        // Feature Cards
        services: 'Services',
        aiAnalysis: 'AI Analysis',
        aiAnalysisDesc: 'Full AI Health Analysis',
        findDoctors: 'Find Doctors',
        findDoctorsDesc: 'Find Nearby Doctors',
        videoCall: 'Video Call',
        videoCallDesc: 'Talk to Doctor Online',
        records: 'Records',
        recordsDesc: 'Your Health Records',
        medicines: 'Know Medicines',
        medicinesDesc: 'Medicine Information',
        sos: '🚨 SOS',
        sosDesc: 'Emergency Help',
        healthNews: 'Health News',
        healthNewsDesc: 'Govt. Health Updates',
        hospitals: 'Govt. Hospitals',
        hospitalsDesc: 'Hospital Directory',

        // Helplines
        helplines: 'Important Helplines',
        ambulance: 'Ambulance',
        healthHelpline: 'Health Helpline',
        womenHelpline: 'Women Helpline',
        childHelpline: 'Child Helpline',

        // History
        recentConsultations: 'Recent Consultations',
        noConsultations: 'No consultations yet',
        records_count: 'records',

        // Health Tips
        dailyHealthTip: '💡 Daily Health Tip',
        tips: [
            'Drink 8 glasses of water daily',
            'Eat green vegetables with every meal',
            'Walk for 30 minutes every morning',
            'Sleep 7-8 hours every night',
            'Get all vaccinations done',
        ],

        // Footer
        footerText: 'AI-powered healthcare for rural India 🇮🇳',
        footerDisclaimer: 'This is an AI assistant, please visit a doctor',

        // Symptom Chips
        chips: ['Fever', 'Headache', 'Cough', 'Stomach Pain', 'Weakness'],

        // Symptom Input Page
        symptomAnalysis: 'AI Symptom Analysis',
        poweredBy: 'Powered by Medical AI',
        connecting: 'Connecting',
        mlServerOnline: 'ML Server Online',
        offlineMode: 'Offline Mode',
        describeSymptoms: 'Describe Your Symptoms',
        describeHint: 'You can describe in English or Hindi',
        analyzing: 'Analyzing your symptoms...',
        analyzeBtn: 'Analyze Symptoms',
        emergencyDetected: '⚠️ EMERGENCY DETECTED',
        emergencyCall: 'Call 108 (Ambulance) immediately! Do not delay.',
        aiDiagnosis: 'AI Diagnosis',
        otherPossibilities: 'Other Possibilities',
        medicalSummary: 'Medical Analysis Summary',
        immediateAdvice: 'Immediate Advice',
        warningSignsLabel: 'Warning Signs',
        generatingReport: 'Generating Detailed Report...',
        reportSubtitle: 'AI is analyzing — this takes a few seconds',
        detailedReport: 'Detailed Medical Report',
        reportSections: '12-section comprehensive analysis',
        findSpecialist: 'Find',

        // News page
        newsTitle: 'Health News & Updates',
        newsSubtitle: 'Latest government health schemes and updates',
        readMore: 'Read More',
        source: 'Source',

        // Hospital page
        hospitalTitle: 'Government Hospitals',
        hospitalSubtitle: 'Find nearby government hospitals and health centers',
        searchHospital: 'Search by name, city, or state...',
        allStates: 'All States',
        beds: 'Beds',
        phone: 'Phone',
        address: 'Address',
        specialities: 'Specialities',

        // Video Call
        videoConsultation: 'Video Consultation',
        connected: 'Connected',
        liveAiTranslation: 'Live AI Translation',
        translating: 'Translating...',
        patient: 'Patient',
        doctor: 'Doctor',
        endCall: 'End Call',
        switchLangV: 'Switch AI Translation Language',
        noResults: 'No hospitals found matching your search',

        // Language
        language: 'English',
        switchLang: 'हिंदी',

        // Premium Dashboard
        vitalsTitle: 'Your Health Vitals',
        heartRate: 'Heart Rate',
        bloodPressure: 'Blood Pressure',
        spo2: 'SpO2 (Oxygen)',
        healthScore: 'Daily Health Score',
        scoreLabel: 'Overall wellness based on your activity and vitals',
        bmiCalc: 'BMI Calculator',
        weight: 'Weight (kg)',
        height: 'Height (cm)',
        firstAidTitle: 'First Aid Guide',
        firstAidSubtitle: 'What to do in emergencies',
        medReminders: 'Medicine Reminders',
        addMed: 'Add Medicine',
        waterGlasses: 'Glasses of Water',
        sleepHrs: 'Hours of Sleep',
        bpm: 'BPM',
        mmhg: 'mmHg',
    },
    hi: {
        // Navbar
        appName: 'ग्रामसेवा स्वास्थ्य',
        patientDashboard: 'मरीज़ डैशबोर्ड',
        logout: 'लॉगआउट',

        // Greetings
        goodMorning: 'सुप्रभात',
        goodAfternoon: 'नमस्कार',
        goodEvening: 'शुभ संध्या',
        namaste: 'नमस्ते',
        howAreYou: 'आज आप कैसा महसूस कर रहे हैं?',

        // Quick Triage
        quickAiCheck: 'AI स्वास्थ्य जांच',
        tellSymptoms: 'अपने लक्षण बताएं',
        symptomPlaceholder: 'जैसे: बुखार, सिर दर्द, खांसी...',
        check: 'जांचें',
        prediction: 'AI अनुमान',
        confidence: 'विश्वास',
        quickAdvice: '💡 तुरंत सलाह',
        viewFullReport: 'पूरी रिपोर्ट देखें',
        emergency: '⚠️ आपातकाल — तुरंत 108 पर कॉल करें!',

        // Feature Cards
        services: 'सेवाएं',
        aiAnalysis: 'AI जांच',
        aiAnalysisDesc: 'पूर्ण AI स्वास्थ्य विश्लेषण',
        findDoctors: 'डॉक्टर खोजें',
        findDoctorsDesc: 'नज़दीकी डॉक्टर ढूंढें',
        videoCall: 'वीडियो कॉल',
        videoCallDesc: 'डॉक्टर से ऑनलाइन बात करें',
        records: 'रिकॉर्ड',
        recordsDesc: 'आपके स्वास्थ्य रिकॉर्ड',
        medicines: 'दवाई जानें',
        medicinesDesc: 'दवाई की जानकारी',
        sos: '🚨 SOS',
        sosDesc: 'आपातकालीन मदद',
        healthNews: 'स्वास्थ्य समाचार',
        healthNewsDesc: 'सरकारी स्वास्थ्य अपडेट',
        hospitals: 'सरकारी अस्पताल',
        hospitalsDesc: 'अस्पताल निर्देशिका',

        // Helplines
        helplines: 'ज़रूरी हेल्पलाइन नंबर',
        ambulance: 'एम्बुलेंस',
        healthHelpline: 'स्वास्थ्य हेल्पलाइन',
        womenHelpline: 'महिला हेल्पलाइन',
        childHelpline: 'बाल हेल्पलाइन',

        // History
        recentConsultations: 'पिछली जांच',
        noConsultations: 'अभी तक कोई जांच नहीं',
        records_count: 'रिकॉर्ड',

        // Health Tips
        dailyHealthTip: '💡 आज की स्वास्थ्य टिप',
        tips: [
            'रोज़ 8 गिलास पानी पिएं',
            'हर खाने में हरी सब्ज़ी खाएं',
            'सुबह 30 मिनट टहलें',
            'रोज़ 7-8 घंटे की नींद लें',
            'सभी टीके लगवाएं',
        ],

        // Footer
        footerText: 'ग्रामीण भारत के लिए AI स्वास्थ्य सेवा 🇮🇳',
        footerDisclaimer: 'यह AI सहायक है, कृपया डॉक्टर से ज़रूर मिलें',

        // Symptom Chips
        chips: ['बुखार', 'सिर दर्द', 'खांसी', 'पेट दर्द', 'कमज़ोरी'],

        // Symptom Input Page
        symptomAnalysis: 'AI लक्षण विश्लेषण',
        poweredBy: 'Medical AI द्वारा संचालित',
        connecting: 'कनेक्ट हो रहा है',
        mlServerOnline: 'ML सर्वर ऑनलाइन',
        offlineMode: 'ऑफ़लाइन मोड',
        describeSymptoms: 'अपने लक्षण बताएं',
        describeHint: 'हिंदी या अंग्रेज़ी में बता सकते हैं',
        analyzing: 'आपके लक्षणों का विश्लेषण हो रहा है...',
        analyzeBtn: 'लक्षण जांचें',
        emergencyDetected: '⚠️ आपातकाल',
        emergencyCall: 'तुरंत 108 (एम्बुलेंस) पर कॉल करें! देरी न करें।',
        aiDiagnosis: 'AI निदान',
        otherPossibilities: 'अन्य संभावनाएं',
        medicalSummary: 'चिकित्सा विश्लेषण सारांश',
        immediateAdvice: 'तुरंत सलाह',
        warningSignsLabel: 'चेतावनी के संकेत',
        generatingReport: 'विस्तृत रिपोर्ट तैयार हो रही है...',
        reportSubtitle: 'AI विश्लेषण कर रहा है — कुछ सेकंड लगेंगे',
        detailedReport: 'विस्तृत चिकित्सा रिपोर्ट',
        reportSections: '12-खंड व्यापक विश्लेषण',
        findSpecialist: 'खोजें',

        // News page
        newsTitle: 'स्वास्थ्य समाचार और अपडेट',
        newsSubtitle: 'सरकारी स्वास्थ्य योजनाओं की नवीनतम जानकारी',
        readMore: 'और पढ़ें',
        source: 'स्रोत',

        // Hospital page
        hospitalTitle: 'सरकारी अस्पताल',
        hospitalSubtitle: 'नज़दीकी सरकारी अस्पताल और स्वास्थ्य केंद्र खोजें',
        searchHospital: 'नाम, शहर या राज्य से खोजें...',
        allStates: 'सभी राज्य',
        beds: 'बेड',
        phone: 'फ़ोन',
        address: 'पता',
        specialities: 'विशेषताएं',

        // Video Call
        videoConsultation: 'वीडियो परामर्श',
        connected: 'जुड़ा हुआ',
        liveAiTranslation: 'लाइव AI अनुवाद',
        translating: 'अनुवाद हो रहा है...',
        patient: 'मरीज',
        doctor: 'डॉक्टर',
        endCall: 'कॉल समाप्त करें',
        switchLangV: 'AI अनुवाद की भाषा बदलें',
        noResults: 'आपकी खोज से कोई अस्पताल नहीं मिला',

        // Language
        language: 'हिंदी',
        switchLang: 'English',

        // Premium Dashboard
        vitalsTitle: 'आपके स्वास्थ्य वाइटल्स',
        heartRate: 'हृदय गति (Heart Rate)',
        bloodPressure: 'रक्तचाप (Blood Pressure)',
        spo2: 'SpO2 (ऑक्सीजन)',
        healthScore: 'दैनिक स्वास्थ्य स्कोर',
        scoreLabel: 'आपकी गतिविधि और वाइटल्स के आधार पर कल्याण स्कोर',
        bmiCalc: 'BMI कैलकुलेटर',
        weight: 'वज़न (kg)',
        height: 'लंबाई (cm)',
        firstAidTitle: 'प्राथमिक चिकित्सा गाइड',
        firstAidSubtitle: 'आपातकालीन समय में क्या करें',
        medReminders: 'दवाई रिमाइंडर',
        addMed: 'दवाई जोड़ें',
        waterGlasses: 'पानी के गिलास',
        sleepHrs: 'नींद के घंटे',
        bpm: 'BPM',
        mmhg: 'mmHg',
    }
};

export function LanguageProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('gramseva-lang') || 'en');

    useEffect(() => {
        localStorage.setItem('gramseva-lang', lang);
    }, [lang]);

    const t = (key) => translations[lang]?.[key] ?? translations.en[key] ?? key;
    const toggleLang = () => setLang(prev => prev === 'en' ? 'hi' : 'en');

    return (
        <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
    return ctx;
}

export default LanguageContext;
