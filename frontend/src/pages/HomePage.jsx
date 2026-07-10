import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { browseProducts, getCategories, getStats, searchByImage, getPublicSettings } from '../api/products';
import { getTopRatedSellers } from '../api/ratings';
import { logoutUser } from '../api/auth';
import ThemeToggle from '../components/ThemeToggle';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import BackToTopButton from '../components/BackToTopButton';
import Reveal from '../components/Reveal';
import StatNumber from '../components/StatNumber';
import {
  Recycle, Search, X, ChevronRight, ChevronDown, ArrowRight, Plus,
  MapPin, Star, Shield, Tag, Chat, Users, CheckCircle, List, Camera,
  categoryIcon,
} from '../components/icons';

// ── Rotating hero background images ──
// Files live directly in frontend/public/ (hero-1.webp ... hero-6.webp).
const HERO_IMAGES = [
  '/hero-1.webp',
  '/hero-2.webp',
  '/hero-3.webp',
  '/hero-4.webp',
  '/hero-5.webp',
  '/hero-6.webp',
];
const HERO_ROTATE_MS = 3000;

// ── Fallback data — keeps the page looking great even if the API is down ──
const SAMPLE_CATEGORIES = [
  {
    category_id: 'c1', name: 'Computer Components',
    subcategories: [
      { subcategory_id: 's1', sub_category_name: 'RAM' },
      { subcategory_id: 's2', sub_category_name: 'Laptop Screens' },
      { subcategory_id: 's3', sub_category_name: 'Motherboards' },
      { subcategory_id: 's4', sub_category_name: 'Power Supplies' },
      { subcategory_id: 's5', sub_category_name: 'Hard Drives' },
      { subcategory_id: 's6', sub_category_name: 'Processors (CPU)' },
    ],
  },
  { category_id: 'c2', name: 'Mobile Phone Parts',     subcategories: [] },
  { category_id: 'c3', name: 'Networking & Accessories', subcategories: [] },
  { category_id: 'c4', name: 'Office Equipment',       subcategories: [] },
  { category_id: 'c5', name: 'Entertainment & Audio',  subcategories: [] },
];

