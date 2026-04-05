import React from 'react';
import { FaSearch } from 'react-icons/fa';
import UserCard from '../UserCard';
import Pagination from '../Pagination';

export default function UsersTab({
    dark,
    token,
    users,
    usersLoading,
    usersPage,
    usersTotalPages,
    searchQuery,
    setSearchQuery,
    userFilter,
    setUserFilter,
    loadUsers,
    onEdit,
    onDelete,
}) {
    const searchInputCls = `w-full pl-9 pr-3 py-2.5 rounded-lg text-sm border outline-none transition ${dark
        ? 'bg-white/[0.04] border-white/[0.1] text-slate-100 placeholder-slate-600'
        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'}`;

    return (
        <>
            {/* Search + filter bar */}
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
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadUsers(token, searchQuery, 1, userFilter)}
                            className={searchInputCls}
                        />
                    </div>
                    <button
                        onClick={() => loadUsers(token, searchQuery, 1, userFilter)}
                        className="px-4 py-2.5 rounded-lg font-semibold text-sm text-white bg-red-600 hover:bg-red-500 transition-all"
                    >
                        Go
                    </button>
                </div>

                {/* Filter chips */}
                <div className="flex gap-2 mt-3 flex-wrap items-center">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Filter:
                    </span>
                    {[
                        { key: 'all',  label: 'All' },
                        { key: 'pro',  label: '⭐ Pro' },
                        { key: 'free', label: '💎 Free' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => { setUserFilter(key); loadUsers(token, searchQuery, 1, key); }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${userFilter === key
                                ? 'bg-red-600 text-white'
                                : dark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-100 text-slate-600'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List */}
            {usersLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : users.length === 0 ? (
                <div className={`text-center py-12 rounded-xl border ${dark ? 'border-white/[0.07]' : 'border-slate-200'}`}>
                    <p className={dark ? 'text-slate-500' : 'text-slate-400'}>No users found</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map(user => (
                        <UserCard
                            key={user._id}
                            user={user}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            dark={dark}
                        />
                    ))}
                </div>
            )}

            <Pagination
                currentPage={usersPage}
                totalPages={usersTotalPages}
                onPageChange={page => loadUsers(token, searchQuery, page, userFilter)}
                dark={dark}
            />
        </>
    );
}