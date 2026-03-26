import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './services/LanguageContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import SymptomInput from './pages/SymptomInput';
import DoctorSelection from './pages/DoctorSelection';
import VideoCall from './pages/VideoCall';
import Prescription from './pages/Prescription';
import AdminPanel from './pages/AdminPanel';
import HealthNews from './pages/HealthNews';
import HospitalDirectory from './pages/HospitalDirectory';
import SkinScan from './pages/SkinScan';
import HealthLibrary from './pages/HealthLibrary';

// ── Error Boundary ──────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('GramSeva Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
                }}>
                    <div style={{ textAlign: 'center', maxWidth: 400, padding: 32 }}>
                        <div style={{
                            width: 64, height: 64, margin: '0 auto 16px',
                            background: '#fee2e2', borderRadius: 16,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28
                        }}>⚠️</div>
                        <h2 style={{ color: '#1e293b', fontWeight: 800, marginBottom: 8 }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                            The application encountered an error. Please refresh to try again.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button
                                onClick={() => window.location.reload()}
                                style={{
                                    padding: '10px 24px', background: '#0d9488', color: 'white',
                                    border: 'none', borderRadius: 12, fontWeight: 700, cursor: 'pointer',
                                    fontSize: 14
                                }}>
                                🔄 Refresh Page
                            </button>
                            <button
                                onClick={() => { window.location.href = '/'; }}
                                style={{
                                    padding: '10px 24px', background: '#f1f5f9', color: '#475569',
                                    border: '1px solid #e2e8f0', borderRadius: 12, fontWeight: 700,
                                    cursor: 'pointer', fontSize: 14
                                }}>
                                🏠 Go Home
                            </button>
                        </div>
                        {this.state.error && (
                            <details style={{ marginTop: 24, textAlign: 'left' }}>
                                <summary style={{ color: '#94a3b8', cursor: 'pointer', fontSize: 12 }}>
                                    Error details (for developers)
                                </summary>
                                <pre style={{
                                    background: '#1e293b', color: '#f87171', padding: 12,
                                    borderRadius: 8, fontSize: 11, overflow: 'auto', marginTop: 8,
                                    maxHeight: 200
                                }}>
                                    {this.state.error.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

// ── App ─────────────────────────────────────────────────────────────────
function App() {
    return (
        <ErrorBoundary>
            <LanguageProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/dashboard" element={<PatientDashboard />} />
                        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
                        <Route path="/symptoms" element={<SymptomInput />} />
                        <Route path="/doctors" element={<DoctorSelection />} />
                        <Route path="/video-call/:channelName" element={<VideoCall />} />
                        <Route path="/prescription/:id" element={<Prescription />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/health-news" element={<HealthNews />} />
                        <Route path="/hospitals" element={<HospitalDirectory />} />
                        <Route path="/skin-scan" element={<SkinScan />} />
                        <Route path="/health-library" element={<HealthLibrary />} />
                    </Routes>
                </Router>
            </LanguageProvider>
        </ErrorBoundary>
    );
}

export default App;
