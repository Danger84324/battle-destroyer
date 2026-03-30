import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaGem, FaClipboard, FaExclamationTriangle, FaCheckCircle, FaCrown, FaStopCircle, FaTrash, FaHistory } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import TurnstileWidget from '../components/TurnstileWidget';

export default function Attack({ toggleTheme, theme }) {
    const [user, setUser] = useState(null);
    const [form, setForm] = useState({ ip: '', port: '', duration: '' });
    const [errors, setErrors] = useState({});
    const [launching, setLaunching] = useState(false);
    const [launched, setLaunched] = useState(false);
    const [launchError, setLaunchError] = useState('');
    const [attackStatus, setAttackStatus] = useState(null);
    const [attackCompleted, setAttackCompleted] = useState(false);
    const [stoppingAttack, setStoppingAttack] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [attackHistory, setAttackHistory] = useState([]);
    const navigate = useNavigate();
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    const [captchaReady, setCaptchaReady] = useState(false);
    const captchaTokenRef = useRef('');
    const captchaIssuedRef = useRef(null);
    const expiryTimerRef = useRef(null);
    const turnstileRef = useRef(null);
    const countdownRef = useRef(null);
    const statusPollRef = useRef(null);
    const TOKEN_MAX_AGE_MS = 270_000;

    // ── Load attack history from localStorage ──────────────────────────────────
    useEffect(() => {
        const saved = localStorage.getItem('attackHistory');
        if (saved) {
            try {
                setAttackHistory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load history:', e);
            }
        }
    }, []);

    // ── Save attack history to localStorage ────────────────────────────────────
    const saveAttackHistory = useCallback((newHistory) => {
        localStorage.setItem('attackHistory', JSON.stringify(newHistory));
        setAttackHistory(newHistory);
    }, []);

    // ── Add attack to history ──────────────────────────────────────────────────
    const addToHistory = useCallback((attack) => {
        const newEntry = {
            id: Date.now(),
            ip: attack.ip,
            port: attack.port,
            duration: attack.duration,
            status: attack.status || 'running',
            startedAt: attack.startedAt,
            completedAt: attack.completedAt || null,
            timestamp: new Date().toISOString()
        };

        const updated = [newEntry, ...attackHistory].slice(0, 30); // Keep last 30
        saveAttackHistory(updated);
    }, [attackHistory, saveAttackHistory]);

    // ── Clear attack history ───────────────────────────────────────────────────
    const clearHistory = useCallback(() => {
        if (window.confirm('Are you sure you want to clear all attack history? This cannot be undone.')) {
            saveAttackHistory([]);
        }
    }, [saveAttackHistory]);

    // ── Countdown ticker ───────────────────────────────────────────────────────
    const startCountdown = useCallback((startedAt, duration) => {
        if (countdownRef.current) clearInterval(countdownRef.current);

        const tick = () => {
            const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
            const remaining = Math.max(0, Math.floor(duration - elapsed));
            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(countdownRef.current);
                setAttackStatus(prev => prev ? { ...prev, status: 'completed' } : null);
                setAttackCompleted(true);
                setTimeout(() => setAttackCompleted(false), 6000);
            }
        };

        tick();
        countdownRef.current = setInterval(tick, 1000);
    }, []);

    // ── Server-side poll ───────────────────────────────────────────────────────
    const startStatusPolling = useCallback(() => {
        if (statusPollRef.current) clearInterval(statusPollRef.current);

        statusPollRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = response.data.data;

                if (data?.status === 'completed') {
                    clearInterval(statusPollRef.current);
                    clearInterval(countdownRef.current);
                    setAttackStatus(null);
                    setTimeLeft(0);
                    setAttackCompleted(true);
                    setTimeout(() => setAttackCompleted(false), 6000);
                } else if (data?.status !== 'running') {
                    clearInterval(statusPollRef.current);
                    setAttackStatus(null);
                }
            } catch (err) {
                console.error('Poll error:', err);
            }
        }, 10000);
    }, [API_URL]);

    // ── Check for existing attack on mount ──────────────────────────────────────
    const checkAttackStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/panel/attack-status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data.data;
            if (data?.status === 'running') {
                setAttackStatus(data);
                startCountdown(data.startedAt, data.duration);
                startStatusPolling();
            }
        } catch (err) {
            console.error('Error checking attack status:', err);
        }
    }, [API_URL, startCountdown, startStatusPolling]);

    // ── Load user + check status on mount ──────────────────────────────────────
    useEffect(() => {
        const token = localStorage.getItem('token');
        axios.get(`${API_URL}/api/panel/me`, {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            setUser(r.data);
            localStorage.setItem('user', JSON.stringify(r.data));
        }).catch(() => {
            localStorage.clear();
            navigate('/login');
        });

        checkAttackStatus();

        return () => {
            clearInterval(countdownRef.current);
            clearInterval(statusPollRef.current);
        };
    }, [navigate, API_URL, checkAttackStatus]);

    // ── Cleanup on unmount ────────────────────────────────────────────────────
    useEffect(() => () => {
        clearTimeout(expiryTimerRef.current);
        clearInterval(countdownRef.current);
        clearInterval(statusPollRef.current);
    }, []);

    const handle = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
        setLaunchError('');
    };

    const resetCaptcha = useCallback(() => {
        captchaTokenRef.current = '';
        captchaIssuedRef.current = null;
        setCaptchaReady(false);
        clearTimeout(expiryTimerRef.current);
        turnstileRef.current?.reset();
    }, []);

    const handleVerify = useCallback((token) => {
        captchaTokenRef.current = token;
        captchaIssuedRef.current = Date.now();
        setCaptchaReady(true);
        clearTimeout(expiryTimerRef.current);
        expiryTimerRef.current = setTimeout(resetCaptcha, TOKEN_MAX_AGE_MS);
    }, [resetCaptcha]);

    // ── Validation ────────────────────────────────────────────────────────────
    const BLOCKED_PORTS = new Set([8700, 20000, 443, 17500, 9031, 20002, 20001]);

    const validate = () => {
        const errs = {};
        const MAX = user?.isPro ? 300 : 60;

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!form.ip) errs.ip = 'IP address is required';
        else if (!ipRegex.test(form.ip)) errs.ip = 'Enter a valid IP address';

        const port = parseInt(form.port);
        if (!form.port) errs.port = 'Port is required';
        else if (isNaN(port) || port < 1 || port > 65535) errs.port = 'Port must be 1–65535';
        else if (BLOCKED_PORTS.has(port)) errs.port = `Port ${port} is blocked and cannot be used`;

        const dur = parseInt(form.duration);
        if (!form.duration) errs.duration = 'Duration is required';
        else if (isNaN(dur) || dur < 1) errs.duration = 'Duration must be at least 1 second';
        else if (dur > MAX) errs.duration = `Max duration is ${MAX}s${!user?.isPro ? ' (upgrade to Pro for 300s)' : ''}`;

        return errs;
    };

    // ── Launch ────────────────────────────────────────────────────────────────
    const launch = async () => {
        setLaunchError('');
        setLaunched(false);
        setAttackCompleted(false);

        const captchaToken = captchaTokenRef.current;
        const issuedAt = captchaIssuedRef.current;

        if (!captchaToken) { setLaunchError('Please complete the CAPTCHA before launching.'); return; }
        if (!issuedAt || Date.now() - issuedAt > TOKEN_MAX_AGE_MS) {
            resetCaptcha();
            setLaunchError('CAPTCHA expired. Please solve it again.');
            return;
        }

        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }

        if (attackStatus?.status === 'running') {
            setLaunchError('You already have an attack running. Please stop it first.');
            return;
        }

        setLaunching(true);
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                `${API_URL}/api/panel/attack`,
                { ip: form.ip, port: form.port, duration: form.duration, captchaToken },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setUser(prev => ({ ...prev, credits: data.credits }));
            localStorage.setItem('user', JSON.stringify({ ...user, credits: data.credits }));

            const status = {
                status: 'running',
                ip: form.ip,
                port: parseInt(form.port),
                duration: parseInt(form.duration),
                startedAt: data.attack.startedAt
            };

            // Add to history
            addToHistory(status);

            setAttackStatus(status);
            setLaunched(true);
            startCountdown(data.attack.startedAt, parseInt(form.duration));
            startStatusPolling();

            setTimeout(() => setLaunched(false), 3000);
            resetCaptcha();

        } catch (err) {
            const msg = err.response?.data?.message || 'Launch failed. Please try again.';
            setLaunchError(msg);

            if (err.response?.data?.credits !== undefined) {
                setUser(prev => ({ ...prev, credits: err.response.data.credits }));
            }
            if (err.response?.data?.maxDuration) {
                setErrors(prev => ({
                    ...prev,
                    duration: `Max duration is ${err.response.data.maxDuration}s${!user?.isPro ? ' (upgrade to Pro for 300s)' : ''}`
                }));
            }
            resetCaptcha();
        } finally {
            setLaunching(false);
        }
    };

    // ── Stop Attack ───────────────────────────────────────────────────────────
    const stopAttack = async () => {
        if (!attackStatus) return;
        setStoppingAttack(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_URL}/api/panel/stop-attack`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            clearInterval(countdownRef.current);
            clearInterval(statusPollRef.current);
            setAttackStatus(null);
            setTimeLeft(0);
        } catch (err) {
            setLaunchError(err.response?.data?.message || 'Failed to stop attack');
        } finally {
            setStoppingAttack(false);
        }
    };

    const MAX_DURATION = user?.isPro ? 300 : 60;
    const progressPct = attackStatus
        ? Math.min(100, Math.round(((attackStatus.duration - timeLeft) / attackStatus.duration) * 100))
        : 0;

    const bg = theme === 'dark'
        ? 'bg-gray-950 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950'
        : 'bg-gray-50 bg-gradient-to-br from-gray-100 via-gray-50 to-white';
    const card = theme === 'dark'
        ? 'bg-gray-900/60 border-gray-700/50 backdrop-blur-xl shadow-xl shadow-black/20'
        : 'bg-white/70 border-gray-200/60 backdrop-blur-xl shadow-xl shadow-gray-200/50';
    const text = theme === 'dark' ? 'text-white' : 'text-gray-900';
    const sub = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
    const inp = theme === 'dark'
        ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-600'
        : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400';

    if (!user) return (
        <div className={`min-h-screen ${bg} flex items-center justify-center`}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm ${sub}`}>Loading...</p>
            </div>
        </div>
    );

    const rules = [
        'Valid public IP address required',
        'Port range: 1 – 65535',
        `Duration: 1 – ${MAX_DURATION} seconds`,
        '1 credit per attack launch',
        'No concurrent attacks',
    ];

    return (
        <div className={`min-h-screen ${bg} transition-colors duration-300`}>
            <Navbar toggleTheme={toggleTheme} theme={theme} />

            <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6">
                    <p className={`text-xs font-medium uppercase tracking-widest mb-1 ${sub}`}>Attack Module</p>
                    <h1 className={`text-2xl sm:text-3xl font-black ${text}`}>
                        ⚔️ Battle <span className="text-red-500">Attack Hub</span>
                    </h1>
                    <p className={`text-sm mt-1 ${sub}`}>Configure and launch your attack below</p>
                </div>

                {/* Pro / Free tier banner */}
                {user.isPro ? (
                    <div className="mb-5 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 sm:px-5 py-3 flex items-center gap-3">
                        <FaCrown className="text-yellow-400 text-lg shrink-0" />
                        <p className="text-yellow-400 text-xs sm:text-sm font-semibold">
                            Pro Account — up to <span className="font-black">300 second</span> attacks unlocked
                        </p>
                    </div>
                ) : (
                    <div className="mb-5 bg-gray-500/10 border border-gray-500/20 rounded-2xl px-4 sm:px-5 py-3 flex items-center justify-between gap-3 flex-wrap">
                        <p className={`text-xs sm:text-sm ${sub}`}>
                            Free Account — attacks limited to <span className="font-bold text-white">60 seconds</span>
                        </p>
                        <Link to="/contact" className="text-xs bg-red-600/20 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white px-3 py-1 rounded-lg font-semibold whitespace-nowrap transition-all">
                            Upgrade to Pro
                        </Link>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
                    {/* ── Main Attack Form & Progress ── */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                        {/* Attack Configuration Form */}
                        <div className={`rounded-2xl border overflow-hidden ${card}`}>
                            <div className={`px-4 sm:px-6 py-4 border-b flex items-center gap-3 ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-600/30 flex items-center justify-center shrink-0">
                                    <FaClipboard className="text-red-500 text-sm" />
                                </div>
                                <div>
                                    <h2 className={`font-bold text-sm ${text}`}>Attack Configuration</h2>
                                    <p className={`text-xs ${sub}`}>Fill in target details below</p>
                                </div>
                            </div>

                            <div className="p-4 sm:p-6 space-y-5">
                                {/* IP */}
                                <div>
                                    <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>Target IP Address</label>
                                    <input
                                        name="ip" value={form.ip} onChange={handle}
                                        placeholder="e.g. 203.0.113.1"
                                        className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.ip ? 'border-red-500' : ''}`}
                                        disabled={attackStatus?.status === 'running'}
                                    />
                                    {errors.ip && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.ip}</p>}
                                </div>

                                {/* Port + Duration */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>Port</label>
                                        <input
                                            name="port" type="number" value={form.port} onChange={handle}
                                            placeholder="e.g. 8080" min="1" max="65535"
                                            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.port ? 'border-red-500' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.port && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.port}</p>}
                                    </div>

                                    <div>
                                        <label className={`text-xs font-semibold uppercase tracking-wide mb-2 block ${sub}`}>
                                            Duration (seconds)
                                            <span className={`ml-2 normal-case font-normal ${user.isPro ? 'text-yellow-500' : 'text-gray-500'}`}>
                                                max {MAX_DURATION}s
                                            </span>
                                        </label>
                                        <input
                                            name="duration" type="number" value={form.duration} onChange={handle}
                                            placeholder={`1 – ${MAX_DURATION}`} min="1" max={MAX_DURATION}
                                            className={`w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition font-mono ${inp} ${errors.duration ? 'border-red-500' : ''}`}
                                            disabled={attackStatus?.status === 'running'}
                                        />
                                        {errors.duration && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><span>⚠️</span>{errors.duration}</p>}
                                    </div>
                                </div>

                                {/* Preview (only when not attacking) */}
                                {(form.ip || form.port || form.duration) && !attackStatus && !attackCompleted && (
                                    <div className={`rounded-xl p-4 border font-mono text-xs space-y-1 ${theme === 'dark' ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                                        <p className={sub}>Attack Preview:</p>
                                        <p className="text-green-400">Target: <span className="text-white">{form.ip || '—'}:{form.port || '—'}</span></p>
                                        <p className="text-green-400">Duration: <span className="text-white">{form.duration ? `${form.duration}s` : '—'}</span></p>
                                        <p className="text-green-400">Mode: <span className={user.isPro ? 'text-yellow-400' : 'text-white'}>{user.isPro ? '👑 Pro (300s max)' : 'Free (60s max)'}</span></p>
                                    </div>
                                )}

                                {/* Error */}
                                {launchError && (
                                    <div className="bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                                        <FaExclamationTriangle size={16} />{launchError}
                                    </div>
                                )}

                                {/* Success flash */}
                                {launched && (
                                    <div className="bg-green-500/10 border border-green-500/40 text-green-400 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                                        <FaCheckCircle size={16} />
                                        <span className="text-xs sm:text-sm">Attack launched on {form.ip}:{form.port} for {form.duration}s</span>
                                    </div>
                                )}

                                {/* CAPTCHA */}
                                <div>
                                    <TurnstileWidget
                                        ref={turnstileRef}
                                        onVerify={handleVerify}
                                        onExpire={resetCaptcha}
                                        onError={resetCaptcha}
                                    />
                                    {!captchaReady && (
                                        <p className="text-yellow-500 text-xs mt-1.5 flex items-center gap-1">
                                            ⏳ Complete the CAPTCHA to enable launch
                                        </p>
                                    )}
                                    {captchaReady && (
                                        <p className="text-green-500 text-xs mt-1.5 flex items-center gap-1">
                                            ✅ CAPTCHA verified — ready to launch
                                        </p>
                                    )}
                                </div>

                                {/* Launch Button */}
                                <button
                                    onClick={launch}
                                    disabled={launching || user.credits < 1 || !captchaReady || attackStatus?.status === 'running'}
                                    className={`w-full py-3 sm:py-4 rounded-xl font-black text-sm sm:text-base tracking-wider transition-all flex items-center justify-center gap-3 ${
                                        user.credits < 1 || !captchaReady || attackStatus?.status === 'running'
                                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                            : launching
                                                ? 'bg-red-700 text-white cursor-wait'
                                                : 'bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-xl shadow-red-900/30'
                                    }`}
                                >
                                    {launching ? (
                                        <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Launching...</>
                                    ) : user.credits < 1 ? '⛔ Insufficient Credits'
                                      : !captchaReady ? '🔒 Complete CAPTCHA'
                                      : attackStatus?.status === 'running' ? '🚀 Already Running'
                                      : '🚀 Launch Attack'}
                                </button>

                                {user.credits < 1 && (
                                    <p className={`text-xs text-center ${sub}`}>
                                        You need at least 1 credit to launch. Share your referral link to earn more.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Live Attack Progress Block ── */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-5">
                        {/* Live Attack Status */}
                        {attackStatus?.status === 'running' && (
                            <div className={`rounded-2xl border overflow-hidden ${card}`}>
                                {/* Header bar */}
                                <div className="bg-red-600 px-4 sm:px-6 py-3 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                    <span className="text-white text-xs font-bold uppercase tracking-widest">Attack In Progress</span>
                                </div>

                                <div className="p-4 sm:p-6 space-y-4">
                                    {/* Target */}
                                    <div className="text-center">
                                        <p className={`text-xs uppercase tracking-widest mb-2 ${sub}`}>Target</p>
                                        <p className={`font-black text-lg sm:text-2xl font-mono break-all ${text}`}>
                                            {attackStatus.ip}<span className="text-red-500">:</span>{attackStatus.port}
                                        </p>
                                    </div>

                                    {/* Big countdown */}
                                    <div className="text-center">
                                        <p className={`text-xs uppercase tracking-widest mb-2 ${sub}`}>Time Remaining</p>
                                        <p className={`font-black tabular-nums ${
                                            timeLeft <= 10 ? 'text-red-500 text-4xl sm:text-5xl' :
                                            timeLeft <= 30 ? 'text-yellow-400 text-4xl sm:text-5xl' :
                                            'text-green-400 text-4xl sm:text-5xl'
                                        }`}>
                                            {timeLeft}s
                                        </p>
                                    </div>

                                    {/* Progress bar */}
                                    <div>
                                        <div className={`w-full h-3 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                            <div
                                                className="h-full rounded-full transition-all duration-1000"
                                                style={{
                                                    width: `${progressPct}%`,
                                                    background: timeLeft <= 10
                                                        ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                                        : 'linear-gradient(90deg, #3b82f6, #6366f1)'
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className={`text-xs ${sub}`}>0s</span>
                                            <span className={`text-xs ${sub}`}>{attackStatus.duration}s</span>
                                        </div>
                                    </div>

                                    {/* Duration info */}
                                    <div className={`text-center p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-100/50'}`}>
                                        <p className={`text-xs ${sub} mb-1`}>Duration</p>
                                        <p className={`font-bold ${text}`}>{attackStatus.duration}s</p>
                                    </div>

                                    {/* Stop button */}
                                    <button
                                        onClick={stopAttack}
                                        disabled={stoppingAttack}
                                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                            stoppingAttack
                                                ? 'bg-gray-600 text-gray-400 cursor-wait'
                                                : 'bg-red-600 hover:bg-red-700 text-white active:scale-95'
                                        }`}
                                    >
                                        {stoppingAttack ? (
                                            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Stopping...</>
                                        ) : (
                                            <><FaStopCircle /> Stop Attack</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Completed Banner */}
                        {attackCompleted && (
                            <div className="bg-green-500/10 border border-green-500/40 rounded-2xl px-4 sm:px-6 py-4 text-center space-y-1">
                                <p className="text-green-400 font-black text-lg">✅ Attack Completed</p>
                                <p className={`text-xs ${sub}`}>Your attack has finished successfully.</p>
                            </div>
                        )}

                        {/* Credits card */}
                        <div className={`rounded-2xl p-4 sm:p-5 border ${card}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaGem className="text-lg text-red-500 shrink-0" />
                                <h3 className={`font-bold text-sm ${text}`}>Available Credits</h3>
                            </div>
                            <p className={`font-black text-4xl sm:text-5xl mb-1 ${user.credits > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                {user.credits}
                            </p>
                            <p className={`text-xs ${sub} mb-4`}>credits remaining</p>
                            <div className={`h-2 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                <div
                                    className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full transition-all"
                                    style={{ width: `${Math.min((user.credits / 10) * 100, 100)}%` }}
                                />
                            </div>
                            <Link to="/contact" className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white text-xs font-bold transition-all">
                                <FaGem size={12} /> Buy Credits
                            </Link>
                        </div>

                        {/* Rules */}
                        <div className={`rounded-2xl p-4 sm:p-5 border ${card}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <FaClipboard className="text-red-500 shrink-0" />
                                <h3 className={`font-bold text-sm ${text}`}>Attack Rules</h3>
                            </div>
                            <ul className="space-y-2">
                                {rules.map((rule, i) => (
                                    <li key={i} className={`flex items-start gap-2 text-xs ${sub}`}>
                                        <span className="text-red-500 mt-0.5 shrink-0">▸</span><span>{rule}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* ── RECENT ATTACKS HISTORY ── */}
                {attackHistory.length > 0 && (
                    <div className="mt-6 sm:mt-8">
                        <div className={`rounded-2xl border overflow-hidden ${card}`}>
                            <div className={`px-4 sm:px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-600/30 flex items-center justify-center">
                                        <FaHistory className="text-blue-500 text-sm" />
                                    </div>
                                    <div>
                                        <h2 className={`font-bold text-sm ${text}`}>Recent Attacks History</h2>
                                        <p className={`text-xs ${sub}`}>Last {Math.min(attackHistory.length, 30)} attacks</p>
                                    </div>
                                </div>
                                <button
                                    onClick={clearHistory}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-400 hover:text-white text-xs font-semibold transition-all"
                                    title="Clear all attack history"
                                >
                                    <FaTrash size={12} />
                                    <span className="hidden sm:inline">Clear</span>
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className={`border-b ${theme === 'dark' ? 'border-gray-800 bg-gray-800/50' : 'border-gray-200 bg-gray-100'}`}>
                                            <th className={`px-4 py-3 text-left font-semibold ${sub}`}>Target</th>
                                            <th className={`px-4 py-3 text-left font-semibold ${sub}`}>Duration</th>
                                            <th className={`px-4 py-3 text-center font-semibold ${sub}`}>Status</th>
                                            <th className={`px-4 py-3 text-right font-semibold ${sub}`}>Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attackHistory.map((attack) => {
                                            const attackDate = new Date(attack.timestamp);
                                            const now = new Date();
                                            const diffMs = now - attackDate;
                                            const diffMins = Math.floor(diffMs / 60000);
                                            const diffHours = Math.floor(diffMs / 3600000);
                                            const diffDays = Math.floor(diffMs / 86400000);

                                            let timeAgo = '';
                                            if (diffMins < 1) timeAgo = 'Just now';
                                            else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
                                            else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
                                            else timeAgo = `${diffDays}d ago`;

                                            const statusBgColor = attack.status === 'running'
                                                ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-400'
                                                : attack.status === 'completed'
                                                    ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                                                    : 'bg-gray-500/10 border border-gray-500/30 text-gray-400';

                                            return (
                                                <tr key={attack.id} className={`border-b transition-colors ${theme === 'dark' ? 'border-gray-800 hover:bg-gray-800/20' : 'border-gray-200 hover:bg-gray-100/50'}`}>
                                                    <td className={`px-4 py-3 font-mono ${text}`}>{attack.ip}:{attack.port}</td>
                                                    <td className={`px-4 py-3 ${text}`}>{attack.duration}s</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`inline-block px-2 py-1 rounded-md font-semibold text-xs ${statusBgColor}`}>
                                                            {attack.status === 'completed' ? '✓ Completed' : 'Running'}
                                                        </span>
                                                    </td>
                                                    <td className={`px-4 py-3 text-right ${sub}`}>{timeAgo}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}