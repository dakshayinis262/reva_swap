import React, { useEffect, useState } from 'react';
import { Filter, Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../api/client';
import { ItemCard } from '../components/ItemCard';
import {
  EXCHANGE_TYPES,
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
} from '../constants';
import type { ItemListing } from '../types';

interface ExplorePageProps {
  initialCategory?: string;
  initialQuery?: string;
  onSelectItem: (itemId: string) => void;
  embedded?: boolean;
}

export function ExplorePage({
  initialCategory = 'All',
  initialQuery = '',
  onSelectItem,
  embedded = false,
}: ExplorePageProps) {
  const [items, setItems] = useState<ItemListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [exchangeType, setExchangeType] = useState('All');
  const [condition, setCondition] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  useEffect(() => {
    setCategory(initialCategory || 'All');
  }, [initialCategory]);

  useEffect(() => {
    setQuery(initialQuery || '');
  }, [initialQuery]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (category !== 'All') params.category = category;
    if (exchangeType !== 'All') params.exchangeType = exchangeType;
    if (condition !== 'All') params.condition = condition;
    if (availability !== 'All') params.availability = availability;
    if (minPrice.trim()) params.minPrice = minPrice.trim();
    if (maxPrice.trim()) params.maxPrice = maxPrice.trim();

    api
      .getItems(params)
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch(() => {
        if (active) setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, category, exchangeType, condition, availability, minPrice, maxPrice]);

  const resetFilters = () => {
    setQuery('');
    setCategory('All');
    setExchangeType('All');
    setCondition('All');
    setAvailability('All');
    setMinPrice('');
    setMaxPrice('');
  };

  const hasActiveFilters =
    query !== '' ||
    category !== 'All' ||
    exchangeType !== 'All' ||
    condition !== 'All' ||
    availability !== 'All' ||
    minPrice !== '' ||
    maxPrice !== '';

  const filterPanel = (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-[#172554]">
          <Filter className="w-4 h-4" />
          Filters
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-medium text-[#6D5CE7] hover:underline cursor-pointer"
          >
            Reset all
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Category
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
        >
          <option value="All">All Categories</option>
          {ITEM_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Exchange Type
        </label>
        <select
          value={exchangeType}
          onChange={(e) => setExchangeType(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
        >
          <option value="All">All Exchange Types</option>
          {EXCHANGE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Item Condition
        </label>
        <select
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
        >
          <option value="All">Any Condition</option>
          {ITEM_CONDITIONS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Availability
        </label>
        <select
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Reserved">Reserved</option>
          <option value="Borrowed">Borrowed</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Price Range (₹)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7] tabular-nums"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7] tabular-nums"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={embedded ? '' : 'max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172554] tracking-tight">
            Explore Campus Items
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Discover books, electronics, lab equipment, and everyday essentials shared by fellow students.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items, descriptions, categories..."
              aria-label="Search campus items"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-white rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFiltersMobile((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-[#172554] bg-white border border-slate-300 rounded-lg cursor-pointer shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFiltersMobile && (
        <div className="lg:hidden mb-6 relative">
          <button
            type="button"
            onClick={() => setShowFiltersMobile(false)}
            aria-label="Close filters"
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
          {filterPanel}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <aside className="hidden lg:block lg:col-span-3 sticky top-20">
          {filterPanel}
        </aside>

        <div className="lg:col-span-9">
          <div className="flex items-center justify-between mb-4 text-xs text-slate-500">
            <span className="tabular-nums">
              Showing <strong className="text-slate-900">{items.length}</strong>{' '}
              {items.length === 1 ? 'listing' : 'listings'}
            </span>
            {category !== 'All' && (
              <span>
                Filtered by <strong className="text-[#172554]">{category}</strong>
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse"
                >
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                    <div className="h-5 bg-slate-200 rounded w-5/6" />
                    <div className="h-3 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <p className="font-display text-lg font-semibold text-[#172554] mb-1">
                No matching campus items found
              </p>
              <p className="text-sm text-slate-500 mb-5">
                Try adjusting your search keywords or resetting the active filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] rounded-lg hover:bg-[#1e3270] cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} onSelect={onSelectItem} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
