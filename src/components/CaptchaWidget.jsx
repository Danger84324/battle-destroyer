import React, {
    useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle,
} from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import { FaCheckCircle, FaExclamationTriangle, FaRedo } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Add encryption key (should match backend)
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-2024-battle-destroyer';

/* ─── Crypto helpers ──────────────────────────────────────────── */

async function sha256hex(str) {
    const buf = new TextEncoder().encode(str);
    const hash = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

// Function to encrypt data before sending
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        const encrypted = CryptoJS.AES.encrypt(jsonString, ENCRYPTION_KEY).toString();
        return encrypted;
    } catch (error) {
        console.error('Encryption error:', error);
        throw new Error('Failed to encrypt data');
    }
}

// Function to create SHA256 hash for integrity
function createHash(data) {
    const jsonString = JSON.stringify(data);
    return CryptoJS.SHA256(jsonString + ENCRYPTION_KEY).toString();
}

// Function to decrypt response from server
function decryptResponse(encryptedData, hash) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error('Decryption failed');
        const parsed = JSON.parse(decrypted);

        // Verify hash of decrypted data
        const calculatedHash = CryptoJS.SHA256(JSON.stringify(parsed) + ENCRYPTION_KEY).toString();
        if (calculatedHash !== hash) {
            throw new Error('Response hash verification failed');
        }

        return parsed;
    } catch (error) {
        console.error('Response decryption error:', error);
        throw new Error('Failed to decrypt response');
    }
}

/**
 * Finds counter N such that SHA256(`${nonce}:${answerIdx}:${N}`)
 * starts with `difficulty` hex zeros.  Yields every 500 iterations
 * so the UI thread stays responsive.
 */
async function solvePoW(nonce, difficulty, answerIdx, signal) {
    const prefix = '0'.repeat(difficulty);
    let i = 0;
    while (!signal.aborted) {
        const h = await sha256hex(`${nonce}:${answerIdx}:${i}`);
        if (h.startsWith(prefix)) return i;
        i++;
        if (i % 500 === 0) await new Promise(r => setTimeout(r, 0)); // yield
    }
    return null; // aborted
}

/* ─── Canvas renderer ─────────────────────────────────────────── */

function renderQuestion(canvas, text, dark) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = 52;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Subtle noise dots — disrupt simple OCR without hurting readability
    for (let n = 0; n < 40; n++) {
        ctx.fillStyle = dark
            ? `rgba(255,255,255,${0.03 + Math.random() * 0.04})`
            : `rgba(0,0,0,${0.02 + Math.random() * 0.03})`;
        ctx.beginPath();
        ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.5 + 0.5, 0, Math.PI * 2);
        ctx.fill();
    }

    // Question text
    ctx.font = `bold 17px 'Rajdhani', monospace`;
    ctx.fillStyle = dark ? '#e2e8f0' : '#1e293b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2);
}

/* ─── Main component ──────────────────────────────────────────── */

