import React from 'react';
import { FaSearch, FaPlus, FaKey } from 'react-icons/fa';
import ApiUserCard from '../ApiUserCard';
import Pagination from '../Pagination';

const STATUS_FILTERS = [
    { key: '',           label: 'All' },
    { key: 'active',     label: '🟢 Active' },
    { key: 'suspended',  label: '🔴 Suspended' },
];

export default function ApiUsersTab({
    dark,
    token,
    apiUsers,
    apiUsersLoading,
    apiUsersPage,
    apiUsersTotalPages,
    apiUsersSearch,
    setApiUsersSearch,
    apiUsersStatus,
    setApiUsersStatus,
    stats,
    loadApiUsers,
    onAdd,
    onEdit,
    onViewStats,
    onExtend,
    onRegenerate,
    onDelete,
}) {
    const searchInputCls = `w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

    const activeCount = apiUsers.filter(u => u.status === 'active').length;

    return (
        <>
            {/* Search + status filters + add */}
            <div className={`rounded-xl p-4 border mb-4 ${dark
                ? 'bg-surface-800/50 border-white/[0.07]'
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
                {/* Row 1: search + buttons */}
                <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative">
                        <FaSearch
                            className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`}
                            size={12}
                        />
                        <input
                            type="text"
                            placeholder="Search API users..."
                            value={apiUsersSearch}
                            onChange={e => setApiUsersSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadApiUsers(token, apiUsersSearch, 1, apiUsersStatus)}
                            className={searchInputCls}
                        />
                    </div>
                    <button
                        onClick={() => loadApiUsers(token, apiUsersSearch, 1, apiUsersStatus)}
                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all"
                    >
                        Go
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-all shrink-0"
                    >
                        <FaPlus size={10} />
                        <span className="hidden sm:inline">Add API User</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>

                {/* Row 2: status filter chips */}
                <div className="flex gap-2 flex-wrap items-center">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Status:
                    </span>
                    {STATUS_FILTERS.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setApiUsersStatus(key);
                                loadApiUsers(token, apiUsersSearch, 1, key);
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${apiUsersStatus === key
                                ? 'bg-cyan-600 text-white'
                                : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats mini-cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                    { label: 'Total API Users', value: stats.totalApiUsers || apiUsers.length, color: 'text-cyan-500' },
                    { label: 'Active',           value: stats.activeApiUsers ?? activeCount,    color: 'text-green-500' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl p-3 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                        <p className={`text-xl font-black ${color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {apiUsersLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : apiUsers.length === 0 ? (
                <div className={`text-center py-12 rounded-xl border ${dark ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                    <FaKey className="mx-auto mb-3 text-3xl opacity-30" />
                    <p className={`mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No API users yet</p>
                    <button
                        onClick={onAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white bg-cyan-600 hover:bg-cyan-500 transition-all"
                    >
                        <FaPlus size={10} /> Add First API User
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {apiUsers.map(apiUser => (
                        <ApiUserCard
                            key={apiUser._id}
                            apiUser={apiUser}
                            dark={dark}
                            onViewStats={onViewStats}
                            onEdit={onEdit}
                            onExtend={onExtend}
                            onRegenerate={onRegenerate}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}

            <Pagination
                currentPage={apiUsersPage}
                totalPages={apiUsersTotalPages}
                onPageChange={page => loadApiUsers(token, apiUsersSearch, page, apiUsersStatus)}
                dark={dark}
            />
        </>
    );
}