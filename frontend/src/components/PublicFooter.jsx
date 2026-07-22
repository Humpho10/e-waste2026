import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Recycle } from './icons';
import { usePlatformName } from '../hooks/useSiteSettings';

// Shared footer for every public-facing page.
export default function PublicFooter() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const goBrowse = () => navigate(token ? '/dashboard/browse' : '/');
  const platformName = usePlatformName();

  return (
    <footer className="bg-[#0b2545] text-blue-200/70 py-10 px-4 text-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
        <div className="max-w-xs">
          <div className="flex items-center gap-2 mb-3 text-white">
            <Recycle width={20} height={20} className="text-blue-300" />
            <span className="font-bold">{platformName}</span>
          </div>
          <p className="text-xs leading-relaxed">
            Empowering circular economy in Uganda through responsible e-waste trading.
          </p>
        </div>
        <div className="flex gap-12">
          <div>
            <p className="font-semibold text-white mb-3 text-xs">Platform</p>
            <ul className="space-y-2 text-xs">
              <li><button onClick={goBrowse} className="hover:text-white transition">Browse</button></li>
              <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-white mb-3 text-xs">Company</p>
            <ul className="space-y-2 text-xs">
              <li><Link to="/about" className="hover:text-white transition">About</Link></li>
              <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10 text-center text-xs">
        © 2026 {platformName} — Empowering circular economy in Uganda
      </div>
    </footer>
  );
}
