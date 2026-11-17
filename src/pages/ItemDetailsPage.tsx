import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import { formatPrice, formatShortDate } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { ExchangeType, ItemListing } from '../types';

interface ItemDetailsPageProps {
  itemId: string;
  onBack: () => void;
  onRequireLogin: () => void;
  onOpenMessages: (recipientId: string, itemId: string) => void;
  onRequestCreated: () => void;
}

function getActionLabel(exchangeType: ExchangeType): string {
  switch (exchangeType) {
    case 'Borrow':
    case 'Lend':
      return 'Request to Borrow';
    case 'Buy':
    case 'Sell':
      return 'Request to Buy';
    case 'Swap':
      return 'Request to Swap';
    case 'Free Sharing':
      return 'Request Free Item';
    default:
      return 'Send Exchange Request';
  }
}

export function ItemDetailsPage({
  itemId,
  onBack,
  onRequireLogin,
  onOpenMessages,
  onRequestCreated,
}: ItemDetailsPageProps) {
  const { user, notify } = useAuth();
  const [item, setItem] = useState<ItemListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [proposedDuration, setProposedDuration] = useState('');
  const [swapOffer, setSwapOffer] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactBody, setContactBody] = useState('');

  useEffect(() => {
    setLoading(true);
    setSelectedImageIdx(0);
    api
      .getItem(itemId)
      .then((res) => {
        setItem(res.item);
        setProposedDuration(res.item.borrowingDuration || '7 Days');
      })
      .catch(() => setItem(null))
      .finally(() => setLoading(false));
  }, [itemId]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="h-8 w-32 bg-slate-200 rounded mb-6 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 aspect-[4/3] bg-slate-200 rounded-2xl animate-pulse" />
          <div className="lg:col-span-5 h-80 bg-slate-200 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-[900px] mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-2xl font-bold text-[#172554] mb-2">
          Listing Not Found
        </h2>
        <p className="text-sm text-slate-600 mb-6">
          This listing may have been removed or completed.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] rounded-lg cursor-pointer"
        >
          Back to Explore
        </button>
      </div>
    );
  }

  const isOwnListing = user?.id === item.ownerId;
  const canRequest = item.availability === 'Available' && !isOwnListing;
  const images =
    item.images.length > 0
      ? item.images
      : ['/src/assets/images/item_textbooks_bundle_1794921132809.jpg'];

  const handleOpenRequest = () => {
    if (!user) {
      notify('Please sign in with your campus account to send a request.', 'info');
      onRequireLogin();
      return;
    }
    setShowRequestModal(true);
  };

  const handleOpenContact = () => {
    if (!user) {
      notify('Please sign in to message the listing owner.', 'info');
      onRequireLogin();
      return;
    }
    setShowContactModal(true);
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createRequest({
        itemId: item.id,
        proposedDuration:
          item.exchangeType === 'Borrow' || item.exchangeType === 'Lend'
            ? proposedDuration
            : '',
        swapOffer: item.exchangeType === 'Swap' ? swapOffer : '',
        message: requestMessage,
      });
      setShowRequestModal(false);
      notify('Exchange request sent to the owner!', 'success');
      onRequestCreated();
    } catch (err: unknown) {
      notify(
        err instanceof Error ? err.message : 'Could not submit request.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendDirectMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactBody.trim()) return;
    setSubmitting(true);
    try {
      await api.sendMessage({
        recipientId: item.ownerId,
        itemId: item.id,
        body: contactBody.trim(),
      });
      setShowContactModal(false);
      setContactBody('');
      notify('Message sent!', 'success');
      onOpenMessages(item.ownerId, item.id);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to send message.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#172554] mb-6 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Items</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Product Image Gallery */}
        <div className="lg:col-span-7 space-y-3">
          <div className="aspect-[4/3] w-full rounded-2xl overflow-hidden bg-white border border-slate-200">
            <SafeImage
              src={images[selectedImageIdx]}
              alt={item.title}
              fallbackLabel={item.title}
              className="w-full h-full object-cover"
            />
          </div>

          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-1">
              {images.map((img, idx) => (
                <button
                  key={`${img}_${idx}`}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  className={`w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 shrink-0 cursor-pointer transition-all ${
                    idx === selectedImageIdx
                      ? 'border-[#172554]'
                      : 'border-slate-200 opacity-75 hover:opacity-100'
                  }`}
                >
                  <SafeImage
                    src={img}
                    alt={`${item.title} view ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Description Block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mt-4">
            <h2 className="font-display text-base font-semibold text-[#172554] mb-2">
              Item Description & Details
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>
        </div>

        {/* Right: Contiguous Exchange & Owner Module */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
              <span>
                {item.category} <span aria-hidden="true">·</span> {item.condition}
              </span>
              <StatusIndicator status={item.availability} />
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold text-[#172554] leading-snug mb-2">
                {item.title}
              </h1>
              <div className="flex items-baseline gap-3">
                <span className="font-display text-xl font-bold text-[#6D5CE7] tabular-nums">
                  {formatPrice(item.price, item.exchangeType)}
                </span>
                <span className="text-xs text-slate-500">
                  Exchange Mode: <strong className="text-slate-700">{item.exchangeType}</strong>
                </span>
              </div>
            </div>

            <div className="py-4 border-y border-slate-100 space-y-3 text-sm">
              <div className="flex items-start gap-2.5 text-slate-700">
                <MapPin className="w-4 h-4 text-[#14B8A6] shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-500">Pickup Location</span>
                  <span className="font-medium text-slate-900">
                    {item.pickupLocation}
                  </span>
                </div>
              </div>

              {(item.exchangeType === 'Borrow' || item.exchangeType === 'Lend') && (
                <div className="flex items-start gap-2.5 text-slate-700">
                  <CalendarClock className="w-4 h-4 text-[#6D5CE7] shrink-0 mt-0.5" />
                  <div>
                    <span className="block text-xs text-slate-500">
                      Borrowing Terms
                    </span>
                    <span className="font-medium text-slate-900">
                      {item.borrowingDuration || 'Up to 7 Days (Flexible with owner)'}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-xs text-slate-500">Listed On</span>
                  <span className="font-medium text-slate-900 tabular-nums">
                    {formatShortDate(item.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons strictly matching exchange type */}
            <div className="space-y-2.5">
              {isOwnListing ? (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center">
                  This is your active campus listing. Manage it from My Listings.
                </div>
              ) : (
                <>
                  {canRequest ? (
                    <button
                      type="button"
                      onClick={handleOpenRequest}
                      className="w-full py-3 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
                    >
                      {getActionLabel(item.exchangeType)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 text-sm font-semibold text-slate-400 bg-slate-100 rounded-lg cursor-not-allowed"
                    >
                      Currently {item.availability}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleOpenContact}
                    className="w-full py-2.5 px-4 inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#172554] bg-white border border-slate-300 hover:border-[#172554] rounded-lg transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Contact Owner</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Owner Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h3 className="font-display text-sm font-semibold text-slate-900 mb-4">
              Listed By Student
            </h3>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-[#172554]/10 text-[#172554] flex items-center justify-center font-display font-bold text-sm overflow-hidden shrink-0">
                {item.ownerAvatar ? (
                  <img
                    src={item.ownerAvatar}
                    alt={item.ownerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  (item.ownerName || 'CS').slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-sm text-slate-900 truncate">
                    {item.ownerName}
                  </p>
                  {item.ownerVerified && (
                    <ShieldCheck
                      className="w-4 h-4 text-[#14B8A6] shrink-0"
                      aria-label="Verified campus student"
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">
                  {item.ownerDepartment} <span aria-hidden="true">·</span>{' '}
                  {item.ownerYear}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#14B8A6]" />
                Campus ID Verified
              </span>
              <span className="tabular-nums">
                <strong className="text-slate-900">
                  {item.ownerCompletedExchanges ?? 0}
                </strong>{' '}
                completed exchanges
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exchange Request Modal */}
      {showRequestModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-display text-lg font-bold text-[#172554]">
                {getActionLabel(item.exchangeType)}
              </h3>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendRequest} className="space-y-4">
              <p className="text-xs text-slate-500">
                Item: <strong className="text-slate-800">{item.title}</strong>
              </p>

              {(item.exchangeType === 'Borrow' || item.exchangeType === 'Lend') && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Proposed Borrowing Duration
                  </label>
                  <input
                    type="text"
                    required
                    value={proposedDuration}
                    onChange={(e) => setProposedDuration(e.target.value)}
                    placeholder="e.g., 5 Days, 2 Weeks"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>
              )}

              {item.exchangeType === 'Swap' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Item Offered for Swap
                  </label>
                  <input
                    type="text"
                    required
                    value={swapOffer}
                    onChange={(e) => setSwapOffer(e.target.value)}
                    placeholder="Describe the item you are offering in exchange..."
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Message to Owner
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestMessage}
                  onChange={(e) => setRequestMessage(e.target.value)}
                  placeholder="Share when you can meet at the pickup location or any questions..."
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg cursor-pointer"
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Contact Modal */}
      {showContactModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-display text-lg font-bold text-[#172554]">
                Message {item.ownerName}
              </h3>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSendDirectMessage} className="space-y-4">
              <textarea
                rows={4}
                required
                value={contactBody}
                onChange={(e) => setContactBody(e.target.value)}
                placeholder={`Ask ${item.ownerName} about "${item.title}"...`}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              />
              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowContactModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg cursor-pointer"
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
