import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSearch, FaRedoAlt, FaStop } from 'react-icons/fa';
import CryptoJS from 'crypto-js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const ENCRYPTION_KEY = process.env.REACT_APP_ENCRYPTION_KEY || 'your-secret-key-2024-battle-destroyer';

// Decryption helper
function decryptData(encryptedData) {
    try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
        const decrypted = bytes.toString(CryptoJS.enc.Utf8);
        if (!decrypted) throw new Error('Decryption failed');
        return JSON.parse(decrypted);
    } catch (error) {
        console.error('Decryption error:', error);
        throw new Error('Invalid encrypted data');
    }
}

function createHash(data) {
    const jsonString = JSON.stringify(data);
    return CryptoJS.SHA256(jsonString + ENCRYPTION_KEY).toString();
}

export default function LiveMonitorTab({ dark, token, showToast }) {
    const [attacks, setAttacks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalActive: 0,
        bySource: { api: 0, panel: 0 },
        totalAttacksLaunched: 0
    });
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [stoppingAttack, setStoppingAttack] = useState(null);
    const refreshIntervalRef = useRef(null);

    // Fetch attacks from API
    const fetchAttacks = useCallback(async () => {
        if (!token) return;
        
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/attacks/running`, {
                headers: {
                    'x-admin-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.status === 401) {
                showToast('Session expired', 'error');
                return;
            }

            if (!response.ok) throw new Error('Failed to fetch');

            const result = await response.json();
            
            // Handle encrypted response
            let data = result;
            if (result.encrypted && result.hash) {
                try {
                    const decrypted = decryptData(result.encrypted);
                    const calculatedHash = createHash(decrypted);
                    if (calculatedHash !== result.hash) {
                        throw new Error('Response integrity check failed');
                    }
                    data = decrypted;
                } catch (decryptErr) {
                    console.error('Decryption failed:', decryptErr);
                    throw new Error('Failed to decrypt response');
                }
            }
            
            // Extract the actual attack data
            const attackData = data.data || data;
            
            console.log('Fetched attacks:', attackData); // Debug log
            
            setAttacks(attackData.attacks || []);
            setStats({
                totalActive: attackData.totalActive || 0,
                bySource: attackData.bySource || { api: 0, panel: 0 },
                totalAttacksLaunched: attackData.totalAttacksLaunched || 0
            });
        } catch (error) {
            console.error('Fetch attacks error:', error);
            if (showToast) showToast('Failed to fetch attacks', 'error');
        } finally {
            setLoading(false);
        }
    }, [token, showToast]);

    // Stop an attack
    const stopAttack = async (attackId) => {
        setStoppingAttack(attackId);
        try {
            const response = await fetch(`${API_URL}/api/admin/attacks/${attackId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-token': token,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                // Handle encrypted response for stop as well
                if (result.encrypted && result.hash) {
                    const decrypted = decryptData(result.encrypted);
                    if (decrypted.success) {
                        showToast(`Attack stopped successfully`, 'success');
                    }
                } else if (result.success) {
                    showToast(`Attack stopped successfully`, 'success');
                }
                fetchAttacks();
            } else {
                const error = await response.json();
                showToast(error.message || 'Failed to stop attack', 'error');
            }
        } catch (error) {
            console.error('Stop attack error:', error);
            showToast('Failed to stop attack', 'error');
        } finally {
            setStoppingAttack(null);
        }
    };

    // Stop all attacks
    const stopAllAttacks = async () => {
        if (!window.confirm('⚠️ WARNING: This will stop ALL currently running attacks. Are you absolutely sure?')) {
            return;
        }

        let stoppedCount = 0;
        for (const attack of attacks) {
            try {
                const response = await fetch(`${API_URL}/api/admin/attacks/${attack.attackId}`, {
                    method: 'DELETE',
                    headers: { 'x-admin-token': token, 'Content-Type': 'application/json' }
                });
                if (response.ok) stoppedCount++;
            } catch (error) {
                console.error(`Failed to stop ${attack.attackId}:`, error);
            }
        }
        showToast(`Stopped ${stoppedCount} attacks`, 'success');
        fetchAttacks();
    };

    // Setup auto-refresh
    useEffect(() => {
        fetchAttacks();
        
        if (autoRefresh) {
            refreshIntervalRef.current = setInterval(() => {
                fetchAttacks();
            }, 5000);
        }
        
        return () => {
            if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
            }
        };
    }, [autoRefresh, fetchAttacks]);

    // Filter attacks
    const filteredAttacks = attacks.filter(attack => {
        if (filter !== 'all' && attack.source !== filter) return false;
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            return attack.target?.toLowerCase().includes(search) ||
                   attack.username?.toLowerCase().includes(search) ||
                   attack.attackId?.toLowerCase().includes(search);
        }
        return true;
    });

    // Get remaining time color
    const getTimeColor = (remaining, duration) => {
        const percentage = (remaining / duration) * 100;
        if (percentage > 50) return 'text-green-400';
        if (percentage > 25) return 'text-yellow-400';
        return 'text-red-400';
    };

    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className={`rounded-xl p-4 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Active Attacks</p>
                        <span className="text-sm">🎯</span>
                    </div>
                    <p className={`text-2xl font-black ${stats.totalActive > 0 ? 'text-red-500' : dark ? 'text-white' : 'text-slate-900'}`}>
                        {stats.totalActive}
                    </p>
                </div>
                <div className={`rounded-xl p-4 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>API Endpoint</p>
                        <span className="text-sm">🔌</span>
                    </div>
                    <p className="text-2xl font-black text-blue-500">{stats.bySource.api || 0}</p>
                </div>
                <div className={`rounded-xl p-4 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Panel Endpoint</p>
                        <span className="text-sm">🖥️</span>
                    </div>
                    <p className="text-2xl font-black text-orange-500">{stats.bySource.panel || 0}</p>
                </div>
                <div className={`rounded-xl p-4 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-1">
                        <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Total Launched</p>
                        <span className="text-sm">📊</span>
                    </div>
                    <p className="text-2xl font-black text-purple-500">{stats.totalAttacksLaunched}</p>
                </div>
            </div>

            {/* Controls */}
            <div className={`rounded-xl p-4 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 relative">
                        <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`} size={12} />
                        <input
                            type="text"
                            placeholder="Search by IP, username, or attack ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={inputCls}
                            style={{ paddingLeft: '2rem' }}
                        />
                    </div>
                    <button
                        onClick={fetchAttacks}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center gap-2"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaRedoAlt size={12} />}
                        Refresh
                    </button>
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all flex items-center gap-2 ${autoRefresh ? 'bg-green-600 text-white' : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                    >
                        ⏱️ Auto {autoRefresh ? 'ON' : 'OFF'}
                    </button>
                    {attacks.length > 0 && (
                        <button
                            onClick={stopAllAttacks}
                            className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-700 hover:bg-red-600 transition-all flex items-center gap-2"
                        >
                            <FaStop size={12} /> Stop All
                        </button>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mt-3 flex-wrap">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider self-center ${dark ? 'text-slate-500' : 'text-slate-400'}`}>Source:</span>
                    {[
                        { key: 'all', label: 'All', color: 'red' },
                        { key: 'api', label: '🔌 API', color: 'blue' },
                        { key: 'panel', label: '🖥️ Panel', color: 'orange' }
                    ].map(f => (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                filter === f.key 
                                    ? `bg-${f.color === 'blue' ? 'blue' : f.color === 'orange' ? 'orange' : 'red'}-600 text-white` 
                                    : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Attacks Table */}
            <div className={`rounded-xl border overflow-hidden ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className={dark ? 'bg-white/[0.03]' : 'bg-slate-50'}>
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Target</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">User</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Source</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Duration</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Time Left</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Started</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {loading && attacks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAttacks.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-12 text-center">
                                        <div className="text-center">
                                            <p className={`text-sm ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                                                {attacks.length === 0 ? '🎉 No active attacks at the moment' : 'No matching attacks found'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAttacks.map((attack) => {
                                    const timeRemaining = attack.timeRemaining;
                                    const percentage = attack.duration > 0 ? (timeRemaining / attack.duration) * 100 : 0;
                                    return (
                                        <tr key={attack.attackId} className={`border-b ${dark ? 'border-white/[0.05] hover:bg-white/[0.02]' : 'border-slate-100 hover:bg-slate-50'}`}>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <span className="font-mono text-sm">{attack.target}</span>
                                                    <span className={`ml-2 text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>:{attack.port}</span>
                                                </div>
                                                <div className="text-[10px] font-mono mt-0.5 opacity-60">{attack.attackId?.slice(0, 12)}...</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm font-medium">{attack.username}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                                                    attack.source === 'api' 
                                                        ? 'bg-blue-500/20 text-blue-400' 
                                                        : 'bg-orange-500/20 text-orange-400'
                                                }`}>
                                                    {attack.source === 'api' ? '🔌 API' : '🖥️ Panel'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-sm">{attack.duration}s</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="min-w-[100px]">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className={getTimeColor(timeRemaining, attack.duration)}>{timeRemaining}s</span>
                                                        <span className={dark ? 'text-slate-500' : 'text-slate-400'}>{Math.round(percentage)}%</span>
                                                    </div>
                                                    <div className="h-1.5 rounded-full overflow-hidden bg-gray-700">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-red-500 to-red-600"
                                                            style={{ width: `${Math.max(0, percentage)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-xs text-slate-500">{new Date(attack.startedAt).toLocaleTimeString()}</span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button
                                                    onClick={() => stopAttack(attack.attackId)}
                                                    disabled={stoppingAttack === attack.attackId}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all disabled:opacity-50 flex items-center gap-1"
                                                >
                                                    {stoppingAttack === attack.attackId ? (
                                                        <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <FaStop size={10} />
                                                    )}
                                                    Stop
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Refresh indicator */}
            {autoRefresh && !loading && attacks.length > 0 && (
                <div className="text-center">
                    <p className={`text-[10px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        🔄 Auto-refreshing every 5 seconds
                    </p>
                </div>
            )}
        </div>
    );
}