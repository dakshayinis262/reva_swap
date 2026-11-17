import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Dumbbell,
  FlaskConical,
  Lamp,
  Mail,
  MapPin,
  Package,
  PencilRuler,
  ShieldCheck,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { ItemCard } from '../components/ItemCard';
import { SafeImage } from '../components/SafeImage';
import { ITEM_CATEGORIES } from '../constants';
import type { ItemCategory, ItemListing, PlatformStats } from '../types';

interface LandingPageProps {
  onExplore: (category?: ItemCategory) => void;
  onJoin: () => void;
  onSelectItem: (itemId: string) => void;
}

const CATEGORY_ICONS: Record<ItemCategory, React.ReactNode> = {
  'Books & Notes': <BookOpen className="w-5 h-5" />,
  Electronics: <Cpu className="w-5 h-5" />,
  'Lab Equipment': <FlaskConical className="w-5 h-5" />,
  'Sports Equipment': <Dumbbell className="w-5 h-5" />,
  Stationery: <PencilRuler className="w-5 h-5" />,
  'Hostel Essentials': <Lamp className="w-5 h-5" />,
  'Other Items': <Package className="w-5 h-5" />,
};

const CATEGORY_DESCRIPTIONS: Record<ItemCategory, string> = {
  'Books & Notes': 'Semester textbooks, reference guides, and exam notes',
  Electronics: 'Calculators, USB-C hubs, headphones, and accessories',
  'Lab Equipment': 'Lab coats, multimeters, Arduino kits, and boards',
  'Sports Equipment': 'Badminton rackets, footballs, gym gear, and mats',
  Stationery: 'Drafting sets, scale rulers, sketchpads, and pens',
  'Hostel Essentials': 'Study lamps, kettles, organizers, and dorm gear',
  'Other Items': 'Event props, cycle locks, bags, and campus utilities',
};

const FAQS = [
  {
    q: 'Who can join and exchange items on REVA SWAP?',
    a: 'REVA SWAP is built exclusively for verified university students using an official campus email address (such as @reva.edu.in) and a valid Student ID.',
  },
  {
    q: 'How are borrowed items tracked and returned safely?',
    a: 'Every borrow or lend exchange creates a structured borrowing record with start date, expected return date, and pre-handover / post-return condition logs with photo evidence.',
  },
  {
    q: 'What happens if an item is returned late or damaged?',
    a: 'Either student can file a Damage or Dispute Report with photographs. Campus administrators review the evidence neutrally and record a fair resolution without automatic penalties.',
  },
  {
    q: 'Are there any platform fees for student exchanges?',
    a: 'No. REVA SWAP charges zero commission on borrowing, lending, swapping, buying, selling, or free sharing between campus peers.',
  },
];

