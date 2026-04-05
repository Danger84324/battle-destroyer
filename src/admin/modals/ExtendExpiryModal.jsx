import React from 'react';
import { FaClock } from 'react-icons/fa';
import Modal from '../Modal';

const QUICK_DAYS = [7, 30, 60, 90, 180, 365];

export default function ExtendExpiryModal({
    extendExpiryModal,
    setExtendExpiryModal,
    extendDays,
    setExtendDays,
    dark,
    modalLoading,
    onExtend,
}) {
    if (!extendExpiryModal) return null;

    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;
    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

    const newExpiryStr = new Date(Date.now() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString();
    const oldExpiryStr = extendExpiryModal.expiresAt
        ? new Date(extendExpiryModal.expiresAt).toLocaleDateString()
        : null;

    return (
        <Modal title={`EXTEND EXPIRY — ${extendExpiryModal.username}`} onClose={() => setExtendExpiryModal(null)} dark={dark} size="sm">
            <div className="space-y-4">
                {/* Current expiry info */}
                <div className={`rounded-xl p-3 ${dark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Current Expiry</p>
                    <p className={`font-mono text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {extendExpiryModal.expiresAt
                            ? new Date(extendExpiryModal.expiresAt).toLocaleDateString()
                            : 'No expiry set'}
                    </p>
                    <p className={`text-xs mt-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Days remaining: {extendExpiryModal.daysRemaining || 0} days
                    </p>
                </div>

                {/* Day input + quick-select */}
                <div>
                    <label className={labelCls}>Extend by (days)</label>
                    <input
                        type="number"
                        min="1"
                        max="365"
                        value={extendDays}
                        onChange={e => setExtendDays(parseInt(e.target.value) || 1)}
                        className={inputCls}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {QUICK_DAYS.map(days => (
                            <button
                                key={days}
                                onClick={() => setExtendDays(days)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${extendDays === days
                                    ? 'bg-cyan-600 text-white'
                                    : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'
                                }`}
                            >
                                +{days}d
                            </button>
                        ))}
                    </div>
                    <p className={`text-[10px] mt-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        New expiry: <strong>{newExpiryStr}</strong>
                        {oldExpiryStr && ` (was ${oldExpiryStr})`}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={() => setExtendExpiryModal(null)}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Cancel
                    </button>
                    <button
                        onClick={() => onExtend(extendExpiryModal._id, extendDays)}
                        disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-green-600 hover:bg-green-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {modalLoading
                            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <FaClock size={12} />
                        }
                        Extend by {extendDays} days
                    </button>
                </div>
            </div>
        </Modal>
    );
}