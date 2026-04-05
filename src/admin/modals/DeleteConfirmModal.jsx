import React from 'react';
import { FaTrash } from 'react-icons/fa';
import Modal from '../Modal';

/**
 * Generic delete confirmation modal.
 *
 * Props:
 *   item        – object with at least { username }
 *   entityLabel – e.g. "User" | "Reseller" | "API User"
 *   onClose     – () => void
 *   onConfirm   – async () => void
 *   dark        – boolean
 *   modalLoading – boolean
 */
export default function DeleteConfirmModal({ item, entityLabel = 'Item', onClose, onConfirm, dark, modalLoading }) {
    if (!item) return null;

    return (
        <Modal title="CONFIRM DELETE" onClose={onClose} dark={dark} size="sm">
            <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                    <FaTrash className="text-red-400" size={18} />
                </div>
                <p className={`font-semibold mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>
                    Delete {entityLabel} <span className="text-red-400">"{item.username}"</span>?
                </p>
                <p className={`text-xs mb-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className={`flex-1 py-2 rounded-xl font-semibold text-sm ${dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'}`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={modalLoading}
                        className="flex-1 py-2 rounded-xl font-bold text-sm text-white bg-red-600 hover:bg-red-500 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {modalLoading
                            ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            : <FaTrash size={10} />
                        }
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
    );
}