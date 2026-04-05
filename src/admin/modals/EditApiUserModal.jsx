import React from 'react';
import { FaSave } from 'react-icons/fa';
import Modal from '../Modal';

export default function EditApiUserModal({
    editApiUserModal,
    setEditApiUserModal,
    apiUserForm,
    setApiUserForm,
    dark,
    modalLoading,
    onSave,
    onUpdateStatus,
}) {
    if (!editApiUserModal) return null;

    const inputCls = `w-full rounded-xl px-3 py-2.5 text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;
    const labelCls = 'block text-xs font-semibold uppercase tracking-[0.08em] mb-1.5 text-slate-500';

    const isActive = editApiUserModal.status === 'active';

    return (
        <Modal title={`EDIT API USER — ${editApiUserModal.username}`} onClose={() => setEditApiUserModal(null)} dark={dark} size="md">
            <div className="space-y-4">
                {/* Read-only info */}
                {[
                    { label: 'Username', value: editApiUserModal.username },
                    { label: 'Email',    value: editApiUserModal.email },
                ].map(({ label, value }) => (
                    <div key={label} className={`rounded-xl p-3 ${dark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                        <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                        <p className={`font-mono text-sm ${dark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                    </div>
                ))}

                {/* Status toggle */}
                <div className={`rounded-xl p-4 border ${dark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className={`font-bold text-sm ${dark ? 'text-purple-400' : 'text-purple-700'}`}>Account Status</p>
                            <p className={`text-xs mt-0.5 ${dark ? 'text-slate-500' : 'text-slate-500'}`}>
                                {isActive ? 'User can access API' : 'User is blocked'}
                            </p>
                        </div>
                        <div
                            className={`relative w-10 h-5 rounded-full cursor-pointer transition-colors ${isActive ? 'bg-green-500' : dark ? 'bg-white/10' : 'bg-slate-200'}`}
                            onClick={() => {
                                const newStatus = isActive ? 'suspended' : 'active';
                                onUpdateStatus(editApiUserModal._id, newStatus);
                                setEditApiUserModal({ ...editApiUserModal, status: newStatus });
                            }}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                    </div>
                </div>

                {/* Concurrent + Duration */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className={labelCls}>Max Concurrent</label>
                        <input className={inputCls} type="number" min="1" max="20"
                            value={apiUserForm.maxConcurrent}
                            onChange={e => setApiUserForm(p => ({ ...p, maxConcurrent: parseInt(e.target.value) || 1 }))} />
                    </div>
                    <div>
                        <label className={labelCls}>Max Duration (s)</label>
                        <input className={inputCls} type="number" min="1" max="3600"
                            value={apiUserForm.maxDuration}
                            onChange={e => setApiUserForm(p => ({ ...p, maxDuration: parseInt(e.target.value) || 60 }))} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                    <button onClick={() => setEditApiUserModal(null)}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${dark ? 'bg-white/[0.05] text-slate-400 hover:bg-white/[0.1]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Cancel
                    </button>
                    <button onClick={onSave} disabled={modalLoading}
                        className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                        {modalLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSave size={12} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </Modal>
    );
}