import React from 'react';
import { FaCopy, FaCheck, FaRedoAlt } from 'react-icons/fa';
import Modal from '../Modal';

export default function ViewApiUserStatsModal({
    selectedApiUser,
    apiUserStats,
    dark,
    copiedField,
    onClose,
    onEditLimits,
    onCopy,
    onRegenerate,
}) {
    if (!selectedApiUser) return null;

    return (
        <Modal
            title={`API STATS — ${selectedApiUser.username}`}
            onClose={onClose}
            dark={dark}
            size="lg"
        >
            {apiUserStats ? (
                <div className="space-y-4">
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { label: 'Total Requests', value: apiUserStats.totalRequests, color: { dark: 'bg-blue-500/5 border-blue-500/20', label: 'text-blue-400', val: 'text-white' } },
                            { label: 'Total Attacks',  value: apiUserStats.totalAttacks,  color: { dark: 'bg-red-500/5 border-red-500/20',  label: 'text-red-400',  val: 'text-white' } },
                        ].map(({ label, value, color }) => (
                            <div key={label} className={`rounded-xl p-3 border ${dark ? `${color.dark}` : 'bg-slate-50 border-slate-200'}`}>
                                <p className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? color.label : 'text-slate-500'}`}>{label}</p>
                                <p className={`text-2xl font-black ${dark ? color.val : 'text-slate-900'}`}>{(value || 0).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Current usage */}
                    <div className={`rounded-xl p-4 border ${dark ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-cyan-200 bg-cyan-50'}`}>
                        <p className={`font-bold text-sm mb-3 ${dark ? 'text-cyan-400' : 'text-cyan-700'}`}>Current Usage</p>
                        <div className="text-sm">
                            <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Active Attacks:</span>
                            <span className="ml-2 font-mono">
                                {apiUserStats.currentActiveAttacks || 0} / {selectedApiUser.limits?.maxConcurrent || 2}
                            </span>
                        </div>
                    </div>

                    {/* API Credentials */}
                    {selectedApiUser.apiKey && (
                        <div className={`rounded-xl p-4 border ${dark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                            <p className={`font-bold text-sm mb-3 ${dark ? 'text-purple-400' : 'text-purple-700'}`}>API Credentials</p>
                            <div className="space-y-2">
                                {/* API Key */}
                                <div className="flex items-center gap-2">
                                    <code className={`text-xs flex-1 p-2 rounded break-all ${dark ? 'bg-black/30 text-slate-300' : 'bg-white/50 text-slate-700'}`}>
                                        {selectedApiUser.apiKey}
                                    </code>
                                    <button
                                        onClick={() => onCopy(selectedApiUser.apiKey, 'API Key')}
                                        className="shrink-0 p-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                                    >
                                        {copiedField === 'API Key' ? <FaCheck size={12} /> : <FaCopy size={12} />}
                                    </button>
                                </div>
                                {/* API Secret (hidden, regen only) */}
                                <div className="flex items-center gap-2">
                                    <code className={`text-xs flex-1 p-2 rounded ${dark ? 'bg-black/30 text-slate-300' : 'bg-white/50 text-slate-700'}`}>
                                        API Secret: •••••••• (hidden)
                                    </code>
                                    <button
                                        onClick={onRegenerate}
                                        className="shrink-0 p-2 rounded-lg bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-all"
                                        title="Regenerate secret"
                                    >
                                        <FaRedoAlt size={12} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button onClick={onClose}
                            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                            Close
                        </button>
                        <button onClick={onEditLimits}
                            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-all">
                            Edit Limits
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-center py-8">
                    <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
        </Modal>
    );
}