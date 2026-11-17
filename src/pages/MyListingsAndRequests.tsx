import React, { useEffect, useState } from 'react';
import { Check, Edit3, Plus, Trash2, X } from 'lucide-react';
import { api } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import { formatPrice, formatShortDate } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { ExchangeRequest, ItemListing, RequestStatus } from '../types';

export function MyListingsView({
  onAddNew,
  onEdit,
  onViewItem,
}: {
  onAddNew: () => void;
  onEdit: (item: ItemListing) => void;
  onViewItem: (itemId: string) => void;
}) {
  const { user, notify } = useAuth();
  const [items, setItems] = useState<ItemListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getItems({ ownerId: user.id });
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user?.id]);

  const handleDelete = async (item: ItemListing) => {
    try {
      await api.deleteItem(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      notify(`Deleted "${item.title}".`, 'info');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Delete failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#172554]">
            My Listings
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage items you have listed for borrowing, swapping, sale, or free sharing.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Listing</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="font-display text-base font-semibold text-[#172554] mb-1">
            You haven&apos;t listed any campus items yet
          </p>
          <p className="text-sm text-slate-500 mb-5">
            Publish unused textbooks, lab gear, or electronics to start sharing with peers.
          </p>
          <button
            type="button"
            onClick={onAddNew}
            className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] rounded-lg cursor-pointer"
          >
            Publish First Listing
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <button
                  type="button"
                  onClick={() => onViewItem(item.id)}
                  className="w-20 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                >
                  <SafeImage
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-medium text-[#6D5CE7]">
                      {item.exchangeType}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">
                      {formatPrice(item.price, item.exchangeType)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onViewItem(item.id)}
                    className="font-display text-base font-semibold text-slate-900 hover:text-[#172554] truncate block text-left cursor-pointer"
                  >
                    {item.title}
                  </button>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <StatusIndicator status={item.availability} />
                    <span>Pickup: {item.pickupLocation}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function MyRequestsView({
  onViewItem,
  onOpenBorrowings,
}: {
  onViewItem: (itemId: string) => void;
  onOpenBorrowings: () => void;
}) {
  const { user, notify } = useAuth();
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [statusFilter, setStatusFilter] = useState<'All' | RequestStatus>('All');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      setRequests(res.requests);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStatusUpdate = async (id: string, status: RequestStatus) => {
    try {
      const res = await api.updateRequestStatus(id, status);
      setRequests((prev) => prev.map((r) => (r.id === id ? res.request : r)));
      notify(`Request marked as ${status}.`, 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const filtered = requests.filter((r) => {
    const matchesTab =
      tab === 'received' ? r.ownerId === user?.id : r.requesterId === user?.id;
    const matchesStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchesTab && matchesStatus;
  });

  const receivedPendingCount = requests.filter(
    (r) => r.ownerId === user?.id && r.status === 'Pending'
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#172554]">
          Exchange Request Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Review incoming requests for your listings and track the requests you sent.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start">
          <button
            type="button"
            onClick={() => setTab('received')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'received'
                ? 'bg-white text-[#172554] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Received Requests ({receivedPendingCount} pending)
          </button>
          <button
            type="button"
            onClick={() => setTab('sent')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === 'sent'
                ? 'bg-white text-[#172554] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sent Requests
          </button>
        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as 'All' | RequestStatus)
          }
          className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="font-display text-base font-semibold text-[#172554] mb-1">
            No {tab} requests match this view
          </p>
          <p className="text-sm text-slate-500">
            {tab === 'received'
              ? 'Requests from students interested in your listings will appear here.'
              : 'Browse Explore Items to send a borrow, swap, or buy request.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const isOwner = req.ownerId === user?.id;
            const isBorrowLend =
              req.requestType === 'Borrow' || req.requestType === 'Lend';
            return (
              <div
                key={req.id}
                className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => onViewItem(req.itemId)}
                    className="w-20 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0 cursor-pointer"
                  >
                    <SafeImage
                      src={req.itemImage}
                      alt={req.itemTitle || 'Item'}
                      className="w-full h-full object-cover"
                    />
                  </button>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-[#6D5CE7]">
                        {req.requestType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <StatusIndicator status={req.status} />
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        {formatShortDate(req.createdAt)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewItem(req.itemId)}
                      className="font-display text-base font-semibold text-[#172554] hover:underline text-left cursor-pointer"
                    >
                      {req.itemTitle}
                    </button>
                    <p className="text-xs text-slate-600">
                      {isOwner ? (
                        <>
                          Requested by{' '}
                          <strong className="text-slate-900">
                            {req.requesterName}
                          </strong>{' '}
                          ({req.requesterDepartment})
                        </>
                      ) : (
                        <>
                          Owner:{' '}
                          <strong className="text-slate-900">{req.ownerName}</strong>
                        </>
                      )}
                      {req.proposedDuration && ` · Duration: ${req.proposedDuration}`}
                    </p>
                    {req.swapOffer && (
                      <p className="text-xs text-slate-700">
                        <span className="font-medium">Swap offer:</span>{' '}
                        {req.swapOffer}
                      </p>
                    )}
                    {req.message && (
                      <p className="text-sm text-slate-600 pt-1">
                        &ldquo;{req.message}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {isOwner && req.status === 'Pending' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(req.id, 'Accepted')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#14B8A6] hover:bg-[#0d9488] rounded-lg cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}

                  {req.status === 'Accepted' && (
                    <>
                      {isBorrowLend ? (
                        <button
                          type="button"
                          onClick={onOpenBorrowings}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg cursor-pointer"
                        >
                          Manage Handover &amp; Return
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleStatusUpdate(req.id, 'In Progress')}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-[#6D5CE7] hover:bg-[#5b4ad1] rounded-lg cursor-pointer"
                        >
                          Mark In Progress
                        </button>
                      )}
                    </>
                  )}

                  {req.status === 'In Progress' && (
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(req.id, 'Completed')}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg cursor-pointer"
                    >
                      Mark Completed
                    </button>
                  )}

                  {!isOwner &&
                    (req.status === 'Pending' || req.status === 'Accepted') && (
                      <button
                        type="button"
                        onClick={() => handleStatusUpdate(req.id, 'Cancelled')}
                        className="px-3.5 py-2 text-xs font-medium text-slate-600 border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                      >
                        Cancel Request
                      </button>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
