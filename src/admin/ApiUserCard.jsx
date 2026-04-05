import React from 'react';
import { FaChartLine, FaClock, FaTrash, FaRedoAlt } from 'react-icons/fa';

export default function ApiUserCard({ apiUser, dark, onViewStats, onEdit, onExtend, onRegenerate, onDelete }) {
    const isExpired = apiUser.expiresAt && new Date(apiUser.expiresAt) < new Date();
    const isExpiringSoon = !isExpired && apiUser.daysRemaining <= 7;

    const expiryBadge = isExpired
        ? 'bg-red-500/20 text-red-400'
        : isExpiringSoon
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-green-500/20 text-green-400';

    return (
        <div className={`rounded-xl border transition-all ${dark
            ? 'bg-surface-800/50 border-white/[0.07] hover:border-cyan-500/30'
            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
        }`}>
            {/* ── Info section ── */}
            <div className="p-4 pb-3">
                {/* Username + status badges */}
                <div className="flex items-start gap-2 flex-wrap mb-1">
                    <h3 className={`font-bold text-base leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {apiUser.username}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${apiUser.status === 'active'
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                            {apiUser.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/20 text-blue-400">
                            {apiUser.currentActive || 0}/{apiUser.limits?.maxConcurrent || 2} active
                        </span>
                        {apiUser.expiresAt && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${expiryBadge}`}>
                                {isExpired ? 'EXPIRED' : `${apiUser.daysRemaining || 0}d left`}
                            </span>
                        )}
                    </div>
                </div>

                {/* Email */}
                <p className={`text-xs mb-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{apiUser.email}</p>

                {/* Stats row - wraps gracefully on mobile */}
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {[
                        { icon: '📊', label: `${(apiUser.totalRequests || 0).toLocaleString()} reqs` },
                        { icon: '🎯', label: `${(apiUser.totalAttacks || 0).toLocaleString()} attacks` },
                        { icon: '🔑', label: `${apiUser.apiKey?.slice(0, 10)}…` },
                        { icon: '⏱', label: `${apiUser.limits?.maxDuration || 300}s max` },
                        ...(apiUser.expiresAt ? [{ icon: '📅', label: new Date(apiUser.expiresAt).toLocaleDateString() }] : []),
                    ].map(({ icon, label }) => (
                        <span key={label} className={`text-[11px] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                            {icon} {label}
                        </span>
                    ))}
                </div>
            </div>

            {/* ── Action buttons ── */}
            {/* Mobile: 3-col grid (row 1: Stats/Edit/Extend, row 2: Regen/Delete spanning) */}
            {/* Desktop (sm+): single flex row */}
            <div className={`px-4 pb-4 pt-3 border-t ${dark ? 'border-white/[0.06]' : 'border-slate-100'}`}>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    <ActionBtn
                        dark={dark}
                        color="blue"
                        icon={<FaChartLine size={10} />}
                        label="Stats"
                        onClick={() => onViewStats(apiUser)}
                    />
                    <ActionBtn
                        dark={dark}
                        color="yellow"
                        icon={<span className="text-[10px]">✏️</span>}
                        label="Edit"
                        onClick={() => onEdit(apiUser)}
                    />
                    <ActionBtn
                        dark={dark}
                        color="green"
                        icon={<FaClock size={10} />}
                        label="Extend"
                        onClick={() => onExtend(apiUser)}
                    />
                    <ActionBtn
                        dark={dark}
                        color="purple"
                        icon={<FaRedoAlt size={10} />}
                        label="Regen"
                        onClick={() => onRegenerate(apiUser)}
                    />
                    {/* Delete spans 1 col on sm+, but gets full last col on mobile (3rd col, 2nd row) */}
                    <ActionBtn
                        dark={dark}
                        color="red"
                        icon={<FaTrash size={10} />}
                        label="Delete"
                        onClick={() => onDelete(apiUser)}
                        extraCls="col-span-1"
                    />
                </div>
            </div>
        </div>
    );
}

// ── Small helper to avoid repetition ────────────────────────────
const colorMap = {
    blue:   { dark: 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30',     light: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    yellow: { dark: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30', light: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    green:  { dark: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',   light: 'bg-green-100 text-green-700 hover:bg-green-200' },
    purple: { dark: 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30', light: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
    red:    { dark: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',         light: 'bg-red-100 text-red-700 hover:bg-red-200' },
};

function ActionBtn({ dark, color, icon, label, onClick, extraCls = '' }) {
    const cls = dark ? colorMap[color].dark : colorMap[color].light;
    return (
        <button
            onClick={onClick}
            className={`${cls} ${extraCls} flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-2 rounded-lg text-[11px] font-semibold transition-all`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}