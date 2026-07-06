import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getStats } from '../api/products';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';
import BackToTopButton from '../components/BackToTopButton';
import Reveal from '../components/Reveal';
import StatNumber from '../components/StatNumber';
import {
  Recycle, Shield, Tag, Chat, Users, CheckCircle, Search,
  Target, ArrowRight,
} from '../components/icons';

const VALUES = [
  { Icon: Shield,   color: 'text-blue-600',    title: 'Trust & Verification',  desc: 'Every listing is reviewed by our team before it goes live, so buyers know what they\'re getting.' },
  { Icon: Tag,      color: 'text-green-600',   title: 'Fair, Transparent Pricing', desc: 'Sellers set their own prices — no hidden fees, no middlemen taking a cut.' },
  { Icon: Recycle,  color: 'text-emerald-600', title: 'Circular Economy',      desc: 'Every part reused is one less item in a landfill and one less new part manufactured.' },
  { Icon: Chat,     color: 'text-sky-600',     title: 'Direct Connection',     desc: 'Buyers and sellers message each other directly — no waiting on a call center.' },
];

const STEPS = [
  { step: '1', Icon: Tag,    title: 'List Your Parts', desc: 'Post your e-waste components with photos, condition, and price.' },
  { step: '2', Icon: Search, title: 'Browse & Search', desc: 'Find exactly what you need by category, condition, or location.' },
  { step: '3', Icon: Chat,   title: 'Connect & Trade', desc: 'Message sellers directly and arrange a pickup or delivery.' },
];

export default function AboutPage() {
  const { data: stats, isError: statsError } = useQuery({
    queryKey: ['home-stats'],
    queryFn: () => getStats().then(res => res.data),
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <PublicNavbar />

      {/* ── Header ──────────────────────────────────────────── */}
      <section className="relative px-4 py-20 text-center overflow-hidden bg-[#0b2545]">
        <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: "url('/hero-3.webp')" }} aria-hidden="true" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b2545]/80 via-[#0b2545]/90 to-[#0b2545]" aria-hidden="true" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-4 [text-shadow:0_2px_14px_rgba(0,0,0,0.6)]">
            About E-Waste Mart
          </h1>
          <p className="text-blue-100 text-base md:text-lg [text-shadow:0_1px_8px_rgba(0,0,0,0.6)]">
            A Ugandan marketplace built to give old electronics — and the parts inside them — a second life.
          </p>
        </div>
      </section>

      {/* ── Mission ─────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <Reveal className="max-w-3xl mx-auto text-center">
          <div className="grid place-items-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-5">
            <Target width={26} height={26} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
          <p className="text-gray-600 leading-relaxed">
            Every year, mountains of usable electronic components — RAM sticks, motherboards, screens,
            power supplies — end up discarded simply because their owners don't know anyone who needs them.
            Meanwhile, students, technicians, and small repair shops across Uganda struggle to find affordable
            parts. E-Waste Mart exists to close that gap: a simple, trustworthy place where anyone can list
            what they no longer need and anyone can find what they're looking for, at a fair price, without
            adding another device to a landfill.
          </p>
        </Reveal>
      </section>

      {/* ── What we do / How it works ──────────────────────── */}
      <section className="py-16 px-4 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">How It Works</h2>
            <p className="text-gray-500 text-sm">Three simple steps to buy or sell e-waste</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map(({ step, Icon, title, desc }, i) => (
              <Reveal key={step} delay={i * 120} className="text-center">
                <div className="grid place-items-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto mb-4">
                  <Icon width={24} height={24} />
                </div>
                <div className="text-xs font-bold text-blue-600 mb-1">STEP {step}</div>
                <h3 className="font-bold text-gray-800 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Values ──────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <Reveal className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">What We Stand For</h2>
            <p className="text-gray-500 text-sm">The principles behind every listing on the platform</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VALUES.map(({ Icon, color, title, desc }, i) => (
              <Reveal key={title} delay={i * 100}>
                <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 h-full flex gap-4">
                  <div className={`shrink-0 w-11 h-11 rounded-xl bg-white shadow-sm flex items-center justify-center ${color}`}>
                    <Icon width={20} height={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-1.5">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Live stats ──────────────────────────────────────── */}
      <section className="py-14 px-4 bg-[#0b2545]">
        <Reveal className="max-w-3xl mx-auto grid grid-cols-2 gap-8 text-center">
          <div>
            <StatNumber value={stats?.active_users} error={statsError} fallback="1,200+" className="text-3xl font-extrabold text-white" />
            <p className="text-blue-200 text-sm mt-2 flex items-center justify-center gap-1.5">
              <Users width={14} height={14} /> Active users
            </p>
          </div>
          <div>
            <StatNumber value={stats?.listings_this_week} error={statsError} fallback="450+" className="text-3xl font-extrabold text-white" />
            <p className="text-blue-200 text-sm mt-2 flex items-center justify-center gap-1.5">
              <CheckCircle width={14} height={14} /> Listings this week
            </p>
          </div>
        </Reveal>
      </section>

      {/* ── CTA ─────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#0b2545] to-blue-600 py-14 px-4 text-center text-white">
        <Reveal>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to give your old parts a second life?</h2>
          <p className="text-blue-100 mb-8 text-sm">Join buyers and sellers across Uganda today.</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/register"
              className="btn-lift bg-white text-blue-700 hover:bg-blue-50 px-8 py-3 rounded-xl font-semibold text-sm shadow">
              Create Free Account
            </Link>
            <Link to="/contact"
              className="btn-lift border border-white/70 text-white hover:bg-white/10 hover:border-white px-8 py-3 rounded-xl font-semibold text-sm flex items-center gap-2">
              Get in Touch <ArrowRight width={14} height={14} />
            </Link>
          </div>
        </Reveal>
      </section>

      <PublicFooter />
      <BackToTopButton />
    </div>
  );
}
