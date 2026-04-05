import React from 'react';
import { FaSearch, FaPlus, FaUsers } from 'react-icons/fa';
import ResellerCard from '../ResellerCard';
import Pagination from '../Pagination';

export default function ResellersTab({
    dark,
    token,
    resellers,
    resellersLoading,
    resellersPage,
    resellersTotalPages,
    resellerSearch,
    setResellerSearch,
    stats,
    loadResellers,
    onAdd,
    onEdit,
    onDelete,
    onViewStats,
}) {
    const searchInputCls = `w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

    return (
        <>
            {/* Search + add bar */}
            <div className={`rounded-xl p-4 border mb-4 ${dark
                ? 'bg-surface-800/50 border-white/[0.07]'
                : 'bg-white border-slate-200 shadow-sm'
            }`}>
                <div className="flex gap-2">
                    <div className="flex-1 relative">
                        <FaSearch
                            className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-slate-600' : 'text-slate-400'}`}
                            size={12}
                        />
                        <input
                            type="text"
                            placeholder="Search resellers..."
                            value={resellerSearch}
                            onChange={e => setResellerSearch(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadResellers(token, resellerSearch, 1)}
                            className={searchInputCls}
                        />
                    </div>
                    <button
                        onClick={() => loadResellers(token, resellerSearch, 1)}
                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all"
                    >
                        Go
                    </button>
                    <button
                        onClick={onAdd}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all shrink-0"
                    >
                        <FaPlus size={10} />
                        <span className="hidden sm:inline">Add Reseller</span>
                        <span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>

            {/* Stats mini-cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                    { label: 'Total Resellers', value: stats.totalResellers, color: 'text-purple-500' },
                    { label: 'Active',           value: stats.activeResellers, color: 'text-green-500' },
                ].map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl p-3 border ${dark ? 'bg-surface-800/50 border-white/[0.07]' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <p className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                        <p className={`text-xl font-black ${color}`} style={{ fontFamily: "'Rajdhani', sans-serif" }}>{value}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {resellersLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : resellers.length === 0 ? (
                <div className={`text-center py-12 rounded-xl border ${dark ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                    <FaUsers className="mx-auto mb-3 text-3xl opacity-30" />
                    <p className={`mb-3 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>No resellers yet</p>
                    <button
                        onClick={onAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 transition-all"
                    >
                        <FaPlus size={10} /> Add First Reseller
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {resellers.map(r => (
                        <ResellerCard
                            key={r._id}
                            reseller={r}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewStats={onViewStats}
                            dark={dark}
                        />
                    ))}
                </div>
            )}

            <Pagination
                currentPage={resellersPage}
                totalPages={resellersTotalPages}
                onPageChange={page => loadResellers(token, resellerSearch, page)}
                dark={dark}
            />
        </>
    );
}