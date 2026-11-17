import React, { useEffect, useState } from 'react';
import {
  Activity,
  Ban,
  CheckCircle2,
  Package,
  ShieldAlert,
  Trash2,
  Users,
} from 'lucide-react';
import { api } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import { formatPrice, formatShortDate } from '../constants';
import { useAuth } from '../context/AuthContext';
import type {
  ActivityLog,
  DisputeReport,
  ItemListing,
  PublicUser,
  ReportStatus,
} from '../types';

export function AdminDashboard() {
  const { notify } = useAuth();
  const [tab, setTab] = useState<'overview' | 'students' | 'listings' | 'reports'>(
    'overview'
  );
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalStudents: 0,
    activeListings: 0,
    totalExchanges: 0,
    pendingReports: 0,
  });
  const [students, setStudents] = useState<PublicUser[]>([]);
  const [listings, setListings] = useState<ItemListing[]>([]);
  const [reports, setReports] = useState<DisputeReport[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [decisionDraft, setDecisionDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<ReportStatus>('Under Review');

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminOverview();
      setMetrics(res.metrics);
      setStudents(res.students);
      setListings(res.listings);
      setReports(res.reports);
      setActivityLogs(res.activityLogs);
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Admin load failed.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggleStudentStatus = async (student: PublicUser) => {
    const nextStatus =
      student.accountStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      const res = await api.adminUpdateUser(student.id, {
        accountStatus: nextStatus,
      });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? res.user : s))
      );
      notify(`${student.fullName} is now ${nextStatus}.`, 'info');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Action failed.', 'error');
    }
  };

  const handleVerifyStudent = async (student: PublicUser) => {
    try {
      const res = await api.adminUpdateUser(student.id, { verified: true });
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? res.user : s))
      );
      notify(`${student.fullName} verified.`, 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Verification failed.', 'error');
    }
  };

  const handleRemoveListing = async (listing: ItemListing) => {
    try {
      await api.adminDeleteListing(listing.id);
      setListings((prev) => prev.filter((l) => l.id !== listing.id));
      setMetrics((m) => ({
        ...m,
        activeListings: Math.max(0, m.activeListings - 1),
      }));
      notify(`Removed listing "${listing.title}".`, 'info');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Removal failed.', 'error');
    }
  };

  const handleSaveReportDecision = async (reportId: string) => {
    try {
      const res = await api.adminUpdateReport(reportId, {
        status: statusDraft,
        adminDecision: decisionDraft,
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? res.report : r))
      );
      setEditingReportId(null);
      notify('Dispute report updated.', 'success');
      load();
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#172554]">
          Administrator Governance Console
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Oversee campus student accounts, moderate item listings, and review dispute reports fairly.
        </p>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Registered Students</span>
            <Users className="w-4 h-4 text-[#172554]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#172554] tabular-nums">
            {metrics.totalStudents}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Active Listings</span>
            <Package className="w-4 h-4 text-[#14B8A6]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#172554] tabular-nums">
            {metrics.activeListings}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Total Exchanges</span>
            <CheckCircle2 className="w-4 h-4 text-[#6D5CE7]" />
          </div>
          <p className="font-display text-2xl font-bold text-[#172554] tabular-nums">
            {metrics.totalExchanges}
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Pending Reports</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <p className="font-display text-2xl font-bold text-[#172554] tabular-nums">
            {metrics.pendingReports}
          </p>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
        {(
          [
            ['overview', 'Platform Activity'],
            ['students', `Manage Students (${students.length})`],
            ['listings', `Review Listings (${listings.length})`],
            ['reports', `Dispute Reports (${reports.length})`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              tab === key
                ? 'bg-white text-[#172554] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse" />
      ) : (
        <>
          {/* ACTIVITY TAB */}
          {tab === 'overview' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 text-[#172554] mb-4">
                <Activity className="w-4 h-4 text-[#14B8A6]" />
                <h2 className="font-display text-base font-semibold">
                  Recent Platform Activity
                </h2>
              </div>
              <div className="divide-y divide-slate-100">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm"
                  >
                    <div>
                      <span className="font-semibold text-[#172554]">
                        {log.actorName}
                      </span>{' '}
                      <span className="text-slate-600">{log.action}:</span>{' '}
                      <span className="font-medium text-slate-900">
                        {log.targetTitle}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums shrink-0">
                      {log.targetType} · {formatShortDate(log.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {tab === 'students' && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/70">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Student ID</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Verification</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-semibold text-[#172554]">
                          {st.fullName}
                        </p>
                        <p className="text-xs text-slate-500">{st.email}</p>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-700">
                        {st.studentId}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600">
                        {st.department} ({st.yearOfStudy})
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator
                          status={st.verified ? 'Verified' : 'Pending'}
                        />
                      </td>
                      <td className="py-3 px-4">
                        <StatusIndicator status={st.accountStatus} />
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        {!st.verified && (
                          <button
                            type="button"
                            onClick={() => handleVerifyStudent(st)}
                            className="px-2.5 py-1 text-xs font-semibold text-[#14B8A6] bg-[#14B8A6]/10 rounded-md cursor-pointer"
                          >
                            Verify
                          </button>
                        )}
                        {st.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(st)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md cursor-pointer ${
                              st.accountStatus === 'Active'
                                ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                          >
                            <Ban className="w-3 h-3" />
                            <span>
                              {st.accountStatus === 'Active'
                                ? 'Suspend'
                                : 'Activate'}
                            </span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LISTINGS MODERATION TAB */}
          {tab === 'listings' && (
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
              {listings.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 aspect-[4/3] rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <SafeImage
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-[#172554] truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        Owner: {item.ownerName} · {item.category} ·{' '}
                        {formatPrice(item.price, item.exchangeType)}
                      </p>
                      <div className="mt-1">
                        <StatusIndicator status={item.availability} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveListing(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Listing</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* DISPUTE REPORTS TAB */}
          {tab === 'reports' && (
            <div className="space-y-4">
              {reports.map((rep) => {
                const isEditing = editingReportId === rep.id;
                return (
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
                        Filed {formatShortDate(rep.createdAt)}
                      </span>
                    </div>

                    <h3 className="font-display text-base font-semibold text-[#172554]">
                      {rep.itemTitle}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Reported by <strong>{rep.reporterName}</strong> · Counterparty:{' '}
                      <strong>{rep.againstUserName}</strong>
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {rep.description}
                    </p>

                    {rep.evidencePhotos.length > 0 && (
                      <div className="flex items-center gap-2">
                        {rep.evidencePhotos.map((p, i) => (
                          <a
                            key={`${p}_${i}`}
                            href={p}
                            target="_blank"
                            rel="noreferrer"
                            className="w-16 h-12 rounded overflow-hidden border border-slate-200 block"
                          >
                            <SafeImage
                              src={p}
                              alt="Evidence"
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    )}

                    {isEditing ? (
                      <div className="pt-3 border-t border-slate-100 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Report Status
                            </label>
                            <select
                              value={statusDraft}
                              onChange={(e) =>
                                setStatusDraft(e.target.value as ReportStatus)
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                            >
                              <option value="Submitted">Submitted</option>
                              <option value="Under Review">Under Review</option>
                              <option value="Resolved">Resolved</option>
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-700 mb-1">
                              Impartial Review Decision / Mediation Note
                            </label>
                            <input
                              type="text"
                              value={decisionDraft}
                              onChange={(e) => setDecisionDraft(e.target.value)}
                              placeholder="Record neutral findings and agreed next steps..."
                              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingReportId(null)}
                            className="px-3 py-1.5 text-xs font-medium text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveReportDecision(rep.id)}
                            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#172554] rounded-lg cursor-pointer"
                          >
                            Save Review Decision
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-slate-600">
                          {rep.adminDecision
                            ? `Decision: ${rep.adminDecision}`
                            : 'No administrator decision recorded yet.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReportId(rep.id);
                            setStatusDraft(rep.status);
                            setDecisionDraft(rep.adminDecision || '');
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg self-start cursor-pointer"
                        >
                          Update Status &amp; Decision
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
