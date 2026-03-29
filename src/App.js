import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Attack    from './pages/Attack';
import Contact   from './pages/Contact';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  
  // ✅ Reactive auth state instead of token()
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ✅ Listen for localStorage changes (login/logout)
  useEffect(() => {
    const checkAuth = () => setIsAuth(!!localStorage.getItem('token'));
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Navigate to={isAuth ? "/dashboard" : "/login"} />} />
        <Route path="/login"     element={!isAuth ? <Login     toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/signup"    element={!isAuth ? <Signup    toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={isAuth ? <Dashboard toggleTheme={toggleTheme} theme={theme} setIsAuth={setIsAuth} /> : <Navigate to="/login" />} />
        <Route path="/attack"    element={isAuth ? <Attack    toggleTheme={toggleTheme} theme={theme} /> : <Navigate to="/login" />} />
        <Route path="/contact"   element={isAuth ? <Contact   toggleTheme={toggleTheme} theme={theme} /> : <Navigate to="/login" />} />
        <Route path="*"          element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;