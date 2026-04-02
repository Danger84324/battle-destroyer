import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  FaBolt, FaBullseye, FaSignOutAlt, FaGem,
  FaUser, FaBars, FaTimes, FaCrown,
} from 'react-icons/fa';
import { MdWbSunny, MdNightlight } from 'react-icons/md';

export default function Navbar({ toggleTheme, theme, setIsAuth }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = JSON.parse(localStorage.getItem('user') || '{}');
  const dark       = theme !== 'light';
  const isLoggedIn = !!(localStorage.getItem('token') && user.username);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const logout = () => {
    localStorage.clear();
    setIsAuth(false);
    navigate('/login');
  };

  const protectedNavLinks = [
    { path: '/dashboard',       label: 'Dashboard',      icon: FaBolt     },
    { path: '/attack',          label: 'Attack',         icon: FaBullseye },
  ];
  const publicNavLinks = [
    { path: '/contact',         label: 'Upgrade Plan',   icon: FaGem      },
    { path: '/reseller-prices', label: 'Reseller Plans', icon: FaCrown    },
    { path: '/reseller',        label: 'Reseller Login', icon: FaCrown    },
  ];
  const allNavLinks  = [...protectedNavLinks, ...publicNavLinks];
  const isActive     = (path) => location.pathname === path;

  const linkCls = (path) =>
    `relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
     transition-all whitespace-nowrap
     ${isActive(path)
       ? 'text-red-400'
       : dark
         ? 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
         : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
     }`;

  /* ── nav bg ── */
  const navBg = scrolled || menuOpen
    ? dark
      ? 'bg-[#0d0d18] border-b border-white/[0.07] shadow-lg'
      : 'bg-white border-b border-slate-200 shadow-sm'
    : dark
      ? 'bg-[#0d0d18]/80 border-b border-white/[0.05]'
      : 'bg-white/80 border-b border-slate-100';

  return (
    <>
      {/* ── NAV BAR ── */}
      <nav className={`sticky top-0 z-50 transition-all duration-200 ${navBg}`}
           style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">

            {/* Logo */}
            <Link to={isLoggedIn ? '/dashboard' : '/'}
                  className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative flex-shrink-0">
                <img src="/logo512.png" alt="Battle Destroyer"
                     className="w-8 h-8 rounded-xl object-contain"
                     style={{ filter: 'drop-shadow(0 0 7px rgba(220,38,38,0.5))' }} />
              </div>
              <span className="tracking-[0.13em] text-sm sm:text-[15px] font-bold text-red-500"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                BATTLE-DESTROYER
              </span>
            </Link>

            {/* Desktop nav — lg+ */}
            <div className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
              {(isLoggedIn ? allNavLinks : publicNavLinks).map(link => (
                <Link key={link.path} to={link.path} className={linkCls(link.path)}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {isActive(link.path) && (
                    <span className="absolute inset-0 rounded-xl bg-red-500/10 border border-red-500/25" />
                  )}
                  <link.icon size={13} className={isActive(link.path) ? 'text-red-500' : ''} />
                  <span className="relative">{link.label}</span>
                </Link>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all
                  ${dark
                    ? 'bg-white/[0.07] hover:bg-white/[0.13] text-amber-400 border border-white/[0.08]'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                  }`}
              >
                {dark ? <MdWbSunny size={15} /> : <MdNightlight size={15} />}
              </button>

              {isLoggedIn ? (
                <>
                  {/* Full user chip — xl+ */}
                  <div className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl border
                    ${dark
                      ? 'bg-white/[0.04] border-white/[0.09]'
                      : 'bg-slate-50 border-slate-200'
                    }`}>
                    {user.isPro ? (
                      <>
                        <FaCrown className="text-yellow-400" size={12} />
                        <span className="text-yellow-400 font-bold text-xs tracking-wide">PRO</span>
                      </>
                    ) : (
                      <>
                        <FaGem className="text-red-400" size={12} />
                        <span className="text-red-400 font-bold tabular-nums text-xs">{user.credits ?? 0}</span>
                      </>
                    )}
                    <span className={dark ? 'text-white/15' : 'text-slate-300'}>|</span>
                    <span className={`font-medium text-xs truncate max-w-[90px]
                      ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
                      {user.username}
                    </span>
                  </div>

                  {/* Compact badge — sm–xl */}
                  <div className={`hidden sm:flex xl:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-xl border
                    ${dark
                      ? 'bg-white/[0.04] border-white/[0.09]'
                      : 'bg-slate-50 border-slate-200'
                    }`}>
                    {user.isPro ? (
                      <>
                        <FaCrown className="text-yellow-400" size={12} />
                        <span className="text-yellow-400 font-bold text-xs">PRO</span>
                      </>
                    ) : (
                      <>
                        <FaGem className="text-red-400" size={12} />
                        <span className="text-red-400 font-bold text-xs tabular-nums">{user.credits ?? 0}</span>
                      </>
                    )}
                  </div>

                  {/* Logout */}
                  <button onClick={logout}
                    className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      text-xs font-semibold transition-all border
                      ${dark
                        ? 'bg-red-500/10 hover:bg-red-600 border-red-500/25 text-red-400 hover:text-white hover:border-red-600'
                        : 'bg-red-50 hover:bg-red-600 border-red-200 text-red-500 hover:text-white hover:border-red-600'
                      }`}>
                    <FaSignOutAlt size={12} />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                </>
              ) : (
                <Link to="/login"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl
                    text-xs font-bold text-white bg-red-600 hover:bg-red-500
                    transition-all active:scale-95 border border-red-500"
                  style={{
                    boxShadow: '0 3px 14px rgba(220,38,38,0.35)',
                    fontFamily: "'Rajdhani', sans-serif",
                    letterSpacing: '0.08em',
                  }}>
                  <FaUser size={11} />
                  LOGIN
                </Link>
              )}

              {/* Hamburger — below lg */}
              <button
                onClick={() => setMenuOpen(v => !v)}
                aria-label="Toggle menu"
                className={`lg:hidden w-8 h-8 rounded-xl flex items-center justify-center
                  transition-all border
                  ${dark
                    ? 'bg-white/[0.06] border-white/[0.08] text-white hover:bg-white/[0.1]'
                    : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
                  }`}>
                {menuOpen ? <FaTimes size={14} /> : <FaBars size={14} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-40" style={{ top: '64px' }}>

          {/* Dim backdrop — NO blur, just a translucent overlay */}
          <div
            className={`absolute inset-0 ${dark ? 'bg-black/60' : 'bg-black/20'}`}
            onClick={() => setMenuOpen(false)}
          />

          {/* Slide-down panel */}
          <div className={`relative z-10 mx-3 mt-2 rounded-2xl border shadow-2xl overflow-hidden
            ${dark
              ? 'bg-[#0f0f1e] border-white/[0.1]'
              : 'bg-white border-slate-200'
            }`}>
            <div className="p-3 space-y-1 max-h-[calc(100svh-88px)] overflow-y-auto">

              {isLoggedIn ? (
                <>
                  {/* User card */}
                  <div className={`flex items-center gap-3 px-3 py-3 rounded-xl mb-1
                    ${dark ? 'bg-white/[0.05]' : 'bg-slate-50 border border-slate-100'}`}>
                    <div className="w-9 h-9 rounded-xl bg-red-600/15 border border-red-600/20
                                    flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img src="/logo512.png" alt="" className="w-5 h-5 object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold text-sm truncate
                        ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {user.username}
                      </p>
                      {user.isPro ? (
                        <p className="text-yellow-400 text-xs font-bold flex items-center gap-1">
                          <FaCrown size={9} /> Pro Active
                        </p>
                      ) : (
                        <p className="text-red-400 text-xs font-bold flex items-center gap-1">
                          <FaGem size={9} /> {user.credits ?? 0} credits
                        </p>
                      )}
                    </div>
                    <button onClick={logout}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                        text-xs font-semibold flex-shrink-0 border transition-all
                        ${dark
                          ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-600 hover:text-white'
                          : 'bg-red-50 border-red-200 text-red-500 hover:bg-red-600 hover:text-white'
                        }`}>
                      <FaSignOutAlt size={11} />
                      Logout
                    </button>
                  </div>

                  {allNavLinks.map(link => (
                    <Link key={link.path} to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all
                        ${isActive(link.path)
                          ? dark
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-red-50 text-red-600 border border-red-100'
                          : dark
                            ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}>
                      <link.icon size={13} />
                      {link.label}
                    </Link>
                  ))}
                </>
              ) : (
                <>
                  {publicNavLinks.map(link => (
                    <Link key={link.path} to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all
                        ${isActive(link.path)
                          ? dark
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : 'bg-red-50 text-red-600 border border-red-100'
                          : dark
                            ? 'text-slate-400 hover:bg-white/[0.05] hover:text-white'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}>
                      <link.icon size={13} />
                      {link.label}
                    </Link>
                  ))}

                  <Link to="/login"
                    className="flex items-center justify-center gap-2 px-3 py-2.5
                      rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500
                      w-full transition-all mt-1 active:scale-95"
                    style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: '0.08em',
                             boxShadow: '0 3px 14px rgba(220,38,38,0.3)' }}>
                    <FaUser size={12} />
                    LOGIN
                  </Link>
                </>
              )}

              {/* Divider */}
              <div className={`h-px my-1 ${dark ? 'bg-white/[0.07]' : 'bg-slate-100'}`} />

              {/* Theme row */}
              <button onClick={toggleTheme}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-sm font-medium w-full transition-all
                  ${dark
                    ? 'text-amber-400 hover:bg-white/[0.05]'
                    : 'text-slate-600 hover:bg-slate-50'
                  }`}>
                {dark
                  ? <><MdWbSunny size={14} /> Switch to Light Mode</>
                  : <><MdNightlight size={14} /> Switch to Dark Mode</>
                }
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}