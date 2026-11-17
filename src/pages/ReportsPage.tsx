import React, { useEffect, useState } from 'react';
import { Camera, FileWarning, ShieldAlert, Trash2 } from 'lucide-react';
import { api, uploadImageFile } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import { formatShortDate } from '../constants';
import { useAuth } from '../context/AuthContext';
import type {
  BorrowingRecord,
  DisputeReport,
  ItemListing,
  ReportIssueType,
} from '../types';

const ISSUE_TYPES: ReportIssueType[] = [
  'Damaged Item',
  'Missing Item',
  'Late Return',
  'Unreturned Item',
  'Other Issue',
];

export function ReportsPage({
  prefillBorrowing,
}: {
  prefillBorrowing?: BorrowingRecord | null;
}) {
  const { user, notify } = useAuth();
  const [reports, setReports] = useState<DisputeReport[]>([]);
  const [items, setItems] = useState<ItemListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [itemId, setItemId] = useState(prefillBorrowing?.itemId || '');
  const [issueType, setIssueType] = useState<ReportIssueType>('Damaged Item');
  const [description, setDescription] = useState('');
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (prefillBorrowing) {
      setItemId(prefillBorrowing.itemId);
    }
  }, [prefillBorrowing]);

  useEffect(() => {
    Promise.all([api.getReports(), api.getItems()])
      .then(([repRes, itmRes]) => {
        setReports(repRes.reports);
        setItems(itmRes.items);
        if (!itemId && !prefillBorrowing && itmRes.items.length > 0) {
          setItemId(itmRes.items[0].id);
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of files.slice(0, 3)) {
        urls.push(await uploadImageFile(file));
      }
      setEvidencePhotos((prev) => [...prev, ...urls].slice(0, 4));
      notify('Supporting photo uploaded.', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || !description.trim()) return;
    setSubmitting(true);
    try {
      const targetItem = items.find((i) => i.id === itemId);
      const againstUserId = prefillBorrowing
        ? prefillBorrowing.ownerId === user?.id
          ? prefillBorrowing.borrowerId
          : prefillBorrowing.ownerId
        : targetItem?.ownerId;

      const res = await api.createReport({
        itemId,
        againstUserId,
        borrowingId: prefillBorrowing?.id || null,
        issueType,
        description: description.trim(),
        evidencePhotos,
      });

      setReports((prev) => [res.report, ...prev]);
      setDescription('');
      setEvidencePhotos([]);
      notify(
        'Report submitted for impartial campus administrator review.',
        'success'
      );
    } catch (err: unknown) {
      notify(
        err instanceof Error ? err.message : 'Could not submit report.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#172554]">
          Damage &amp; Dispute Reporting
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Submit factual details and photo evidence for review. Campus administrators review all reports fairly without automatic blame or monetary deductions.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Submit Report Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center gap-2 text-[#172554] mb-4">
            <ShieldAlert className="w-5 h-5 text-[#6D5CE7]" />
            <h2 className="font-display text-lg font-semibold">
              File an Exchange Report
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Related Item
              </label>
              <select
                required
                value={itemId}
                onChange={(e) => setItemId(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Issue Category
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as ReportIssueType)}
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Detailed Description
              </label>
              <textarea
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what happened, handover date, and any observed condition differences..."
                className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Supporting Photographs
              </label>
              <div className="flex flex-wrap items-center gap-2.5">
                {evidencePhotos.map((url, idx) => (
                  <div
                    key={`${url}_${idx}`}
                    className="relative w-16 h-14 rounded-lg overflow-hidden border border-slate-200"
                  >
                    <SafeImage
                      src={url}
                      alt="Evidence"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEvidencePhotos((p) => p.filter((_, i) => i !== idx))
                      }
                      aria-label="Remove photo"
                      className="absolute top-0.5 right-0.5 p-0.5 rounded bg-white/90 text-rose-600 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer">
                  <Camera className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Add Evidence Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={handleUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
            >
              {submitting ? 'Submitting Report...' : 'Submit Report'}
            </button>
          </form>
        </div>

        {/* Reports List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-lg font-semibold text-[#172554]">
            Your Submitted &amp; Linked Reports ({reports.length})
          </h2>

          {loading ? (
            <div className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ) : reports.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <FileWarning className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">
                No reports filed
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Any submitted reports and their administrator review updates will appear here.
              </p>
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-[#6D5CE7]">
                      {rep.issueType}
                    </span>
                    <span aria-hidden="true">·</span>
                    <StatusIndicator status={rep.status} />
                  </div>
                  <span className="text-xs text-slate-500 tabular-nums">
                    {formatShortDate(rep.createdAt)}
                  </span>
                </div>

                <h3 className="font-display text-base font-semibold text-[#172554]">
                  {rep.itemTitle}
                </h3>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {rep.description}
                </p>

                {rep.evidencePhotos.length > 0 && (
                  <div className="flex items-center gap-2">
                    {rep.evidencePhotos.map((photo, idx) => (
                      <a
                        key={`${photo}_${idx}`}
                        href={photo}
                        target="_blank"
                        rel="noreferrer"
                        className="w-16 h-12 rounded-md overflow-hidden border border-slate-200 block"
                      >
                        <SafeImage
                          src={photo}
                          alt="Report evidence"
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                )}

                {rep.adminDecision && (
                  <div className="p-3.5 rounded-lg bg-[#F8FAFC] border border-slate-200/80 text-xs text-slate-700">
                    <span className="block font-semibold text-[#172554] mb-0.5">
                      Administrator Review Note ({rep.reviewedBy || 'Campus Admin'}):
                    </span>
                    {rep.adminDecision}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
