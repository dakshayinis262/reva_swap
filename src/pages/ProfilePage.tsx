import React, { useEffect, useState } from 'react';
import { Camera, CheckCircle2, MapPin, ShieldCheck } from 'lucide-react';
import { api, uploadImageFile } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import {
  DEPARTMENTS,
  formatPrice,
  formatShortDate,
  PICKUP_LOCATIONS,
  YEARS_OF_STUDY,
} from '../constants';
import { useAuth } from '../context/AuthContext';
import type { ExchangeRequest, ItemListing, PublicUser } from '../types';

export function ProfilePage({
  onViewItem,
}: {
  onViewItem: (itemId: string) => void;
}) {
  const { user, refreshUser, notify } = useAuth();
  const [summary, setSummary] = useState<{
    user: PublicUser;
    listedItems: ItemListing[];
    exchangeHistory: ExchangeRequest[];
    completedCount: number;
  } | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    department: user?.department || DEPARTMENTS[0],
    yearOfStudy: user?.yearOfStudy || YEARS_OF_STUDY[0],
    preferredPickup: user?.preferredPickup || PICKUP_LOCATIONS[0],
    bio: user?.bio || '',
    avatarUrl: user?.avatarUrl || '',
  });
  const [saving, setSaving] = useState(false);

  const loadSummary = async () => {
    if (!user) return;
    try {
      const res = await api.getUserSummary(user.id);
      setSummary(res);
      setForm({
        fullName: res.user.fullName,
        department: res.user.department,
        yearOfStudy: res.user.yearOfStudy,
        preferredPickup: res.user.preferredPickup,
        bio: res.user.bio,
        avatarUrl: res.user.avatarUrl,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadSummary();
  }, [user?.id]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadImageFile(file);
      setForm((f) => ({ ...f, avatarUrl: url }));
      await api.updateProfile({ avatarUrl: url });
      await refreshUser();
      await loadSummary();
      notify('Profile photo updated!', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Upload failed.', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateProfile(form);
      await refreshUser();
      await loadSummary();
      setEditing(false);
      notify('Profile updated!', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Failed to save.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const profile = summary?.user || user;
  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 rounded-full bg-[#172554]/10 text-[#172554] flex items-center justify-center font-display text-xl font-bold overflow-hidden border border-slate-200 shrink-0">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.fullName.slice(0, 2).toUpperCase()
              )}
              <label
                title="Update profile photo"
                className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity"
              >
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-1">
                <h1 className="font-display text-2xl font-bold text-[#172554]">
                  {profile.fullName}
                </h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14B8A6]">
                    <ShieldCheck className="w-4 h-4" />
                    Verified Campus Student
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600">
                {profile.department} <span aria-hidden="true">·</span>{' '}
                {profile.yearOfStudy} <span aria-hidden="true">·</span>{' '}
                <span className="font-mono text-xs">{profile.studentId}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1 inline-flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                Preferred pickup: {profile.preferredPickup}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="px-4 py-2 text-sm font-semibold text-[#172554] bg-slate-100 hover:bg-slate-200 rounded-lg self-start sm:self-center cursor-pointer"
          >
            {editing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {profile.bio && !editing && (
          <p className="mt-5 pt-5 border-t border-slate-100 text-sm text-slate-700 leading-relaxed">
            {profile.bio}
          </p>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div>
            <span className="block text-xs text-slate-500">Items Listed</span>
            <span className="font-display text-2xl font-bold text-[#172554] tabular-nums">
              {summary?.listedItems.length ?? 0}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">
              Completed Exchanges
            </span>
            <span className="font-display text-2xl font-bold text-[#14B8A6] tabular-nums">
              {summary?.completedCount ?? 0}
            </span>
          </div>
          <div>
            <span className="block text-xs text-slate-500">
              Verification Status
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mt-1">
              <CheckCircle2 className="w-4 h-4" />
              {profile.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Inline Edit Form */}
        {editing && (
          <form
            onSubmit={handleSave}
            className="mt-6 pt-6 border-t border-slate-200 space-y-4"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Pickup Location
                </label>
                <select
                  value={form.preferredPickup}
                  onChange={(e) =>
                    setForm({ ...form, preferredPickup: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {PICKUP_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Year of Study
                </label>
                <select
                  value={form.yearOfStudy}
                  onChange={(e) =>
                    setForm({ ...form, yearOfStudy: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  {YEARS_OF_STUDY.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Student Bio
              </label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#172554] rounded-lg cursor-pointer"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Items Listed & Exchange History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-base font-semibold text-[#172554] mb-4">
            Items Listed ({summary?.listedItems.length ?? 0})
          </h2>
          {!summary?.listedItems.length ? (
            <p className="text-sm text-slate-500">No items listed yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.listedItems.map((item) => (
                <div
                  key={item.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-10 rounded overflow-hidden bg-slate-100 shrink-0">
                      <SafeImage
                        src={item.images[0]}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => onViewItem(item.id)}
                        className="text-sm font-medium text-[#172554] hover:underline truncate block text-left cursor-pointer"
                      >
                        {item.title}
                      </button>
                      <span className="text-xs text-slate-500">
                        {item.exchangeType} · {formatPrice(item.price, item.exchangeType)}
                      </span>
                    </div>
                  </div>
                  <StatusIndicator status={item.availability} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="font-display text-base font-semibold text-[#172554] mb-4">
            Recent Exchange History ({summary?.exchangeHistory.length ?? 0})
          </h2>
          {!summary?.exchangeHistory.length ? (
            <p className="text-sm text-slate-500">No completed exchanges yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {summary.exchangeHistory.map((ex) => (
                <div
                  key={ex.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">
                      {ex.itemTitle}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      {ex.requestType} · {formatShortDate(ex.updatedAt)}
                    </p>
                  </div>
                  <StatusIndicator status={ex.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
