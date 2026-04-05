import React from 'react';
import { FaKey, FaCopy, FaCheck } from 'react-icons/fa';
import Modal from '../Modal';

export default function RegenerateSecretModal({ newApiSecret, dark, copiedField, onCopy, onClose }) {
    if (!newApiSecret) return null;

    return (
        <Modal title="NEW API SECRET" onClose={onClose} dark={dark} size="md">
            <div className="text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-3">
                    <FaKey className="text-yellow-400" size={18} />
                </div>
                <p className={`font-semibold mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>New API Secret Generated</p>
                <p className={`text-xs mb-4 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                    ⚠️ Save this secret now — it won't be shown again!
                </p>

                {/* Secret display + copy */}
                <div className="flex items-center gap-2 mb-5">
                    <code className={`text-xs flex-1 p-3 rounded font-mono break-all text-left ${dark
                        ? 'bg-black/30 text-yellow-400'
                        : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                    }`}>
                        {newApiSecret}
                    </code>
                    <button
                        onClick={() => onCopy(newApiSecret, 'API Secret')}
                        className="shrink-0 p-3 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                        title="Copy secret"
                    >
                        {copiedField === 'API Secret' ? <FaCheck size={14} /> : <FaCopy size={14} />}
                    </button>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-2.5 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-all"
                >
                    I've Saved It ✓
                </button>
            </div>
        </Modal>
    );
}