/*
const SAMPLE_PRODUCTS = [
  { product_id: 'p1', title: '8GB DDR4 Laptop RAM', price: 85000,  condition: 'Excellent',      category: { name: 'Computer'  }, seller: { location: 'Kikuubo'    } },
  { product_id: 'p2', title: '15.6" LCD Screen',    price: 120000, condition: 'Good',           category: { name: 'Computer'  }, seller: { location: 'Nakawa'     } },
  { product_id: 'p3', title: 'Dell Motherboard',    price: 150000, condition: 'Fair',           category: { name: 'Computer'  }, seller: { location: 'Ntinda'     } },
  { product_id: 'p4', title: '500W Power Supply',   price: 65000,  condition: 'For Parts Only', category: { name: 'Accessory' }, seller: { location: 'Wandegeya'  } },
  { product_id: 'p5', title: 'iPhone 11 LCD Screen',price: 95000,  condition: 'Good',           category: { name: 'Phone'     }, seller: { location: 'Kikuubo'    } },
  { product_id: 'p6', title: '1TB External HDD',    price: 110000, condition: 'Excellent',      category: { name: 'Computer'  }, seller: { location: 'Ntinda'     } },
].map(p => ({ ...p, _sample: true }));

const conditionStyle = (c = '') => {
  const k = c.toLowerCase();
  if (k.includes('excellent')) return 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-400';
  if (k.includes('good'))      return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400';
  if (k.includes('fair'))      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400';
  return 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400'; // parts only / unknown
};
*/
// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product }) {
  const { token } = useAuth();
  const navigate  = useNavigate();
  const [imgError, setImgError] = useState(false);
  const Icon = categoryIcon(`${product.category?.name} ${product.title}`);

  const handleClick = () => {
    if (!token)            navigate('/login');
    else if (product._sample) navigate('/dashboard/browse');
    else                   navigate(`/dashboard/product/${product.slug}-${product.hash_id}`);
  };

  const img = product.images?.[0]?.image_path;

  return (
    <button
      onClick={handleClick}
      className="text-left bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800 hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      {/* Icon / image tile */}
      <div className="w-full h-28 bg-gradient-to-br from-blue-50 to-sky-100 dark:from-blue-950/40 dark:to-sky-950/40 rounded-xl mb-3 flex items-center justify-center overflow-hidden text-blue-500 dark:text-blue-400">
        {img && !imgError ? (
          <img src={`http://localhost:8000/storage/${img}`} alt={product.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-xl" />
        ) : (
          <Icon width={40} height={40} className="opacity-80 group-hover:scale-110 transition-transform" />
        )}
      </div>

      <span className="text-[11px] text-blue-700 dark:text-blue-400 font-semibold bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
        {product.category?.name || 'Component'}
      </span>

      <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm mt-2 group-hover:text-blue-600 transition line-clamp-2 min-h-[2.5rem]">
        {product.title}
      </h3>

      <p className="text-[#0b2545] dark:text-blue-300 font-bold text-base mt-1">
        UGX {Number(product.price).toLocaleString()}
      </p>

      <div className="flex items-center justify-between mt-2 gap-2">
        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${conditionStyle(product.condition)}`}>
          {product.condition}
        </span>
        <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1 truncate">
          <MapPin width={12} height={12} /> {product.seller?.location || 'Uganda'}
        </span>
      </div>
    </button>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 animate-pulse">
      <div className="w-full h-28 bg-gray-100 dark:bg-slate-800 rounded-xl mb-3" />
      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded w-16 mb-2" />
      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-3/4 mb-1" />
      <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded w-1/2" />
    </div>
  );
}

// Finds a real listing photo belonging to a category, so the sidebar can
// show an actual product thumbnail instead of a generic icon when one's
// available — falls back to the icon otherwise (new categories, API down).
function categoryThumb(categoryName, products) {
  const key = (categoryName || '').toLowerCase().split(' ')[0];
  if (!key) return null;
  const match = products.find(p => {
    const img = p.images?.[0]?.image_path;
    if (!img) return false;
    const pName = (p.category?.name || '').toLowerCase();
    return pName.includes(key) || (categoryName || '').toLowerCase().includes(pName);
  });
  return match?.images?.[0]?.image_path || null;
}

// ── Testimonials — fictional, representative sample content ──
{/*const TESTIMONIALS = [
  {
    name: 'Grace N.', role: 'Buyer · Kampala', rating: 5,
    quote: 'Found a replacement laptop screen in minutes for way less than the repair shop wanted. The seller replied fast and the part worked first try.',
  },
  {
    name: 'Moses K.', role: 'Seller · Ntinda', rating: 5,
    quote: 'Had old motherboards sitting in a drawer for months. Listed them here and had buyers messaging within a day.',
  },
  {
    name: 'Aisha B.', role: 'Buyer · Wandegeya', rating: 4,
    quote: 'The photo search actually works — snapped a picture of a broken power supply and found a close match nearby.',
  },
];*/}

// ── HomePage ──────────────────────────────────────────────────
export default function HomePage() {
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery]             = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [expandedCats, setExpandedCats]     = useState({ c1: true });
  const [imageSearch, setImageSearch]       = useState(null); // { labels: [] }
  const [imageSearchProducts, setImageSearchProducts] = useState([]);
  const [imageError, setImageError]         = useState('');
  const [heroIndex, setHeroIndex]           = useState(0);
  const { token } = useAuth();
  const navigate     = useNavigate();
  const listingsRef  = useRef(null);
  const howRef       = useRef(null);
  const fileInputRef = useRef(null);

  // Categories + featured products are fetched together, matching the
  // original's Promise.all — either one failing falls back to sample data
  // for both, rather than mixing real + sample results.
  const { data: homeData, isLoading: loading } = useQuery({
    queryKey: ['home-featured'],
    queryFn: async () => {
      try {
        const [catRes, prodRes] = await Promise.all([getCategories(), browseProducts({ per_page: 8 })]);
        const cats = catRes.data.categories;
        const prods = prodRes.data.data;
        return {
          categories: cats?.length ? cats : SAMPLE_CATEGORIES,
          products: prods?.length ? prods : SAMPLE_PRODUCTS,
        };
      } catch {
        return { categories: SAMPLE_CATEGORIES, products: SAMPLE_PRODUCTS };
      }
    },
  });

  const categories = homeData?.categories || [];
  const baseProducts = homeData?.products || [];

  // Live counters — independent query so a failure never blocks the listings.
  const { data: stats, isError: statsError } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => getStats().then(res => res.data),
  });

  // Same query key MaintenanceGate uses, so this is a cache hit (no extra
  // network round-trip) once that component has already fetched it — powers
  // the footer's tagline, contact details, and social links.
  const { data: siteSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => getPublicSettings().then(res => res.data),
    staleTime: 30_000,
  });

  const { data: topSellers = [] } = useQuery({
    queryKey: ['top-rated-sellers'],
    queryFn: () => getTopRatedSellers().then(res => res.data.sellers || []),
  });

  // Rotate the hero background photo on a timer — pure crossfade via opacity,
  // no image ever unmounts so there's no flash/reload between transitions.
  useEffect(() => {
    const id = setInterval(() => {
      setHeroIndex(i => (i + 1) % HERO_IMAGES.length);
    }, HERO_ROTATE_MS);
    return () => clearInterval(id);
  }, []);

  const scrollToListings = () =>
    listingsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  // Browsing is open to everyone: guests explore the public listings right
  // here on the homepage; signed-in users go to the full dashboard browser.
  const goBrowse = () => {
    if (token) { navigate('/dashboard/browse'); return; }
    clearFilters();
    scrollToListings();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(searchInput.trim());
    setActiveCategory(null);
    scrollToListings();
  };

  const handleCategoryClick = (cat) => {
    setActiveCategory(prev => (prev === cat.category_id ? null : cat.category_id));
    setQuery('');
    scrollToListings();
  };

  // ── Search by photo (Google Vision) ───────────────────────
  const pickImage = () => { setImageError(''); fileInputRef.current?.click(); };

  const imageSearchMutation = useMutation({
    mutationFn: (file) => searchByImage(file),
    onSuccess: (res) => {
      setImageSearchProducts(res.data.products || []);
      setImageSearch({ labels: res.data.labels || [] });
    },
    onError: (err) => {
      setImageError(
        err.response?.data?.message ||
        (err.response?.status === 503
          ? 'Photo search isn’t enabled on the server yet.'
          : 'Couldn’t search by that photo. Please try again.')
      );
      setImageSearch(null); // reverting imageSearch to null falls back to baseProducts
    },
  });

  const imageBusy = imageSearchMutation.isPending;

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';            // let the user re-pick the same file later
    if (!file) return;
    setImageError('');
    setQuery(''); setSearchInput(''); setActiveCategory(null);
    scrollToListings();
    imageSearchMutation.mutate(file);
  };

  const toggleExpand = (id) => setExpandedCats(p => ({ ...p, [id]: !p[id] }));

  const activeCatName = categories.find(c => c.category_id === activeCategory)?.name;

  const products = imageSearch ? imageSearchProducts : baseProducts;

  // In-place filtering for instant, working interactivity.
  const displayedProducts = useMemo(() => {
    let list = products;
    if (activeCatName) {
      const key = activeCatName.toLowerCase().split(' ')[0]; // e.g. "computer"
      list = list.filter(p =>
        (p.category?.name || '').toLowerCase().includes(key) ||
        (activeCatName.toLowerCase().includes((p.category?.name || '').toLowerCase()))
      );
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.category?.name?.toLowerCase().includes(q) ||
        p.condition?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, activeCatName, query]);

  const filterActive = Boolean(query || activeCategory || imageSearch);
  const clearFilters = () => {
    setQuery(''); setSearchInput(''); setActiveCategory(null);
    setImageError('');
    if (imageSearch) { setImageSearch(null); } // reverts products to baseProducts
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-800 dark:text-gray-100">
      <PublicNavbar
        onHome={scrollToTop}
        onBrowse={goBrowse}
      />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative px-4 pt-16 pb-20 overflow-hidden bg-[#0b2545]">
        {/* Rotating e-waste photo background — crossfades between frontend/public/hero/hero-1..6.webp */}
        <div className="absolute inset-0" aria-hidden="true">
          {HERO_IMAGES.map((src, i) => (
            <div
              key={src}
              className="absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ease-in-out"
              style={{ backgroundImage: `url('${src}')`, opacity: i === heroIndex ? 1 : 0 }}
            />
          ))}
        </div>
        {/* Navy overlay keeps the text readable over the busy photo */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b2545]/92 via-[#0b2545]/88 to-[#0b2545]/96" aria-hidden="true" />
        {/* Extra darkening focused behind the text for legibility */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(2,12,26,0.65),transparent_75%)]" aria-hidden="true" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 text-white [text-shadow:0_2px_14px_rgba(0,0,0,0.75)]">
            Give Old Electronics a Second Life
          </h1>
          <p className="text-blue-50 text-base md:text-lg mb-8 [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
            Buy &amp; sell used components — RAM, screens, motherboards, and more.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" width={18} height={18} />
              <input
                type="text" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search for a part..."
                className="w-full rounded-xl pl-11 pr-12 py-3.5 text-gray-800 dark:text-gray-100 text-sm bg-white dark:bg-slate-900 shadow-sm border border-blue-100 dark:border-blue-900/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {/* Search by photo */}
              <button type="button" onClick={pickImage} disabled={imageBusy}
                title="Search by photo — snap or upload a picture of the part"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition disabled:opacity-50">
                <Camera width={20} height={20} />
              </button>
              <input
                ref={fileInputRef} type="file" accept="image/*" capture="environment"
                onChange={handleImageChange} className="hidden"
              />
            </div>
            <button type="submit"
              className="btn-lift bg-blue-600 text-white hover:bg-blue-700 px-6 py-3.5 rounded-xl font-semibold text-sm shadow-sm flex items-center gap-2">
              <Search width={16} height={16} /> <span className="hidden sm:inline">Search</span>
            </button>
          </form>
          <div className="mt-4 flex justify-center">
                 <span className="inline-flex items-center gap-1.5 bg-blue-900/20 backdrop-blur-sm border border-blue-700/40 text-blue-100 text-xs px-3.5 py-1.5 rounded-full [text-shadow:0_1px_4px_rgba(0,0,0,0.5)]">
  <Camera width={13} height={13} /> Tip: tap the camera to search using a photo of the part
</span>
          </div>

          {/* Carousel dots — click to jump to a photo, active one glows */}
          <div className="mt-6 flex justify-center gap-1.5">
            {HERO_IMAGES.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setHeroIndex(i)}
                aria-label={`Show hero photo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === heroIndex ? 'w-6 bg-white dark:bg-slate-900' : 'w-1.5 bg-white/35 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Mobile category strip ──────────────────────────────
          The left categories sidebar is desktop-only (hidden below lg),
          so phones/tablets would otherwise never see categories at all —
          this horizontal-scroll chip row surfaces them there instead. */}
      <div className="lg:hidden max-w-7xl mx-auto px-4 pt-6">
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
          {categories.map(cat => {
            const Icon = categoryIcon(cat.name);
            const active = activeCategory === cat.category_id;
            const thumb = categoryThumb(cat.name, baseProducts);
            return (
              <button
                key={cat.category_id}
                onClick={() => handleCategoryClick(cat)}
                className={`shrink-0 flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition
                  ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-300 hover:border-blue-300 dark:hover:border-blue-700'}`}
              >
                <span className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-950/40'}`}>
                  {thumb ? (
                    <img src={`http://localhost:8000/storage/${thumb}`} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon width={13} height={13} className={active ? 'text-white' : 'text-blue-500'} />
                  )}
                </span>
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main 3-column content ───────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex gap-6">

        {/* Left — Categories */}
        <aside className="w-60 shrink-0 hidden lg:block">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 sticky top-20">
            <h2 className="font-bold text-gray-700 dark:text-gray-200 text-sm mb-4 flex items-center gap-2">
              <List width={16} height={16} className="text-blue-600 dark:text-blue-400" /> Browse Categories
            </h2>
            <ul className="space-y-1">
              {categories.map(cat => {
                const Icon = categoryIcon(cat.name);
                const active = activeCategory === cat.category_id;
                const thumb = categoryThumb(cat.name, baseProducts);
                return (
                  <li key={cat.category_id}>
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition
                        ${active ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                 : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400'}`}
                      onClick={() => handleCategoryClick(cat)}
                    >
                      <span className="flex items-center gap-2.5">
                        <span className={`w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shrink-0 ${active ? 'bg-white/20' : 'bg-blue-50 dark:bg-blue-950/40'}`}>
                          {thumb ? (
                            <img src={`http://localhost:8000/storage/${thumb}`} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Icon width={16} height={16} className={active ? 'text-white' : 'text-blue-500'} />
                          )}
                        </span>
                        {cat.name}
                      </span>
                      {cat.subcategories?.length > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); toggleExpand(cat.category_id); }}
                          className="shrink-0"
                        >
                          {expandedCats[cat.category_id]
                            ? <ChevronDown width={15} height={15} />
                            : <ChevronRight width={15} height={15} />}
                        </button>
                      )}
                    </div>

                    {expandedCats[cat.category_id] && cat.subcategories?.length > 0 && (
                      <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-100 dark:border-slate-800 pl-3">
                        {cat.subcategories.map(sub => (
                          <li key={sub.subcategory_id}
                            className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer py-1.5 flex items-center gap-2"
                            onClick={() => { setSearchInput(sub.sub_category_name); setQuery(sub.sub_category_name); setActiveCategory(null); scrollToListings(); }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                            {sub.sub_category_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
            <button onClick={goBrowse}
              className="mt-4 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:underline">
              <Plus width={14} height={14} /> View All Categories
            </button>
          </div>
        </aside>

        {/* Center — Listings */}
        <main ref={listingsRef} className="flex-1 min-w-0 scroll-mt-20">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg flex items-center gap-2">
              <Star width={18} height={18} className="text-amber-400" />
              {filterActive ? 'Results' : 'Featured Listings'}
            </h2>
            <button onClick={goBrowse}
              className="text-blue-600 dark:text-blue-400 text-sm hover:underline font-medium flex items-center gap-1">
              View all <ArrowRight width={14} height={14} />
            </button>
          </div>

          {/* Photo-search error */}
          {imageError && (
            <div className="mb-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-300 text-sm px-4 py-3 rounded-xl flex items-center justify-between gap-3">
              <span className="flex items-center gap-2"><Camera width={16} height={16} /> {imageError}</span>
              <button onClick={() => setImageError('')} className="hover:text-amber-900"><X width={15} height={15} /></button>
            </div>
          )}

          {/* Photo-search result banner */}
          {imageSearch && !imageBusy && (
            <div className="mb-4 flex items-center gap-2 text-sm flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-medium">
                <Camera width={15} height={15} /> Matches for your photo
              </span>
              {imageSearch.labels?.slice(0, 4).map(l => (
                <span key={l} className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-2.5 py-0.5 rounded-full text-xs capitalize">{l}</span>
              ))}
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500 hover:text-blue-700 text-xs">
                <X width={13} height={13} /> clear
              </button>
            </div>
          )}

          {/* Text/category filter chip */}
          {!imageSearch && (query || activeCategory) && (
            <div className="mb-4 flex items-center gap-2 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Filtering by</span>
              <span className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full font-medium">
                {activeCatName || `"${query}"`}
                <button onClick={clearFilters} className="hover:text-blue-900 dark:hover:text-blue-300"><X width={13} height={13} /></button>
              </span>
              <span className="text-gray-400 dark:text-gray-500">· {displayedProducts.length} item{displayedProducts.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {loading || imageBusy ? (
            <>
              {imageBusy && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                  <Camera width={16} height={16} className="animate-pulse" /> Analyzing your photo…
                </p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
              </div>
            </>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-gray-50 dark:bg-slate-800/60 mx-auto mb-4 text-gray-300 dark:text-gray-600">
                {imageSearch ? <Camera width={26} height={26} /> : <Search width={26} height={26} />}
              </div>
              <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-1">
                {imageSearch ? 'No listings match your photo' : 'No matching listings'}
              </h3>
              <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
                {imageSearch
                  ? 'We couldn’t find a related part in stock yet. Try another angle or a clearer shot.'
                  : 'Try a different search or category.'}
              </p>
              <button onClick={clearFilters}
                className="btn-lift bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                {imageSearch ? 'Back to featured' : 'Clear filters'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {displayedProducts.map(p => <ProductCard key={p.product_id} product={p} />)}
            </div>
          )}
        </main>

        {/* Right — Trust signals */}
        <aside className="w-56 shrink-0 hidden xl:block">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-5 sticky top-20 space-y-4">
            {[
              { Icon: Shield, color: 'text-blue-600 dark:text-blue-400', title: 'Verified Listings', desc: 'All reviewed for quality' },
              { Icon: Tag,    color: 'text-green-600 dark:text-green-400', title: 'Fair Pricing',     desc: 'Transparent & competitive' },
              { Icon: Recycle,color: 'text-emerald-600 dark:text-emerald-400', title: 'Circular Economy', desc: 'Reduce e-waste together' },
              { Icon: Chat,   color: 'text-sky-600 dark:text-sky-400',  title: 'Direct Contact',    desc: 'Message sellers instantly' },
            ].map(({ Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <Icon width={20} height={20} className={`shrink-0 mt-0.5 ${color}`} />
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-xs">{title}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">{desc}</p>
                </div>
              </div>
            ))}

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4 space-y-3">
              <div className="flex items-center gap-2.5">
                <Users width={20} height={20} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <StatNumber value={stats?.active_users} error={statsError} fallback="1,200+" />
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Active users</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle width={20} height={20} className="text-green-600 dark:text-green-400" />
                <div>
                  <StatNumber value={stats?.listings_this_week} error={statsError} fallback="450+" />
                  <p className="text-gray-400 dark:text-gray-500 text-xs mt-0.5">Listings this week</p>
                </div>
              </div>
            </div>

            {!token && (
              <Link to="/register"
                className="btn-lift block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-xl text-xs font-semibold mt-2">
                Join Free Today
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* ── Mobile trust strip ─────────────────────────────────
          The right trust-signals sidebar only shows on xl+, so give
          phones/tablets a condensed version instead of losing it entirely. */}
      <div className="xl:hidden max-w-7xl mx-auto px-4 -mt-3 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { Icon: Shield,  color: 'text-blue-600 dark:text-blue-400',    label: 'Verified Listings' },
            { Icon: Tag,     color: 'text-green-600 dark:text-green-400',   label: 'Fair Pricing' },
            { Icon: Recycle, color: 'text-emerald-600 dark:text-emerald-400', label: 'Circular Economy' },
            { Icon: Chat,    color: 'text-sky-600 dark:text-sky-400',     label: 'Direct Contact' },
          ].map(({ Icon, color, label }) => (
            <div key={label} className="flex flex-col items-center text-center gap-1.5">
              <Icon width={18} height={18} className={color} />
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium leading-tight">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works ────────────────────────────────────── */}
      <section ref={howRef} className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-14 px-4 mt-4 scroll-mt-16">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">How It Works</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-10">Three simple steps to buy or sell e-waste</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', Icon: Tag,    title: 'List Your Parts', desc: 'Post your e-waste components with photos, condition, and price.' },
              { step: '2', Icon: Search, title: 'Browse & Search', desc: 'Find exactly what you need by category, condition, or location.' },
              { step: '3', Icon: Chat,   title: 'Connect & Trade', desc: 'Message sellers directly and arrange a pickup or delivery.' },
            ].map(({ step, Icon, title, desc }, i) => (
              <Reveal key={step} delay={i * 120} className="text-center">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 mx-auto mb-4">
                  <Icon width={24} height={24} />
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">STEP {step}</div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Top Rated Sellers ───────────────────────────────── */}
      {topSellers.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-14 px-4">
          <div className="max-w-5xl mx-auto">
            <Reveal className="text-center mb-10">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Top Rated Sellers</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">The most trusted sellers on E-Waste Mart, rated by real buyers</p>
            </Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {topSellers.map((seller, i) => (
                <Reveal key={seller.id} delay={i * 100}>
                  <div className="bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 text-center h-full flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg mb-3 shrink-0">
                      {seller.avatar ? (
                        <img src={`http://localhost:8000/storage/${seller.avatar}`} alt={seller.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        seller.name?.charAt(0).toUpperCase()
                      )}
                    </div>
                    <p className="font-bold text-gray-800 dark:text-gray-100 text-sm truncate w-full">{seller.name}</p>
                    {seller.location && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1 mt-0.5">
                        <MapPin width={11} height={11} /> {seller.location}
                      </p>
                    )}
                    <div className="flex gap-0.5 mt-2">
                      {Array(5).fill(0).map((_, j) => (
                        <Star key={j} width={13} height={13} className={j < Math.round(seller.rating_average) ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {Number(seller.rating_average).toFixed(1)} · {seller.rating_count} rating{seller.rating_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ────────────────────────────────────── */}
      {/*<section className="bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">What people are saying</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Real experiences from buyers and sellers on E-Waste Mart</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 120} className="h-full">
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-6 h-full flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {Array(5).fill(0).map((_, j) => (
                      <Star key={j} width={14} height={14} className={j < t.rating ? 'text-amber-400' : 'text-gray-200 dark:text-slate-700'} />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{t.name}</p>
                    <p className="text-gray-400 dark:text-gray-500 text-xs">{t.role}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>*/}

      {/* ── CTA ─────────────────────────────────────────────── */}
      {!token && (
        <section className="bg-gradient-to-r from-[#0b2545] to-blue-600 py-14 px-4 text-center text-white">
          <Reveal>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-blue-100 mb-8 text-sm">
              Join thousands of Ugandans buying and selling e-waste components
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <Link to="/register"
                className="btn-lift bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold text-sm shadow dark:bg-slate-900 dark:text-blue-400">
                Create Free Account
              </Link>
              <Link to="/login"
                className="btn-lift border border-white/70 text-white hover:bg-white/10 hover:border-white px-8 py-3 rounded-xl font-semibold text-sm">
                Sign In
              </Link>
            </div>
          </Reveal>
        </section>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer className="bg-[#0b2545] text-blue-200/70 py-10 px-4 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 mb-3 text-white">
              <Recycle width={20} height={20} className="text-blue-300" />
              <span className="font-bold">{siteSettings?.platform_name || 'E-Waste Mart'}</span>
            </div>
            <p className="text-xs leading-relaxed">
              {siteSettings?.tagline || 'Empowering circular economy in Uganda through responsible e-waste trading.'}
            </p>
            {siteSettings?.contact_address && (
              <p className="text-xs leading-relaxed mt-2 flex items-center gap-1.5">
                <MapPin width={12} height={12} className="shrink-0" /> {siteSettings.contact_address}
              </p>
            )}
            {siteSettings?.support_phone && (
              <p className="text-xs leading-relaxed mt-1">{siteSettings.support_phone}</p>
            )}
            {/* Social links — only rendered for platforms the Super Admin has configured */}
            {(siteSettings?.facebook_url || siteSettings?.twitter_url || siteSettings?.instagram_url) && (
              <div className="flex items-center gap-3 mt-4">
                {siteSettings.facebook_url && (
                  <a href={siteSettings.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="hover:text-white transition">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z"/></svg>
                  </a>
                )}
                {siteSettings.twitter_url && (
                  <a href={siteSettings.twitter_url} target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" className="hover:text-white transition">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23.3 22h-7l-5.5-7.2L4.5 22H1.3l8.1-9.3L1 2h7.2l5 6.6L18.9 2Zm-1.2 18h1.7L7.4 4h-1.8l12.1 16Z"/></svg>
                  </a>
                )}
                {siteSettings.instagram_url && (
                  <a href={siteSettings.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="hover:text-white transition">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 1.2.06 2.4.3 3.2 1.1.8.8 1 2 1.1 3.2.07 1.3.07 1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.3 2.4-1.1 3.2-.8.8-2 1-3.2 1.1-1.3.07-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-2.4-.3-3.2-1.1-.8-.8-1-2-1.1-3.2C2.7 15.6 2.7 15.2 2.7 12s0-3.6.07-4.9c.06-1.2.3-2.4 1.1-3.2.8-.8 2-1 3.2-1.1C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.07-1 .05-1.5.2-1.9.35-.5.2-.8.4-1.2.8-.4.4-.6.7-.8 1.2-.15.4-.3.9-.35 1.9C3 9.5 3 9.9 3 13c0 3.1 0 3.5.07 4.7.05 1 .2 1.5.35 1.9.2.5.4.8.8 1.2.4.4.7.6 1.2.8.4.15.9.3 1.9.35 1.2.07 1.6.07 4.7.07s3.5 0 4.7-.07c1-.05 1.5-.2 1.9-.35.5-.2.8-.4 1.2-.8.4-.4.6-.7.8-1.2.15-.4.3-.9.35-1.9.07-1.2.07-1.6.07-4.7s0-3.5-.07-4.7c-.05-1-.2-1.5-.35-1.9-.2-.5-.4-.8-.8-1.2-.4-.4-.7-.6-1.2-.8-.4-.15-.9-.3-1.9-.35C15.5 4 15.1 4 12 4Zm0 3.4a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Zm0 1.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Zm4.8-2a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0Z"/></svg>
                  </a>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-12">
            <div>
              <p className="font-semibold text-white mb-3 text-xs">Platform</p>
              <ul className="space-y-2 text-xs">
                <li><button onClick={goBrowse} className="hover:text-white transition">Browse</button></li>
                <li><Link to="/login" className="hover:text-white transition">Login</Link></li>
                {siteSettings?.allow_public_registration !== false && (
                  <li><Link to="/register" className="hover:text-white transition">Register</Link></li>
                )}
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
          © 2026 {siteSettings?.platform_name || 'E-Waste Mart'} — {siteSettings?.tagline || 'Empowering circular economy in Uganda'}
        </div>
      </footer>

      <BackToTopButton />
    </div>
  );
}