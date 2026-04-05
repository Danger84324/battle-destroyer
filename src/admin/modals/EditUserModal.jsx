import React from 'react';
import { FaSave, FaGem, FaCrown, FaClock } from 'react-icons/fa';
import Modal from '../Modal';

export default function EditUserModal({ editUserModal, setEditUserModal, userForm, setUserForm, dark, modalLoading, onSave }) {
    if (!editUserModal) return null;

    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;
    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

    return (
        <Modal title={`EDIT — ${editUserModal.username}`} onClose={() => setEditUserModal(null)} dark={dark} size="lg">
            <div className="space-y-4">
                {/* Username + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Username</label>
                        <input className={inputCls} value={userForm.username}
                            onChange={e => setUserForm(p => ({ ...p, username: e.target.value }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input className={inputCls} type="email" value={userForm.email}
                            onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))} />
                    </div>
                </div>

                {/* Credits */}
                <div className={`rounded-xl p-4 border ${dark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <FaGem className="text-blue-500" size={14} />
                        <label className={`font-bold text-sm ${dark ? 'text-blue-400' : 'text-blue-700'}`}>Credits Balance</label>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Current Credits</label>
                            <div className={`text-xl font-black ${dark ? 'text-blue-400' : 'text-blue-600'}`}>{editUserModal.credits || 0}</div>
                            {editUserModal.isPro && <p className="text-[10px] mt-1 text-yellow-500">+30 daily attacks included</p>}
                        </div>
                        <div>
                            <label className={labelCls}>Update Credits</label>
                            <input className={inputCls} type="number" min="0" value={userForm.credits}
                                onChange={e => setUserForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))} />
                            <div className="flex gap-2 mt-2">
                                {[['+ 10', 10, 'bg-green-500 hover:bg-green-600'], ['+ 50', 50, 'bg-green-600 hover:bg-green-700'], ['− 10', -10, 'bg-red-500 hover:bg-red-600']].map(([label, delta, cls]) => (
                                    <button key={label}
                                        onClick={() => setUserForm(p => ({ ...p, credits: Math.max(0, p.credits + delta) }))}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold text-white ${cls} transition-all`}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className={labelCls}>New Password (optional)</label>
                    <input className={inputCls} type="password" placeholder="Leave blank to keep"
                        value={userForm.password} onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))} />
                </div>

                {/* Pro Subscription */}
                <div className={`rounded-xl p-4 border ${dark ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-yellow-200 bg-yellow-50'}`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <FaCrown className="text-yellow-500" size={14} />
                            <label className={`font-bold text-sm ${dark ? 'text-yellow-400' : 'text-yellow-700'}`}>Pro Subscription</label>
                        </div>
                        <div
                            className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${userForm.hasPro ? 'bg-yellow-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                            onClick={() => setUserForm(p => ({ ...p, hasPro: !p.hasPro, proAction: !p.hasPro ? 'add' : 'remove' }))}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${userForm.hasPro ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                    </div>

                    {editUserModal.isPro && (
                        <div className={`mb-3 p-3 rounded-lg text-xs ${dark ? 'bg-white/5' : 'bg-white'}`}>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Current Plan:</span>
                                    <span className="ml-2 font-semibold text-yellow-500">{editUserModal.subscription?.plan || 'Pro'}</span>
                                </div>
                                <div>
                                    <span className={dark ? 'text-slate-400' : 'text-slate-500'}>Days Left:</span>
                                    <span className="ml-2 font-mono">{editUserModal.subscriptionStatus?.daysLeft || 0} days</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {userForm.hasPro && (
                        <div className="space-y-3">
                            {editUserModal.isPro && (
                                <div className="flex gap-2">
                                    {['extend', 'replace'].map(action => (
                                        <button key={action}
                                            onClick={() => setUserForm(p => ({ ...p, proAction: action }))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${userForm.proAction === action
                                                ? 'bg-yellow-500 text-white'
                                                : dark ? 'bg-white/10 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                                            {action === 'extend' ? '➕ Extend' : '🔄 Replace'}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { key: 'week',   label: '7 Days',  sub: 'Weekly',  days: 7 },
                                    { key: 'month',  label: '30 Days', sub: 'Monthly', days: 30 },
                                    { key: 'season', label: '60 Days', sub: 'Season',  days: 60 },
                                    { key: 'custom', label: 'Custom',  sub: 'Set days' },
                                ].map(plan => (
                                    <button key={plan.key}
                                        onClick={() => setUserForm(p => ({ ...p, proPlan: plan.key, proDays: plan.days ?? p.proDays }))}
                                        className={`p-2.5 rounded-lg border transition-all text-xs ${userForm.proPlan === plan.key
                                            ? 'border-yellow-500 bg-yellow-500/10 text-yellow-400'
                                            : dark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-600'}`}>
                                        <div className="font-bold">{plan.label}</div>
                                        <div className="text-[10px] mt-0.5 opacity-70">{plan.sub}</div>
                                    </button>
                                ))}
                            </div>
                            {userForm.proPlan === 'custom' && (
                                <div>
                                    <label className={labelCls}>Number of Days</label>
                                    <input type="number" className={inputCls} min="1" max="365" value={userForm.proDays}
                                        onChange={e => setUserForm(p => ({ ...p, proDays: parseInt(e.target.value) || 30 }))} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* User Stats (read-only) */}
                <div className={`rounded-xl p-4 border ${dark ? 'border-green-500/20 bg-green-500/5' : 'border-green-200 bg-green-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <FaClock className="text-green-500" size={14} />
                        <label className={`font-bold text-sm ${dark ? 'text-green-400' : 'text-green-700'}`}>User Statistics</label>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Total Attacks</p>
                            <p className={`text-lg font-black ${dark ? 'text-green-400' : 'text-green-600'}`}>{editUserModal.totalAttacks?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                            <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Member Since</p>
                            <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-700'}`}>{new Date(editUserModal.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-1 pb-2">
                    <button onClick={() => setEditUserModal(null)}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={12} />}
                        Save All Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
}