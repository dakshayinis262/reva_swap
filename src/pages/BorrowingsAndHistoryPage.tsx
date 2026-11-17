import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { api, uploadImageFile } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import { formatShortDate, ITEM_CONDITIONS } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { BorrowingRecord, ExchangeRequest, ItemCondition } from '../types';

export function MyBorrowingsView({
  onReportIssue,
}: {
  onReportIssue: (borrowing: BorrowingRecord) => void;
}) {
  const { user, notify } = useAuth();
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Condition modal
  const [activeBorrowing, setActiveBorrowing] = useState<BorrowingRecord | null>(
    null
  );
  const [stage, setStage] = useState<'Before Handover' | 'After Return'>(
    'Before Handover'
  );
  const [condition, setCondition] = useState<ItemCondition>('Good');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getBorrowings();
      setBorrowings(res.borrowings);
    } catch {
      setBorrowings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 3)) {
        urls.push(await uploadImageFile(file));
      }
      setPhotos((p) => [...p, ...urls].slice(0, 4));
      notify('Condition evidence photo uploaded.', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBorrowing) return;
    setSubmitting(true);
    try {
      const res = await api.addConditionLog(activeBorrowing.id, {
        stage,
        condition,
        notes,
        photos,
      });
      setBorrowings((prev) =>
        prev.map((b) => (b.id === activeBorrowing.id ? res.borrowing : b))
      );
      setActiveBorrowing(null);
      setNotes('');
      setPhotos([]);
      notify('Condition record saved.', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to save log.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmReturn = async (borrowingId: string) => {
    try {
      const res = await api.confirmReturn(borrowingId);
      setBorrowings((prev) =>
        prev.map((b) => (b.id === borrowingId ? res.borrowing : b))
      );
      notify(
        res.borrowing.status === 'Returned'
          ? 'Return confirmed and item marked available!'
          : 'Your return confirmation was recorded. Awaiting owner confirmation.',
        'success'
      );
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Confirmation failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#172554]">
          Borrowing &amp; Return Management
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Track return deadlines, record handover and return condition evidence, and confirm returns.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : borrowings.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="font-display text-base font-semibold text-[#172554] mb-1">
            No active or past borrowing records
          </p>
          <p className="text-sm text-slate-500">
            Accepted Borrow or Lend requests automatically create a tracked handover and return record here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {borrowings.map((bor) => {
            const isOwner = bor.ownerId === user?.id;
            const userConfirmed = isOwner
              ? bor.ownerConfirmedReturn
              : bor.borrowerConfirmedReturn;

            return (
              <div
                key={bor.id}
                className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-20 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <SafeImage
                        src={bor.itemImage}
                        alt={bor.itemTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5 mb-1">
                        <StatusIndicator status={bor.status} />
                        <span className="text-xs text-slate-500">
                          {isOwner
                            ? `Lent to ${bor.borrowerName}`
                            : `Borrowed from ${bor.ownerName}`}
                        </span>
                      </div>
                      <h2 className="font-display text-lg font-semibold text-[#172554] truncate">
                        {bor.itemTitle}
                      </h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBorrowing(bor);
                        setStage(
                          bor.status === 'Active' ? 'After Return' : 'Before Handover'
                        );
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" />
                      <span>Record Condition</span>
                    </button>

                    {bor.status !== 'Returned' && !userConfirmed && (
                      <button
                        type="button"
                        onClick={() => handleConfirmReturn(bor.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#14B8A6] hover:bg-[#0d9488] rounded-lg cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          {isOwner ? 'Confirm Item Returned' : 'Mark as Returned'}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onReportIssue(bor)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Report Issue</span>
                    </button>
                  </div>
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="block text-xs text-slate-500">
                      Borrowing Start Date
                    </span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {formatShortDate(bor.startDate)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">
                      Expected Return Date
                    </span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {formatShortDate(bor.expectedReturnDate)}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">
                      Actual Return Date
                    </span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {bor.actualReturnDate
                        ? formatShortDate(bor.actualReturnDate)
                        : 'Pending return'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs text-slate-500">
                      Return Confirmations
                    </span>
                    <span className="text-xs font-medium text-slate-700">
                      Borrower: {bor.borrowerConfirmedReturn ? 'Yes' : 'No'} · Owner:{' '}
                      {bor.ownerConfirmedReturn ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* Condition Evidence Logs */}
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-semibold text-slate-700 mb-3">
                    Handover &amp; Return Condition Logs ({bor.conditionLogs.length})
                  </h3>

                  {bor.conditionLogs.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No condition notes logged yet. Both students can record condition before handover and after return.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {bor.conditionLogs.map((log) => (
                        <div
                          key={log.id}
                          className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200/80 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span className="font-semibold text-[#172554]">
                              {log.stage} · {log.condition}
                            </span>
                            <span className="text-slate-500 tabular-nums">
                              {log.recordedByName} ({log.role})
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {log.notes}
                          </p>
                          {log.photos.length > 0 && (
                            <div className="flex items-center gap-2 pt-1">
                              {log.photos.map((photo, idx) => (
                                <a
                                  key={`${photo}_${idx}`}
                                  href={photo}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="w-14 h-12 rounded-md overflow-hidden border border-slate-200 block"
                                >
                                  <SafeImage
                                    src={photo}
                                    alt="Condition evidence"
                                    className="w-full h-full object-cover"
                                  />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Condition Record Modal */}
      {activeBorrowing && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-display text-lg font-bold text-[#172554]">
                Record Item Condition
              </h3>
              <button
                type="button"
                onClick={() => setActiveBorrowing(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCondition} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Exchange Stage
                  </label>
                  <select
                    value={stage}
                    onChange={(e) =>
                      setStage(
                        e.target.value as 'Before Handover' | 'After Return'
                      )
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="Before Handover">Before Handover</option>
                    <option value="After Return">After Return</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observed Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as ItemCondition)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                  >
                    {ITEM_CONDITIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condition Notes
                </label>
                <textarea
                  rows={3}
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Describe item state, included accessories, or any wear..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Evidence Photos (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {photos.map((url, idx) => (
                    <div
                      key={`${url}_${idx}`}
                      className="w-16 h-12 rounded border border-slate-200 overflow-hidden"
                    >
                      <SafeImage
                        src={url}
                        alt="Evidence"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                    <Camera className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      disabled={uploading}
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveBorrowing(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-4 py-2 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg cursor-pointer"
                >
                  {submitting ? 'Saving...' : 'Save Condition Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function ExchangeHistoryView({
  onViewItem,
}: {
  onViewItem: (itemId: string) => void;
}) {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getRequests()
      .then((res) => {
        setRequests(
          res.requests.filter(
            (r) =>
              r.status === 'Completed' ||
              r.status === 'Rejected' ||
              r.status === 'Cancelled'
          )
        );
      })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#172554]">
          Exchange History
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Completed, cancelled, and resolved campus sharing records.
        </p>
      </div>

      {loading ? (
        <div className="h-40 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="font-display text-base font-semibold text-[#172554] mb-1">
            No completed exchanges yet
          </p>
          <p className="text-sm text-slate-500">
            Completed borrows, swaps, purchases, and free shares will be archived here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/60">
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Counterparty</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((req) => {
                const isOwner = req.ownerId === user?.id;
                return (
                  <tr key={req.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-medium text-[#172554]">
                      <button
                        type="button"
                        onClick={() => onViewItem(req.itemId)}
                        className="hover:underline text-left cursor-pointer"
                      >
                        {req.itemTitle}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{req.requestType}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {isOwner ? 'Owner' : 'Requester'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {isOwner ? req.requesterName : req.ownerName}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusIndicator status={req.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-500 tabular-nums">
                      {formatShortDate(req.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
