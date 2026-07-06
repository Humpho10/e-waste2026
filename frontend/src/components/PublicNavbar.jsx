import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { logoutUser } from '../api/auth';
import { Recycle, Menu, X } from './icons';
import ThemeToggle from './ThemeToggle';

// Shared top nav for every public-facing page (Home, About, Contact...).
// onHome/onBrowse/onAbout are optional overrides — the homepage passes
// smooth-scroll versions for a nicer in-page feel; every other page just
// falls back to real route navigation.
export default function PublicNavbar({ onAbout, onHome, onBrowse }) {
  const { user, token, role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const dashboardPath = () => ({
    'Super-Admin': '/admin', 'Admin': '/manager', 'Product-Manager': '/workspace',
  }[role] || '/dashboard');

  const sellTo = token ? '/dashboard/create' : '/login';

  const handleHome = onHome || (() => navigate('/'));
  const handleBrowse = onBrowse || (() => navigate(token ? '/dashboard/browse' : '/'));
  const handleAbout = onAbout || (() => navigate('/about'));

  const doLogout = async () => {
    try { await logoutUser(); } catch {}
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const NavLinks = ({ onClick }) => (
    <>
      <button onClick={() => { onClick?.(); handleHome(); }}   className="nav-pill text-left">Home</button>
      <button onClick={() => { onClick?.(); handleBrowse(); }} className="nav-pill text-left">Browse</button>
      <Link to={sellTo} onClick={onClick} className="nav-pill">Sell</Link>
      <button onClick={() => { onClick?.(); handleAbout(); }} className="nav-pill text-left">About</button>
      <Link to="/contact" onClick={onClick} className="nav-pill">Contact</Link>
    </>
  );

  return (
    <nav className="bg-[#0b2545] text-blue-100 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300">
            <Recycle width={18} height={18} />
          </span>
          <span className="text-lg font-bold text-white tracking-tight">E-Waste Mart</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-medium">
          <NavLinks />
        </div>

        {/* Desktop auth */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle variant="navbar" />
          {token ? (
            <>
              <Link to={dashboardPath()} className="text-sm text-blue-200 font-medium hover:text-white transition">
                {user?.name?.split(' ')[0] || 'My'}'s Dashboard
              </Link>
              <button onClick={doLogout}
                className="btn-lift text-sm border border-blue-300/40 text-blue-100 hover:bg-white/10 hover:border-blue-200 px-4 py-2 rounded-lg">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login"
                className="btn-lift text-sm border border-blue-300/50 text-white hover:bg-white/10 hover:border-white px-4 py-2 rounded-lg font-medium">
                Login
              </Link>
              <Link to="/register"
                className="btn-lift text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium shadow-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Mobile: theme toggle + menu */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle variant="navbar" />
          <button className="text-white p-1" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 px-4 py-4 flex flex-col gap-4 text-sm font-medium bg-[#0b2545]">
          <NavLinks onClick={() => setMenuOpen(false)} />
          <div className="border-t border-white/10 pt-4 flex flex-col gap-2">
            {token ? (
              <>
                <Link to={dashboardPath()} onClick={() => setMenuOpen(false)}
                  className="btn-lift bg-blue-600 hover:bg-blue-500 text-white text-center py-2.5 rounded-lg">Go to Dashboard</Link>
                <button onClick={doLogout}
                  className="btn-lift border border-blue-300/40 text-blue-100 hover:bg-white/10 py-2.5 rounded-lg">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setMenuOpen(false)}
                  className="btn-lift border border-blue-300/50 text-white hover:bg-white/10 text-center py-2.5 rounded-lg">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}
                  className="btn-lift bg-blue-600 hover:bg-blue-500 text-white text-center py-2.5 rounded-lg">Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
