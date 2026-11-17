import React from 'react';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { formatPrice } from '../constants';
import type { ItemListing } from '../types';
import { SafeImage } from './SafeImage';
import { StatusIndicator } from './StatusBadge';

interface ItemCardProps {
  item: ItemListing;
  onSelect: (itemId: string) => void;
}

export function ItemCard({ item, onSelect }: ItemCardProps) {
  const showPrice =
    item.exchangeType === 'Buy' ||
    item.exchangeType === 'Sell' ||
    item.exchangeType === 'Free Sharing';

  return (
    <article className="group bg-white rounded-xl border border-slate-200/90 overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      {/* 4:3 Product Image Container */}
      <button
        type="button"
        onClick={() => onSelect(item.id)}
        className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6D5CE7]"
      >
        <SafeImage
          src={item.images[0]}
          alt={item.title}
          fallbackLabel={item.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </button>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          {/* Unboxed clean metadata row */}
          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 mb-1.5">
            <span className="truncate">
              {item.category} <span aria-hidden="true">·</span> {item.condition}
            </span>
            <span className="font-medium text-[#6D5CE7] whitespace-nowrap shrink-0">
              {item.exchangeType}
            </span>
          </div>

          <h3 className="font-display text-base font-semibold text-slate-900 leading-snug line-clamp-2 mb-2">
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="text-left hover:text-[#172554] transition-colors cursor-pointer"
            >
              {item.title}
            </button>
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.pickupLocation}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-600 truncate">
              By <span className="font-medium text-slate-800">{item.ownerName}</span>
            </span>
            <StatusIndicator status={item.availability} />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-sm font-semibold text-[#172554] tabular-nums">
              {showPrice
                ? formatPrice(item.price, item.exchangeType)
                : item.borrowingDuration || item.exchangeType}
            </span>
            <button
              type="button"
              onClick={() => onSelect(item.id)}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-[#172554] bg-slate-100 hover:bg-[#172554] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>View Details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
