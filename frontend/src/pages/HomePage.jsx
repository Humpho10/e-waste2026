import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { browseProducts, getCategories } from '../api/products';

// ── Icons ──────────────────────────────────────────────────
const icons = {
  Electronics:    '💻',
  'Mobile Devices': '📱',
  Accessories:    '🔌',
  Networking:     '🌐',
  Appliances:     '🖨️',
  Other:          '📦',
};

// ── Navbar ─────────────────────────────────────────────────
function Navbar({ searchQuery, onSearch }) {
  const { user, token, role, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    try { await import('../api/auth').then(m => m.logoutUser()); } catch {}
    logout();
    navigate('/');
  };

  const dashboardPath = () => {
    switch(role) {
      case 'Super-Admin':     return '/admin';
      case 'Admin':           return '/manager';
      case 'Product-Manager': return '/workspace';
      default:                return '/dashboard';
    }
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">♻️</span>
          <span className="text-xl font-bold text-blue-700">E-Waste Mart</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          <Link to="/"       className="hover:text-blue-600 transition">Home</Link>
          <Link to="/browse" className="hover:text-blue-600 transition">Browse</Link>
          {token && <Link to="/dashboard/sell" className="hover:text-blue-600 transition">Sell</Link>}
          <Link to="/about"  className="hover:text-blue-600 transition">About</Link>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          {token ? (
            <>
              <Link
                to={dashboardPath()}
                className="text-sm text-blue-600 font-medium hover:underline hidden md:block"
              >
                {user?.name?.split(' ')[0]}'s Dashboard
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2 rounded-xl transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition font-medium"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition font-medium"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Product Card ───────────────────────────────────────────
function ProductCard({ product }) {
  const { token } = useAuth();
  const navigate  = useNavigate();

  const handleClick = () => {
    if (!token) {
      navigate('/login');
    } else {
      navigate(`/products/${product.product_id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-blue-200 cursor-pointer transition group"
    >
      {/* Image placeholder */}
      <div className="w-full h-36 bg-blue-50 rounded-xl mb-3 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={`http://localhost:8000/storage/${product.images[0].image_path}`}
            alt={product.title}
            className="w-full h-full object-cover rounded-xl"
          />
        ) : (
          <span className="text-4xl opacity-40">📦</span>
        )}
      </div>

      {/* Category badge */}
      <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
        {product.category?.name}
      </span>

      {/* Title */}
      <h3 className="font-semibold text-gray-800 text-sm mt-2 group-hover:text-blue-600 transition line-clamp-2">
        {product.title}
      </h3>

      {/* Price */}
      <p className="text-blue-700 font-bold text-base mt-1">
        UGX {Number(product.price).toLocaleString()}
      </p>

      {/* Condition + Location */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
          {product.condition}
        </span>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          📍 {product.seller?.location || 'Uganda'}
        </span>
      </div>
    </div>
  );
}

// ── Skeleton Loader ────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
      <div className="w-full h-36 bg-gray-100 rounded-xl mb-3" />
      <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-3/4 mb-1" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
    </div>
  );
}

// ── Main HomePage ──────────────────────────────────────────
export default function HomePage() {
  const [categories, setCategories]   = useState([]);
  const [products, setProducts]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedCats, setExpandedCats]     = useState({});
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    Promise.all([getCategories(), browseProducts({ per_page: 8 })])
      .then(([catRes, prodRes]) => {
        setCategories(catRes.data.categories);
        setProducts(prodRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/browse?search=${searchQuery}`);
  };

  const handleCategoryClick = (catId) => {
    setActiveCategory(catId);
    navigate(`/browse?category_id=${catId}`);
  };

  const toggleExpand = (catId) => {
    setExpandedCats(prev => ({ ...prev, [catId]: !prev[catId] }));
  };

  const displayedProducts = activeCategory
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar searchQuery={searchQuery} onSearch={setSearchQuery} />

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Give Old Electronics a Second Life
          </h1>
          <p className="text-blue-100 text-lg mb-8">
            Buy & sell used components — RAM, screens, motherboards, and more.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search for a part..."
              className="flex-1 rounded-xl px-5 py-3 text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-white shadow"
            />
            <button
              type="submit"
              className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-3 rounded-xl font-semibold text-sm transition shadow"
            >
              🔍 Search
            </button>
          </form>
        </div>
      </section>

      {/* ── Main Content ──────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">

        {/* ── Left Sidebar — Categories ──────────────────── */}
        <aside className="w-56 shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sticky top-20">
            <h2 className="font-bold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <span>☰</span> Browse Categories
            </h2>
            <ul className="space-y-1">
              {categories.map(cat => (
                <li key={cat.category_id}>
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition
                      ${activeCategory === cat.category_id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                      }`}
                    onClick={() => handleCategoryClick(cat.category_id)}
                  >
                    <span className="flex items-center gap-2">
                      <span>{icons[cat.name] || '📦'}</span>
                      {cat.name}
                    </span>
                    {cat.subcategories?.length > 0 && (
                      <button
                        onClick={e => { e.stopPropagation(); toggleExpand(cat.category_id); }}
                        className="text-xs"
                      >
                        {expandedCats[cat.category_id] ? '▾' : '›'}
                      </button>
                    )}
                  </div>

                  {/* Subcategories */}
                  {expandedCats[cat.category_id] && cat.subcategories?.length > 0 && (
                    <ul className="ml-6 mt-1 space-y-0.5">
                      {cat.subcategories.map(sub => (
                        <li
                          key={sub.subcategory_id}
                          className="text-xs text-gray-500 hover:text-blue-600 cursor-pointer py-1 flex items-center gap-1.5"
                          onClick={() => navigate(`/browse?subcategory_id=${sub.subcategory_id}`)}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                          {sub.sub_category_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            <Link
              to="/browse"
              className="mt-4 flex items-center gap-1 text-blue-600 text-xs font-medium hover:underline"
            >
              ➕ View All Categories
            </Link>
          </div>
        </aside>

        {/* ── Center — Listings ──────────────────────────── */}
        <main className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              ⭐ Featured Listings
            </h2>
            <Link to="/browse" className="text-blue-600 text-sm hover:underline font-medium">
              View all →
            </Link>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array(8).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">📭</div>
              <h3 className="font-bold text-gray-700 mb-2">No listings yet</h3>
              <p className="text-gray-400 text-sm mb-4">Be the first to post an e-waste component</p>
              {token && (
                <Link
                  to="/dashboard/sell"
                  className="bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                  Post a Listing
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedProducts.map(p => (
                <ProductCard key={p.product_id} product={p} />
              ))}
            </div>
          )}
        </main>

        {/* ── Right Sidebar — Trust signals ──────────────── */}
        <aside className="w-52 shrink-0 hidden xl:block">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20 space-y-4">
            {[
              { icon: '🛡️', title: 'Verified Listings',   desc: 'All reviewed for quality'           },
              { icon: '💰', title: 'Fair Pricing',         desc: 'Transparent & competitive'          },
              { icon: '♻️', title: 'Circular Economy',     desc: 'Reduce e-waste together'            },
              { icon: '💬', title: 'Direct Contact',       desc: 'Message sellers instantly'          },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <span className="text-xl shrink-0">{icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-xs">{title}</p>
                  <p className="text-gray-400 text-xs">{desc}</p>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-100 pt-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-blue-600 text-lg">👥</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">1,200+</p>
                  <p className="text-gray-400 text-xs">Active users</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-lg">✅</span>
                <div>
                  <p className="font-bold text-gray-800 text-sm">450+</p>
                  <p className="text-gray-400 text-xs">Listings posted this week</p>
                </div>
              </div>
            </div>

            {!token && (
              <Link
                to="/register"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-xl text-xs font-semibold transition mt-2"
              >
                Join Free Today
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* ── How It Works ──────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-14 px-4 mt-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">How It Works</h2>
          <p className="text-gray-500 text-sm mb-10">Three simple steps to buy or sell e-waste</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '📋', title: 'List Your Parts',   desc: 'Post your e-waste components with photos, condition, and price.'           },
              { step: '2', icon: '🔍', title: 'Browse & Search',   desc: 'Find exactly what you need by category, condition, or location.'            },
              { step: '3', icon: '🤝', title: 'Connect & Trade',   desc: 'Message sellers directly and arrange a pickup or delivery.'                 },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl mx-auto mb-4">
                  {icon}
                </div>
                <div className="text-xs font-bold text-blue-600 mb-1">STEP {step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ────────────────────────────────────── */}
      {!token && (
        <section className="bg-gradient-to-r from-blue-700 to-blue-500 py-14 px-4 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">Ready to get started?</h2>
          <p className="text-blue-100 mb-8 text-sm">
            Join thousands of Ugandans buying and selling e-waste components
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold text-sm transition"
            >
              Create Free Account
            </Link>
            <Link
              to="/browse"
              className="border border-white text-white hover:bg-blue-600 px-8 py-3 rounded-xl font-semibold text-sm transition"
            >
              Browse Listings
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">♻️</span>
              <span className="font-bold text-white">E-Waste Mart</span>
            </div>
            <p className="text-xs max-w-xs">
              Empowering circular economy in Uganda through responsible e-waste trading.
            </p>
          </div>
          <div className="flex gap-12">
            <div>
              <p className="font-semibold text-white mb-2 text-xs">Platform</p>
              <ul className="space-y-1 text-xs">
                <li><Link to="/browse" className="hover:text-white transition">Browse</Link></li>
                <li><Link to="/login"  className="hover:text-white transition">Login</Link></li>
                <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-2 text-xs">Company</p>
              <ul className="space-y-1 text-xs">
                <li><Link to="/about"   className="hover:text-white transition">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-gray-800 text-center text-xs">
          © 2026 E-Waste Mart — Empowering circular economy in Uganda
        </div>
      </footer>
    </div>
  );
}