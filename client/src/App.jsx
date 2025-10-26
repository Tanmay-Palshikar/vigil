import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- API Service ---
// Configures a central Axios instance for all API calls.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://vigil-ai-backend2.onrender.com', // Ensure this port matches your backend server
});

// Axios interceptor to automatically add the JWT token to every request header.
api.interceptors.request.use(config => {
    const token = localStorage.getItem('vigil_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// --- Authentication Context ---
// Manages user authentication state throughout the application.
const AuthContext = createContext();

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('vigil_token'));
    const [loading, setLoading] = useState(true);

    const login = (newToken) => {
        localStorage.setItem('vigil_token', newToken);
        setToken(newToken);
        setUser({ loggedIn: true });
    };

    const logout = () => {
        localStorage.removeItem('vigil_token');
        setToken(null);
        setUser(null);
    };

    useEffect(() => {
        if (token) {
            setUser({ loggedIn: true });
        }
        setLoading(false);
    }, [token]);

    const value = { user, token, login, logout, api, isLoggedIn: !!user };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

const useAuth = () => useContext(AuthContext);

// --- Main App Components ---

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/auth/login', { email, password });
            login(response.data.token);
            navigate('/');
        } catch (err) {
            setError('Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-mono p-4">
            <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-cyan-500/30">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">VIGIL</h1>
                    <p className="mt-2 text-gray-400">System Authentication</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                     <div>
                        <label htmlFor="email" className="text-sm font-bold text-gray-400 tracking-wider">Email Address</label>
                        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-4 py-2 mt-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    </div>
                    <div>
                        <label htmlFor="password" className="text-sm font-bold text-gray-400 tracking-wider">Password</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-4 py-2 mt-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    </div>
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full px-4 py-2 font-bold text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-600 transition-colors duration-300">
                            {loading ? 'Authenticating...' : 'Secure Login'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm text-gray-400">
                    <p>Don't have an account? <a href="/register" className="font-medium text-cyan-400 hover:text-cyan-300">Request access</a></p>
                </div>
            </div>
        </div>
    );
}

// ==================================================================
// == NEW: REGISTRATION PAGE WITH INTEGRATED PROFILE SETUP       ==
// ==================================================================
function RegisterPage() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        companyName: '',
        primaryWebsiteUrl: '',
        trustedUrls: [''],
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTrustedUrlChange = (index, value) => {
        const newUrls = [...formData.trustedUrls];
        newUrls[index] = value;
        setFormData(prev => ({ ...prev, trustedUrls: newUrls }));
    };

    const addTrustedUrl = () => {
        setFormData(prev => ({ ...prev, trustedUrls: [...prev.trustedUrls, ''] }));
    };
    
    const removeTrustedUrl = (index) => {
        if (formData.trustedUrls.length <= 1) return;
        const newUrls = formData.trustedUrls.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, trustedUrls: newUrls }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }

        try {
            // Send all form data to the unified register endpoint
            const payload = {
                ...formData,
                // Filter out empty strings before sending
                trustedUrls: formData.trustedUrls.filter(url => url.trim() !== ''),
            };
            const response = await api.post('/auth/register', payload);
            login(response.data.token);
            // Navigate directly to the dashboard after successful registration and profile creation
            navigate('/'); 
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    
     return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-mono p-4">
            <div className="w-full max-w-xl p-8 space-y-6 bg-gray-800 rounded-lg shadow-lg border border-cyan-500/30">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-cyan-400 tracking-wider">VIGIL</h1>
                    <p className="mt-2 text-gray-400">Create Your Monitoring Profile</p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2">Account Credentials</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-bold text-gray-400">Email Address</label>
                            <input name="email" type="email" value={formData.email} onChange={handleInputChange} required className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                        </div>
                        <div>
                            <label className="text-sm font-bold text-gray-400">Password</label>
                            <input name="password" type="password" value={formData.password} onChange={handleInputChange} required className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-300 border-b border-gray-600 pb-2 pt-4">Company Details</h3>
                    <div>
                        <label className="text-sm font-bold text-gray-400">Company Name</label>
                        <input name="companyName" value={formData.companyName} onChange={handleInputChange} required className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    </div>
                    <div>
                        <label className="text-sm font-bold text-gray-400">Primary Website URL (for SSL checks)</label>
                        <input name="primaryWebsiteUrl" type="url" value={formData.primaryWebsiteUrl} onChange={handleInputChange} required placeholder="https://your-company.com" className="w-full px-4 py-2 mt-1 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-gray-400">Trusted News/Info URLs (for AI scanning)</label>
                        {formData.trustedUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input value={url} onChange={(e) => handleTrustedUrlChange(index, e.target.value)} placeholder="https://trusted-source.com/your-company" className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                                {formData.trustedUrls.length > 1 && (
                                    <button type="button" onClick={() => removeTrustedUrl(index)} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 text-sm">-</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={addTrustedUrl} className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-500">+ Add URL</button>
                    </div>

                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    <div>
                        <button type="submit" disabled={loading} className="w-full px-4 py-2 mt-2 font-bold text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:bg-gray-600 transition-colors duration-300">
                            {loading ? 'Creating Account...' : 'Create Account & Start Scan'}
                        </button>
                    </div>
                </form>
                <div className="text-center text-sm text-gray-400">
                    <p>Already have access? <a href="/login" className="font-medium text-cyan-400 hover:text-cyan-300">Log in here</a></p>
                </div>
            </div>
        </div>
    );
}

// ==================================================================
// == NEW: PAGE FOR EDITING AN EXISTING PROFILE                  ==
// ==================================================================
function ProfileEditPage() {
    const [profile, setProfile] = useState({
        companyName: '',
        clientIndustry: '',
        monitoredUrls: [''],
        monitoredComplianceRegs: [''],
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const { api } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/profile');
                if (response.data.data) {
                    setProfile({
                        companyName: response.data.data.companyName || '',
                        clientIndustry: response.data.data.clientIndustry || '',
                        monitoredUrls: response.data.data.monitoredUrls?.length > 0 ? response.data.data.monitoredUrls : [''],
                        monitoredComplianceRegs: response.data.data.monitoredComplianceRegs?.length > 0 ? response.data.data.monitoredComplianceRegs : [''],
                    });
                }
            } catch (err) {
                setError('Failed to load your profile.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [api]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleListChange = (index, value, listName) => {
        const newList = [...profile[listName]];
        newList[index] = value;
        setProfile(prev => ({ ...prev, [listName]: newList }));
    };

    const addListItem = (listName) => {
        setProfile(prev => ({ ...prev, [listName]: [...prev[listName], ''] }));
    };

    const removeListItem = (index, listName) => {
        if (profile[listName].length <= 1) return;
        const newList = profile[listName].filter((_, i) => i !== index);
        setProfile(prev => ({ ...prev, [listName]: newList }));
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const payload = {
                ...profile,
                monitoredUrls: profile.monitoredUrls.filter(url => url.trim() !== ''),
                monitoredComplianceRegs: profile.monitoredComplianceRegs.filter(reg => reg.trim() !== ''),
            };
            await api.post('/profile', payload); // Backend should handle create or update
            navigate('/'); // Go back to dashboard after saving
        } catch (err) {
            setError('Failed to save profile. Please check your inputs and try again.');
        } finally {
            setSaving(false);
        }
    };
    
    if (loading) {
        return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Loading Profile...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center font-mono p-4">
            <div className="w-full max-w-2xl p-8 space-y-8 bg-gray-800 rounded-lg shadow-lg border border-cyan-500/30">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-cyan-400 tracking-wider">Edit Your Profile</h1>
                    <p className="mt-2 text-gray-400">Update the context for your AI analysis.</p>
                </div>
                <form onSubmit={handleProfileSave} className="space-y-6">
                    <div>
                        <label className="text-sm font-bold text-gray-400">Company Name</label>
                        <input name="companyName" value={profile.companyName} onChange={handleInputChange} required className="w-full px-4 py-2 mt-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    </div>
                     <div>
                        <label className="text-sm font-bold text-gray-400">Client Industry (e.g., FinTech, Healthcare)</label>
                        <input name="clientIndustry" value={profile.clientIndustry} onChange={handleInputChange} required className="w-full px-4 py-2 mt-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-gray-400">Monitored URLs</label>
                         <p className="text-xs text-gray-500">The first URL should be your company's primary website for SSL checks.</p>
                        {profile.monitoredUrls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input value={url} onChange={(e) => handleListChange(index, e.target.value, 'monitoredUrls')} placeholder={index === 0 ? "https://your-company.com (Primary for SSL)" : "https://trusted-news-source.com"} className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                                {profile.monitoredUrls.length > 1 && (
                                    <button type="button" onClick={() => removeListItem(index, 'monitoredUrls')} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 text-sm">-</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addListItem('monitoredUrls')} className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-500">+ Add URL</button>
                    </div>
                    <div className="space-y-2">
                         <label className="text-sm font-bold text-gray-400">Compliance Regulations (e.g., GDPR, HIPAA)</label>
                        {profile.monitoredComplianceRegs.map((reg, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input value={reg} onChange={(e) => handleListChange(index, e.target.value, 'monitoredComplianceRegs')} placeholder="Regulation Name" className="w-full px-4 py-2 mt-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"/>
                                {profile.monitoredComplianceRegs.length > 1 && (
                                    <button type="button" onClick={() => removeListItem(index, 'monitoredComplianceRegs')} className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 text-sm">-</button>
                                )}
                            </div>
                        ))}
                        <button type="button" onClick={() => addListItem('monitoredComplianceRegs')} className="px-4 py-2 text-sm bg-cyan-600 text-white rounded-md hover:bg-cyan-500">+ Add Regulation</button>
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex gap-4">
                        <button type="button" onClick={() => navigate('/')} className="w-full px-4 py-2 font-bold text-cyan-400 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors duration-300">
                            Cancel
                        </button>
                        <button type="submit" disabled={saving} className="w-full px-4 py-2 font-bold text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-300 disabled:bg-gray-600 transition-colors duration-300">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DashboardPage() {
    const { logout, api } = useAuth();
    const navigate = useNavigate();

    const [incidents, setIncidents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState('');
    const [profileData, setProfileData] = useState(null);
    const [sslStatus, setSslStatus] = useState({ loading: true, data: null, error: null });

    const fetchIncidents = useCallback(async () => {
        try {
            const response = await api.get('/scan/history');
            setIncidents(response.data.data || []);
            setError(null);
        } catch (err) {
            console.error("Failed to load incidents:", err);
            setError("Failed to load incidents.");
        }
    }, [api]);

    useEffect(() => {
        const checkProfileAndFetch = async () => {
            setLoading(true);
            setSslStatus({ loading: true, data: null, error: null });
            try {
                const profileResponse = await api.get('/profile');
                const profile = profileResponse.data.data;
                if (profile && profile.companyName) { // Check if profile is complete
                    setProfileData(profile);
                    fetchIncidents();
                    
                    const primaryUrl = profile.monitoredUrls?.[0];
                    if (primaryUrl) {
                        try {
                            const sslResponse = await api.post('/scan/check-ssl', { url: primaryUrl });
                            setSslStatus({ loading: false, data: sslResponse.data, error: null });
                        } catch (sslErr) {
                            setSslStatus({ loading: false, data: null, error: 'Failed to check SSL.' });
                        }
                    } else {
                         setSslStatus({ loading: false, data: null, error: 'No primary URL set.' });
                    }
                } else {
                    // If profile is incomplete, force user to edit it.
                    navigate('/edit-profile');
                }
            } catch (err) {
                if (err.response && err.response.status === 404) {
                    // Should not happen with new registration flow, but good fallback
                    navigate('/register'); 
                } else {
                    setError("Failed to verify user profile.");
                }
            } finally {
                setLoading(false);
            }
        };
        checkProfileAndFetch();
    }, [api, navigate, fetchIncidents]);
    
    const handleStartScan = async () => {
        if (!profileData) {
            setScanStatus('Profile data not loaded.');
            return;
        }

        setIsScanning(true);
        setScanStatus('Initiating intelligent scan...');
        try {
            const scanPayload = {
                companyName: profileData.companyName,
                primaryWebsiteUrl: profileData.monitoredUrls?.[0] || '',
                trustedUrls: profileData.monitoredUrls?.slice(1) || [] 
            };
            
            const response = await api.post('/scan/start', scanPayload);

            setScanStatus(`Scan complete! Found ${response.data.createdCount} new incidents.`);
            fetchIncidents();
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Scan failed.';
            setScanStatus(errorMessage);
            console.error("Scan API call failed:", err.response || err);
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white font-mono">
            <header className="bg-gray-800/50 backdrop-blur-sm border-b border-cyan-500/20 p-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-cyan-400 tracking-wider">VIGIL DASHBOARD</h1>
                    <p className="text-xs text-gray-400">{profileData?.companyName}</p>
                </div>
                <div>
                    <button onClick={() => navigate('/edit-profile')} className="px-4 py-2 text-sm bg-gray-700 text-white rounded-md hover:bg-gray-600 mr-4">Edit Profile</button>
                    <button onClick={() => { logout(); navigate('/login'); }} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500">Logout</button>
                </div>
            </header>
            <main className="p-4 sm:p-8">
                {loading ? <div className="text-center text-cyan-400">Loading Dashboard...</div> : 
                <>
                     <div className="mb-8">
                        <ScanControl 
                            onStartScan={handleStartScan} 
                            isScanning={isScanning} 
                            scanStatus={scanStatus}
                            disabled={!profileData || isScanning} 
                        />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <RiskList incidents={incidents} loading={incidents.length === 0 && !error} error={error} />
                        </div>
                        <div className="space-y-8">
                            <SslStatusWidget status={sslStatus} url={profileData?.monitoredUrls?.[0]} />
                            <RiskChart incidents={incidents} />
                        </div>
                    </div>
                </>
                }
            </main>
        </div>
    );
}

function SslStatusWidget({ status, url }) {
    let content;
    let borderColor = 'border-cyan-500/20';
    
    if (status.loading) {
        content = <p className="text-gray-400 animate-pulse">Checking...</p>;
    } else if (status.error) {
        content = <p className="text-red-400">{status.error}</p>;
        borderColor = 'border-red-500/30';
    } else if (status.data) {
        const { daysRemaining } = status.data;
        const daysText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`;
        
        let statusColor = 'text-green-400';
        borderColor = 'border-green-500/30';
        if (daysRemaining < 14) {
            statusColor = 'text-red-400';
            borderColor = 'border-red-500/30';
        } else if (daysRemaining < 30) {
            statusColor = 'text-yellow-400';
            borderColor = 'border-yellow-500/30';
        }

        content = (
            <div className="text-center">
                <p className={`text-4xl font-bold ${statusColor}`}>{daysText}</p>
                <p className="text-sm text-gray-400">remaining</p>
            </div>
        );
    }

    return (
        <div className={`bg-gray-800 p-6 rounded-lg border ${borderColor} transition-all duration-300`}>
            <h2 className="text-xl font-bold text-cyan-400 mb-2">Primary Site SSL</h2>
            <p className="text-xs text-gray-500 truncate mb-4">{url || 'No primary URL specified'}</p>
            <div className="flex items-center justify-center h-20">
                {content}
            </div>
        </div>
    );
}

function ScanControl({ onStartScan, isScanning, scanStatus, disabled }) {
     return (
        <div className="bg-gray-800 p-6 rounded-lg border border-cyan-500/20 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-bold text-cyan-400">System Scanner</h2>
                <p className="text-sm text-gray-400 mt-1">Trigger an on-demand intelligent scan of your assets.</p>
            </div>
            <div className="text-right">
                <button onClick={onStartScan} disabled={disabled} className="px-6 py-2 font-bold text-gray-900 bg-cyan-400 rounded-md hover:bg-cyan-300 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-300">
                    {isScanning ? 'Scanning...' : 'Start Intelligent Scan'}
                </button>
                 {scanStatus && <p className="text-xs text-gray-400 mt-2 h-4">{scanStatus}</p>}
            </div>
        </div>
    );
}

function RiskList({ incidents, loading, error }) {
    if (loading) return <div className="text-center p-8 text-cyan-400">Loading risk data...</div>;
    if (error) return <div className="text-center p-8 text-red-400">{error}</div>;

    return (
        <div className="bg-gray-800 p-6 rounded-lg border border-cyan-500/20">
             <h2 className="text-xl font-bold text-cyan-400 mb-4">Detected Risk Incidents</h2>
             <div className="space-y-4">
                 {incidents.length > 0 ? (
                    incidents.map(incident => <RiskItem key={incident._id} incident={incident} />)
                 ) : (
                    <p className="text-gray-400">No risk incidents detected yet. Run a scan to begin.</p>
                 )}
             </div>
        </div>
    );
}

function RiskItem({ incident }) {
    const levelColor = {
        'High': 'bg-red-500/20 text-red-400 border-red-500',
        'Medium': 'bg-yellow-500/20 text-yellow-400 border-yellow-500',
        'Low': 'bg-cyan-500/20 text-cyan-400 border-cyan-500',
    };
    
    const riskLevel = incident.aiAnalysis?.riskLevel || 'Low';
    
    return (
        <div className="bg-gray-900/50 p-4 rounded-md border border-gray-700 hover:border-cyan-500 transition-colors duration-300">
            <div className="flex justify-between items-start gap-4">
                <div className="flex-shrink-0">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${levelColor[riskLevel]}`}>{riskLevel}</span>
                    <p className="text-sm text-gray-400 mt-2">Category: <span className="font-semibold text-gray-300">{incident.aiAnalysis?.riskCategory || 'N/A'}</span></p>
                </div>
                <div className="text-right flex-grow min-w-0">
                     <a href={incident.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-cyan-400 hover:underline truncate block">{incident.sourceUrl}</a>
                </div>
            </div>
            <div className="mt-4">
                 <h3 className="font-bold text-gray-200">Justification</h3>
                 <p className="text-sm text-gray-400 mt-1">{incident.aiAnalysis?.justification || 'No justification provided.'}</p>
            </div>
            <div className="mt-4">
                 <h3 className="font-bold text-gray-200">Mitigation Strategy</h3>
                 <p className="text-sm text-gray-400 mt-1">{incident.aiAnalysis?.mitigationStrategy || 'No mitigation strategy provided.'}</p>
            </div>
        </div>
    );
}

function RiskChart({ incidents }) {
    const data = [
        { name: 'Reputational', count: incidents.filter(i => i.aiAnalysis?.riskCategory === 'Reputational').length, fill: '#ef4444' },
        { name: 'Security', count: incidents.filter(i => i.aiAnalysis?.riskCategory === 'Security').length, fill: '#facc15' },
        { name: 'Compliance', count: incidents.filter(i => i.aiAnalysis?.riskCategory === 'Compliance').length, fill: '#22d3ee' },
    ];
    
    return (
         <div className="bg-gray-800 p-6 rounded-lg border border-cyan-500/20 h-full">
             <h2 className="text-xl font-bold text-cyan-400 mb-4">Risk Distribution</h2>
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)"/>
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12}/>
                    <YAxis stroke="#9ca3af" fontSize={12} allowDecimals={false}/>
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}/>
                    <Bar dataKey="count" >
                        {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

// --- Routing and Protected Routes ---
function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}

function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            {/* REMOVED: /setup-profile is no longer a separate step */}
            {/* NEW: Route for editing the profile */}
            <Route path="/edit-profile" element={
                <ProtectedRoute>
                    <ProfileEditPage />
                </ProtectedRoute>
            } />
            <Route path="/" element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } />
        </Routes>
    );
}

// AppWrapper to provide context to the whole app
export function AppWrapper() {
    return (
        <Router>
            <AuthProvider>
                <App />
            </AuthProvider>
        </Router>
    );
}

export default AppWrapper;

