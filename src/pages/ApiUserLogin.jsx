// ApiUserLogin.jsx - Fixed version
import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiUserApiClient from '../utils/apiUserApiClient';
import { FaSignInAlt, FaExclamationTriangle, FaEye, FaEyeSlash, FaShieldAlt } from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';
import AnimatedBackground from '../components/AnimatedBackground';
import HCaptchaWidget from '../components/HCaptchaWidget';
import Toast from '../admin/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function ApiUserLogin({ toggleTheme, theme, onLogin }) {
    const dark = theme !== 'light';
    const [formData, setFormData] = useState({ username: '', apiSecret: '' });
    const [showSecret, setShowSecret] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [toasts, setToasts] = useState([]);
    
    // CAPTCHA state
    const [captchaReady, setCaptchaReady] = useState(false);
    const captchaDataRef = useRef(null);
    const captchaRef = useRef(null);
    
    const formRef = useRef(null);

    const toast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    };

    const resetCaptcha = useCallback(() => {
        captchaDataRef.current = null;
        setCaptchaReady(false);
        captchaRef.current?.reset();
    }, []);

    const handleCaptchaVerify = useCallback((captchaData) => {
        console.log('CAPTCHA verified:', captchaData); // Debug log
        captchaDataRef.current = captchaData;
        setCaptchaReady(true);
    }, []);

    useEffect(() => {
        // Check if already logged in
        const token = localStorage.getItem('apiUserToken');
        if (token) {
            window.location.href = '/api-dashboard';
        }
        
        // Animation
        if (formRef.current) {
            const gsap = window.gsap;
            if (gsap) {
                gsap.fromTo(formRef.current,
                    { opacity: 0, y: 40, scale: 0.95 },
                    { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'power3.out' }
                );
            }
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // ❌ REMOVE THIS LINE - Don't reset captcha before checking!
        // resetCaptcha();
        
        if (!formData.username.trim()) {
            setError('Username is required');
            return;
        }
        if (!formData.apiSecret.trim()) {
            setError('API Secret is required');
            return;
        }
        
        // Check CAPTCHA
        console.log('CAPTCHA data before submit:', captchaDataRef.current); // Debug log
        
        if (!captchaDataRef.current) {
            setError('Please complete the human verification.');
            return;
        }
        
        setLoading(true);
        
        try {
            const response = await apiUserApiClient.post(`${API_URL}/api/api-auth/login`, {
                username: formData.username,
                apiSecret: formData.apiSecret,
                captchaData: captchaDataRef.current,
                hp: '', // Honeypot field
            });
            
            console.log('Login response:', response.data); // Debug log
            
            if (response.data.success) {
                localStorage.setItem('apiUserToken', response.data.token);
                localStorage.setItem('apiUserData', JSON.stringify(response.data.user));
                toast('Login successful! Redirecting...');
                
                // Only reset CAPTCHA after successful login
                resetCaptcha();
                
                setTimeout(() => {
                    if (onLogin) onLogin(response.data.user);
                    window.location.href = '/api-dashboard';
                }, 1000);
            } else {
                setError(response.data.error || 'Login failed');
                resetCaptcha(); // Reset on failure so user can try again
            }
        } catch (err) {
            console.error('Login error:', err); // Debug log
            const errorMsg = err.response?.data?.error || err.message || 'Login failed';
            setError(errorMsg);
            toast(errorMsg, 'error');
            resetCaptcha(); // Reset on error so user can try again
        } finally {
            setLoading(false);
        }
    };

    const inputCls = `w-full rounded-xl px-4 py-3 text-sm border outline-none transition font-mono ${
        dark
            ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10'
            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10'
    }`;

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 relative ${dark ? 'bg-surface-950' : 'bg-slate-50'}`}>
            <AnimatedBackground intensity={0.5} />
            <div className="fixed inset-0 bg-grid opacity-20 pointer-events-none z-0" />
            
            <button onClick={toggleTheme} className={`fixed top-4 right-4 z-50 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                dark ? 'bg-white/[0.06] text-yellow-400' : 'bg-black/[0.05] text-slate-600'
            }`}>
                {dark ? <MdWbSunny size={18} /> : <MdNightlight size={18} />}
            </button>
            
            <div ref={formRef} className={`relative z-10 w-full max-w-md rounded-3xl border p-8 ${
                dark ? 'bg-surface-800/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xl'
            }`}>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-600/30 rounded-lg blur-md" />
                        <img src="/logo512.png" alt="" className="relative w-10 h-10 rounded-xl object-contain" />
                    </div>
                    <div>
                        <p className="text-cyan-500 font-bold tracking-[0.12em] text-sm">BATTLE-DESTROYER</p>
                        <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>API User Portal</p>
                    </div>
                </div>
                
                <h1 className={`text-2xl font-black mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                    API DASHBOARD
                </h1>
                <p className={`text-xs mb-6 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Login with your API credentials
                </p>
                
                {error && (
                    <div className="flex items-center gap-2 rounded-xl p-3 border border-red-500/25 bg-red-500/8 text-red-400 text-sm mb-4">
                        <FaExclamationTriangle size={13} /> {error}
                    </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-[0.1em] mb-2 ${
                            dark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                            Username
                        </label>
                        <input
                            type="text"
                            className={inputCls}
                            placeholder="your_api_username"
                            value={formData.username}
                            onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            autoComplete="username"
                        />
                    </div>
                    
                    <div>
                        <label className={`block text-xs font-semibold uppercase tracking-[0.1em] mb-2 ${
                            dark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                            API Secret
                        </label>
                        <div className="relative">
                            <input
                                type={showSecret ? 'text' : 'password'}
                                className={`${inputCls} pr-12`}
                                placeholder="as_xxxxxxxxxxxxxxxx"
                                value={formData.apiSecret}
                                onChange={(e) => setFormData(prev => ({ ...prev, apiSecret: e.target.value }))}
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-500' : 'text-slate-400'} hover:text-cyan-500 transition-colors`}
                            >
                                {showSecret ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                            </button>
                        </div>
                        <p className={`text-[10px] mt-1 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                            Your API Secret was provided when your account was created
                        </p>
                    </div>
                    
                    {/* CAPTCHA Section */}
                    <div>
                        <label className={`flex items-center gap-1.5 mb-1.5 text-xs font-semibold uppercase tracking-[0.1em] ${
                            dark ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                            <FaShieldAlt size={10} className="text-cyan-500/70" />
                            Human Verification
                        </label>
                        <HCaptchaWidget
                            ref={captchaRef}
                            onVerify={handleCaptchaVerify}
                            onExpire={resetCaptcha}
                            onError={resetCaptcha}
                            theme={theme}
                        />
                    </div>
                    
                    <button
                        type="submit"
                        disabled={loading || !captchaReady}
                        className={`w-full py-3.5 rounded-xl font-bold text-sm tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:active:scale-100 ${
                            loading || !captchaReady
                                ? dark ? 'bg-white/[0.05] text-slate-600 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-lg'
                        }`}
                        style={{ boxShadow: captchaReady ? '0 4px 20px rgba(6, 182, 212, 0.35)' : 'none' }}
                    >
                        {loading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <FaSignInAlt size={14} />
                        )}
                        {loading ? 'AUTHENTICATING...' : 'ACCESS DASHBOARD'}
                    </button>
                </form>
                
                <div className={`mt-6 pt-4 border-t text-center ${dark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
                    <p className={`text-[10px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                        Don't have an API account? Contact the administrator
                    </p>
                </div>
            </div>
            
            <Toast toasts={toasts} />
        </div>
    );
}