export function LandingPage({
  onExplore,
  onJoin,
  onSelectItem,
}: LandingPageProps) {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [featuredItems, setFeaturedItems] = useState<ItemListing[]>([]);
  const [legalModal, setLegalModal] = useState<'faq' | 'privacy' | 'terms' | null>(null);

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => null);
    api
      .getItems()
      .then((res) => setFeaturedItems(res.items.slice(0, 3)))
      .catch(() => null);
  }, []);

  const demo = stats?.demoStats || {
    itemsShared: 1428,
    activeStudents: 865,
    successfulExchanges: 944,
    moneySavedInr: 485000,
  };

  return (
    <div className="bg-[#F8FAFC] text-slate-900">
      {/* HERO SECTION */}
      <section className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-[#6D5CE7] mb-3">
                Verified Campus Resource Exchange
              </p>
              <h1
                className="font-display font-bold tracking-tight text-[#172554] leading-[1.1] mb-5"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.5rem)',
                  textWrap: 'balance',
                }}
              >
                Your Campus. Your Community. Your Swap.
              </h1>
              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl mb-8">
                Borrow, lend, buy, sell, and swap everyday essentials with fellow
                students. Save money, reduce waste, and make campus life easier.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  onClick={() => onExplore()}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5CE7]"
                >
                  <span>Explore Items</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onJoin}
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[#172554] bg-white border border-slate-300 hover:border-[#172554] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5CE7]"
                >
                  <span>Join the Community</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="relative h-full min-h-[280px] sm:min-h-[360px] rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                <SafeImage
                  src="/src/assets/images/hero_campus_exchange_1794921133317.jpg"
                  alt="Students exchanging textbooks, a laptop, and a lab kit on the campus quad"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* STATISTICS STRIP */}
          <div className="mt-12 pt-10 border-t border-slate-200/80">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <h2 className="font-display text-sm font-semibold text-slate-900">
                Campus Impact Overview
              </h2>
              <p className="text-xs text-slate-500">
                Demonstration statistics shown until full campus rollout telemetry is connected.
              </p>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Items Shared (Demo)
                </p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tabular-nums">
                  {demo.itemsShared.toLocaleString('en-IN')}+
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Active Students (Demo)
                </p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tabular-nums">
                  {demo.activeStudents.toLocaleString('en-IN')}+
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Successful Exchanges (Demo)
                </p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#14B8A6] tabular-nums">
                  {demo.successfulExchanges.toLocaleString('en-IN')}
                </p>
              </div>
              <div className="p-5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  Money Saved (Demo)
                </p>
                <p className="font-display text-2xl sm:text-3xl font-bold text-[#6D5CE7] tabular-nums">
                  ₹{demo.moneySavedInr.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR CATEGORIES */}
      <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tracking-tight">
              Popular Categories
            </h2>
            <p className="text-slate-600 mt-1.5">
              Browse resources shared by students across every department.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onExplore()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D5CE7] hover:text-[#172554] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span>Browse all listings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ITEM_CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => onExplore(category)}
              className="group text-left bg-white p-5 rounded-xl border border-slate-200/90 hover:border-[#6D5CE7]/60 hover:shadow-sm transition-all cursor-pointer flex flex-col justify-between gap-4"
            >
              <div className="w-10 h-10 rounded-lg bg-[#172554]/5 text-[#172554] group-hover:bg-[#172554] group-hover:text-white flex items-center justify-center transition-colors">
                {CATEGORY_ICONS[category]}
              </div>
              <div>
                <h3 className="font-display text-base font-semibold text-slate-900 mb-1">
                  {category}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {CATEGORY_DESCRIPTIONS[category]}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED CAMPUS LISTINGS */}
      {featuredItems.length > 0 && (
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tracking-tight">
                Recently Listed on Campus
              </h2>
              <p className="text-slate-600 mt-1.5">
                Live student listings ready for borrowing, swapping, or pickup.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onExplore()}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#172554] hover:text-[#6D5CE7] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open marketplace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
            ))}
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-white border-y border-slate-200/80 py-16"
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tracking-tight">
              How It Works
            </h2>
            <p className="text-slate-600 mt-2">
              A transparent, student-verified exchange workflow built around campus trust.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01.',
                title: 'Create Your Account',
                desc: 'Register with your university email and Student ID to unlock verified campus access.',
              },
              {
                step: '02.',
                title: 'List or Discover Items',
                desc: 'Publish books, lab kits, or hostel gear—or filter listings by category and exchange mode.',
              },
              {
                step: '03.',
                title: 'Send an Exchange Request',
                desc: 'Propose borrowing dates, a swap offer, or purchase terms directly to the owner.',
              },
              {
                step: '04.',
                title: 'Connect and Complete the Exchange',
                desc: 'Meet at a campus pickup point, record item condition, and confirm safe return.',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="pt-5 border-t border-slate-200 flex flex-col gap-2"
              >
                <span className="font-mono text-sm font-semibold text-[#14B8A6]">
                  {item.step}
                </span>
                <h3 className="font-display text-lg font-semibold text-[#172554]">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY REVA SWAP */}
      <section
        id="why-reva-swap"
        className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-16"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tracking-tight mb-4">
              Why REVA SWAP?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Every semester, students buy single-use textbooks, lab tools, and dorm
              supplies that end up unused in hostel rooms. REVA SWAP keeps
              essential academic and everyday gear circulating inside a trusted
              university community.
            </p>
            <button
              type="button"
              onClick={onJoin}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#6D5CE7] hover:bg-[#5b4ad1] rounded-lg transition-colors cursor-pointer"
            >
              <span>Create Student Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              {
                title: 'Affordable access to resources',
                desc: 'Borrow or buy pre-owned textbooks, calculators, and lab kits at student-friendly prices—or zero cost.',
              },
              {
                title: 'Student-focused community',
                desc: 'Campus-only email verification and student IDs ensure you always exchange with verified peers.',
              },
              {
                title: 'Simple exchange process',
                desc: 'Clear request approvals, structured handover condition logs, and direct campus pickup coordination.',
              },
              {
                title: 'Sustainable and reusable campus culture',
                desc: 'Extend the lifecycle of electronics, stationery, and hostel items across graduating batches.',
              },
            ].map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white p-6 rounded-xl border border-slate-200/90"
              >
                <div className="flex items-center gap-2 text-[#14B8A6] mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-xs font-semibold">Campus Pillar</span>
                </div>
                <h3 className="font-display text-base font-semibold text-[#172554] mb-1.5">
                  {benefit.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#172554] text-slate-300 border-t border-slate-800">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/10">
            <div className="md:col-span-2">
              <p className="font-display text-xl font-bold text-white mb-3">
                REVA SWAP
              </p>
              <p className="text-sm text-slate-300 max-w-md leading-relaxed mb-4">
                Student campus resource-sharing and exchange platform designed to
                save money, foster trust, and build a reusable university culture.
              </p>
              <div className="flex flex-col gap-1.5 text-xs text-slate-300">
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#14B8A6]" />
                  campus-support@revaswap.edu.in
                </span>
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                  Student Innovation Center, REVA Campus
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => onExplore()}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Explore Items
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={onJoin}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Student Registration
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('faq')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    FAQs
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white mb-3">
                Trust & Community
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('privacy')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setLegalModal('terms')}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    Terms of Use
                  </button>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    Campus Guidelines
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <p>© {new Date().getFullYear()} REVA SWAP. Built for verified campus sharing.</p>
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setLegalModal('faq')}
                className="hover:text-white cursor-pointer"
              >
                Help Center
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('privacy')}
                className="hover:text-white cursor-pointer"
              >
                Privacy
              </button>
              <button
                type="button"
                onClick={() => setLegalModal('terms')}
                className="hover:text-white cursor-pointer"
              >
                Terms
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* FAQs / Privacy / Terms Modal */}
      {legalModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
              <h3 className="font-display text-lg font-bold text-[#172554]">
                {legalModal === 'faq' && 'Frequently Asked Questions'}
                {legalModal === 'privacy' && 'Campus Privacy Policy'}
                {legalModal === 'terms' && 'Community Terms of Use'}
              </h3>
              <button
                type="button"
                onClick={() => setLegalModal(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {legalModal === 'faq' && (
              <div className="space-y-4">
                {FAQS.map((item) => (
                  <div key={item.q} className="pb-3 border-b border-slate-100 last:border-0">
                    <h4 className="font-semibold text-sm text-[#172554] mb-1">
                      {item.q}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
                  </div>
                ))}
              </div>
            )}

            {legalModal === 'privacy' && (
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  REVA SWAP collects only the university identity fields required
                  to verify student membership: Full Name, University Email,
                  Student ID, Department, and Year of Study.
                </p>
                <p>
                  Your campus email is never displayed publicly to unauthenticated
                  visitors. Messages and exchange condition evidence are visible
                  only to the participating students and authorized campus
                  administrators during dispute reviews.
                </p>
              </div>
            )}

            {legalModal === 'terms' && (
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
                <p>
                  Students must list only lawful academic, hostel, sports, or
                  personal items in accurate condition. All exchanges happen at
                  designated campus pickup zones.
                </p>
                <p>
                  In the event of late returns or item damage, students should
                  submit a Dispute Report with supporting evidence. Administrators
                  review disputes neutrally without automatic financial charges.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