const CaptchaWidget = forwardRef(({ onVerify, onExpire, onError, theme }, ref) => {
    const [challenge, setChallenge] = useState(null);
    const [status, setStatus] = useState('loading'); // loading | ready | solving | done | error
    const [progress, setProgress] = useState(0);
    const [selected, setSelected] = useState(null);

    const canvasRef = useRef(null);
    const abortRef = useRef(null);
    const dark = theme !== 'light';

    /* ── Load a fresh challenge from the server with encryption ── */
    const load = useCallback(async () => {
        abortRef.current?.abort();
        setStatus('loading');
        setSelected(null);
        setProgress(0);
        setChallenge(null);
        try {
            const requestData = {
                timestamp: Date.now(),
                clientVersion: '1.0.0',
            };

            const encryptedPayload = encryptData(requestData);
            const dataHash = createHash(requestData);

            const response = await axios.get(`${API_URL}/api/captcha/challenge`, {
                params: {
                    encrypted: encryptedPayload,
                    hash: dataHash,
                }
            });

            // Check if response has encrypted data
            if (!response.data.encrypted || !response.data.hash) {
                throw new Error('Invalid response format from server');
            }

            // Decrypt the response
            const decryptedResponse = decryptResponse(response.data.encrypted, response.data.hash);

            if (!decryptedResponse.success) {
                throw new Error(decryptedResponse.message);
            }

            setChallenge(decryptedResponse);
            setStatus('ready');
        } catch (err) {
            console.error('Failed to load challenge:', err);
            setStatus('error');
            onError?.();
        }
    }, [onError]);

    /* Expose reset() to parent */
    useImperativeHandle(ref, () => ({ reset: load }), [load]);

    useEffect(() => {
        load();
        return () => abortRef.current?.abort();
    }, [load]);

    /* Draw question on canvas whenever challenge arrives or theme changes */
    useEffect(() => {
        if (status === 'ready' && challenge?.question) {
            requestAnimationFrame(() => renderQuestion(canvasRef.current, challenge.question, dark));
        }
    }, [status, challenge, dark]);

    /* ── User clicked an option button ── */
    const pick = async (optionIndex) => {
        if (status !== 'ready' || !challenge) return;
        setSelected(optionIndex);
        setStatus('solving');
        setProgress(0);

        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const answerStr = String(optionIndex);

        // Fake-progress ticker so users know something is happening
        const ticker = setInterval(() =>
            setProgress(p => (p < 88 ? p + Math.random() * 14 : p)), 180);

        try {
            const solution = await solvePoW(
                challenge.nonce, challenge.difficulty, answerStr, abortRef.current.signal
            );
            clearInterval(ticker);
            if (solution === null) return; // was aborted (e.g. reset)

            setProgress(100);
            setStatus('done');

            // Generate device fingerprint for additional security
            const fingerprint = await generateFingerprint();

            // Encrypt the verification data before sending
            const verificationData = {
                challengeId: challenge.challengeId,
                solution: String(solution),
                answer: answerStr,
                timestamp: Date.now(),
                fingerprint: fingerprint,
            };

            const encryptedVerification = encryptData(verificationData);
            const verificationHash = createHash(verificationData);

            // Emit encrypted verification data to parent component
            onVerify?.({
                encrypted: encryptedVerification,
                hash: verificationHash,
            });
        } catch (err) {
            console.error('Verification error:', err);
            clearInterval(ticker);
            setStatus('error');
            onError?.();
        }
    };

    // Generate device fingerprint without using restricted globals
    const generateFingerprint = async () => {
        try {
            // Safely get screen resolution without using 'screen' global directly
            let screenResolution = '';
            if (typeof window !== 'undefined' && window.screen) {
                screenResolution = `${window.screen.width}x${window.screen.height}`;
            }

            const navInfo = {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                screenResolution: screenResolution,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
                deviceMemory: navigator.deviceMemory || 'unknown',
            };
            return await sha256hex(JSON.stringify(navInfo));
        } catch (err) {
            console.error('Fingerprint generation error:', err);
            return null;
        }
    };

    /* ─── Render ────────────────────────────────────────────────── */

    const card = `rounded-xl border transition-all duration-200 overflow-hidden ${dark ? 'bg-white/[0.03] border-white/10' : 'bg-white border-slate-200'
        }`;

    if (status === 'loading') {
        return (
            <div className={`${card} flex items-center justify-center h-28`}>
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className={`${card} flex flex-col items-center justify-center gap-2 h-28`}>
                <FaExclamationTriangle className="text-red-400" size={18} />
                <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Failed to load.{' '}
                    <button onClick={load} className="text-red-400 underline inline-flex items-center gap-1">
                        <FaRedo size={10} /> Retry
                    </button>
                </p>
            </div>
        );
    }

    if (status === 'done') {
        return (
            <div className="rounded-xl border border-green-500/30 bg-green-500/[0.04] flex items-center gap-3 px-4 h-14">
                <FaCheckCircle className="text-green-400" size={16} />
                <span className={`text-sm font-medium ${dark ? 'text-green-300' : 'text-green-700'}`}>
                    Verified — you&apos;re cleared to proceed
                </span>
            </div>
        );
    }

    return (
        <div className={card}>
            <div className="px-4 pt-3 pb-1">
                {/* Instruction */}
                <p className={`text-[11px] uppercase tracking-wider mb-1.5 font-semibold ${dark ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                    Human Check — select the correct answer
                </p>

                {/* Canvas-rendered question (harder to OCR than plain HTML text) */}
                <canvas
                    ref={canvasRef}
                    style={{ width: '100%', height: 52, display: 'block' }}
                />

                {/* Answer buttons */}
                <div className="grid grid-cols-3 gap-1.5 mt-2.5 mb-3">
                    {challenge?.options?.map((opt, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => pick(i)}
                            disabled={status === 'solving'}
                            className={`py-2 rounded-lg text-sm font-mono font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${selected === i
                                    ? 'bg-red-500 text-white ring-2 ring-red-400/40'
                                    : dark
                                        ? 'bg-white/[0.06] text-slate-200 hover:bg-white/[0.12]'
                                        : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            </div>

            {/* PoW progress bar */}
            {status === 'solving' && (
                <div className={`px-4 pb-3 border-t ${dark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                    <div className={`h-1 rounded-full overflow-hidden mt-2 ${dark ? 'bg-white/10' : 'bg-slate-100'}`}>
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-200"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className={`text-[11px] mt-1.5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Verifying… {Math.round(progress)}%
                    </p>
                </div>
            )}
        </div>
    );
});

export default CaptchaWidget;