import React from 'react';
import { FaSave, FaGem } from 'react-icons/fa';
import Modal from '../Modal';

export default function ResellerFormModal({
    isEdit,
    editResellerModal,
    setEditResellerModal,
    setAddResellerModal,
    resellerForm,
    setResellerForm,
    dark,
    modalLoading,
    onSave,
}) {
    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;
    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

    const handleClose = () => {
        if (isEdit) setEditResellerModal(null);
        else setAddResellerModal(false);
    };

    return (
        <Modal
            title={isEdit ? `EDIT — ${editResellerModal.username}` : 'ADD RESELLER'}
            onClose={handleClose}
            dark={dark}
            size="md"
        >
            <div className="space-y-4">
                {/* Username + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Username</label>
                        <input className={inputCls} value={resellerForm.username}
                            onChange={e => setResellerForm(p => ({ ...p, username: e.target.value }))}
                            placeholder="reseller_name" />
                    </div>
                    <div>
                        <label className={labelCls}>Email</label>
                        <input className={inputCls} type="email" value={resellerForm.email}
                            onChange={e => setResellerForm(p => ({ ...p, email: e.target.value }))}
                            placeholder="email@example.com" />
                    </div>
                </div>

                {/* Password */}
                <div>
                    <label className={labelCls}>{isEdit ? 'New Password (optional)' : 'Password'}</label>
                    <input className={inputCls} type="password" value={resellerForm.password}
                        onChange={e => setResellerForm(p => ({ ...p, password: e.target.value }))}
                        placeholder={isEdit ? 'Leave blank to keep' : 'Strong password'} />
                </div>

                {/* Credits */}
                <div className={`rounded-xl p-4 border ${dark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                    <div className="flex items-center gap-2 mb-3">
                        <FaGem className="text-purple-500" size={14} />
                        <label className={`font-bold text-sm ${dark ? 'text-purple-400' : 'text-purple-700'}`}>Credits Balance</label>
                    </div>
                    <div className="flex gap-2">
                        <input className={inputCls} type="number" min="0" value={resellerForm.credits}
                            onChange={e => setResellerForm(p => ({ ...p, credits: parseInt(e.target.value) || 0 }))} />
                        <button
                            onClick={() => setResellerForm(p => ({ ...p, credits: p.credits + 100 }))}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-green-500 text-white hover:bg-green-600 transition-all shrink-0">
                            +100
                        </button>
                        <button
                            onClick={() => setResellerForm(p => ({ ...p, credits: p.credits + 1000 }))}
                            className="px-3 py-2 rounded-lg text-xs font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-all shrink-0">
                            +1K
                        </button>
                    </div>
                    <p className={`text-xs mt-2 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                        💡 Resellers use credits to create Pro subscriptions for their customers.
                    </p>
                </div>

                {/* Block toggle (edit only) */}
                {isEdit && (
                    <div className={`rounded-xl p-4 border ${dark ? 'border-red-500/20 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className={`font-bold text-sm ${dark ? 'text-red-400' : 'text-red-700'}`}>Block Reseller</p>
                                <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>Blocked resellers cannot log in</p>
                            </div>
                            <div
                                className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${resellerForm.isBlocked ? 'bg-red-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                                onClick={() => setResellerForm(p => ({ ...p, isBlocked: !p.isBlocked }))}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${resellerForm.isBlocked ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-1">
                    <button onClick={handleClose}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={12} />}
                        {isEdit ? 'Save Changes' : 'Create Reseller'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}