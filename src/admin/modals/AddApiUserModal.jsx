import React from 'react';
import { FaSave } from 'react-icons/fa';
import Modal from '../Modal';

export default function AddApiUserModal({ apiUserForm, setApiUserForm, onClose, dark, modalLoading, onSave }) {
    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;
    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

    const sanitizedLen = (apiUserForm.username || '').replace(/[^a-zA-Z0-9_.-]/g, '').length;
    const usernameValid = sanitizedLen >= 3;

    return (
        <Modal title="CREATE API USER" onClose={onClose} dark={dark} size="md">
            <div className="space-y-4">
                {/* Username */}
                <div>
                    <label className={labelCls}>Username *</label>
                    <input
                        className={inputCls}
                        value={apiUserForm.username}
                        onChange={e => setApiUserForm(p => ({ ...p, username: e.target.value }))}
                        placeholder="api_user_name"
                    />
                    {apiUserForm.username && (
                        <p className={`text-[10px] mt-1 ${usernameValid ? 'text-green-500' : 'text-red-500'}`}>
                            {usernameValid ? '✓ Username is valid' : 'Must be 3+ chars (letters, numbers, _, ., - only)'}
                        </p>
                    )}
                    <p className="text-[10px] mt-1 text-slate-500">Allowed: letters, numbers, underscores, dots, hyphens</p>
                </div>

                {/* Email */}
                <div>
                    <label className={labelCls}>Email *</label>
                    <input className={inputCls} type="email"
                        value={apiUserForm.email}
                        onChange={e => setApiUserForm(p => ({ ...p, email: e.target.value }))}
                        placeholder="api@example.com" />
                </div>

                {/* Concurrent + Duration */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Max Concurrent</label>
                        <input className={inputCls} type="number" min="1" max="20"
                            value={apiUserForm.maxConcurrent}
                            onChange={e => setApiUserForm(p => ({ ...p, maxConcurrent: parseInt(e.target.value) || 1 }))} />
                        <p className="text-[10px] mt-1 text-slate-500">Attacks at once</p>
                    </div>
                    <div>
                        <label className={labelCls}>Max Duration (s)</label>
                        <input className={inputCls} type="number" min="1" max="3600"
                            value={apiUserForm.maxDuration}
                            onChange={e => setApiUserForm(p => ({ ...p, maxDuration: parseInt(e.target.value) || 60 }))} />
                        <p className="text-[10px] mt-1 text-slate-500">Max attack length</p>
                    </div>
                </div>

                {/* Expiration */}
                <div>
                    <label className={labelCls}>Expiration Days</label>
                    <input className={inputCls} type="number" min="0" max="365"
                        value={apiUserForm.expirationDays ?? 30}
                        onChange={e => setApiUserForm(p => ({ ...p, expirationDays: parseInt(e.target.value) || 30 }))} />
                    <p className="text-[10px] mt-1 text-slate-500">Set 0 for no expiration</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={onClose}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={12} />}
                        Create API User
                    </button>
                </div>
            </div>
        </Modal>
    );
}