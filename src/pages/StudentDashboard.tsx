import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  ClipboardList,
  Compass,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react';
import { api } from '../api/client';
import { ItemCard } from '../components/ItemCard';
import { SafeImage } from '../components/SafeImage';
import { StatusIndicator } from '../components/StatusBadge';
import { formatPrice, formatShortDate } from '../constants';
import { useAuth } from '../context/AuthContext';
import type { BorrowingRecord, ExchangeRequest, ItemListing } from '../types';
import { AddEditListingPage } from './AddEditListingPage';
import { AdminDashboard } from './AdminDashboard';
import {
  ExchangeHistoryView,
  MyBorrowingsView,
} from './BorrowingsAndHistoryPage';
import { ExplorePage } from './ExplorePage';
import { ItemDetailsPage } from './ItemDetailsPage';
import { MessagesPage } from './MessagesPage';
import { MyListingsView, MyRequestsView } from './MyListingsAndRequests';
import { ProfilePage } from './ProfilePage';
import { ReportsPage } from './ReportsPage';

export type WorkspaceTab =
  | 'overview'
  | 'explore'
  | 'add-listing'
  | 'edit-listing'
  | 'my-listings'
  | 'my-requests'
  | 'my-borrowings'
  | 'exchange-history'
  | 'messages'
  | 'reports'
  | 'profile'
  | 'item-details'
  | 'admin';

interface StudentDashboardProps {
  initialTab?: WorkspaceTab;
  initialMessageTarget?: { recipientId: string; itemId: string } | null;
  onExitToPublic: (view?: 'landing' | 'explore') => void;
}

export function StudentDashboard({
  initialTab = 'overview',
  initialMessageTarget = null,
  onExitToPublic,
}: StudentDashboardProps) {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(
    user?.role === 'admin' && initialTab === 'overview' ? 'admin' : initialTab
  );
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<ItemListing | null>(null);
  const [exploreQuery, setExploreQuery] = useState('');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [messageTarget, setMessageTarget] = useState<{
    recipientId: string;
    itemId: string;
  } | null>(initialMessageTarget);
  const [prefillBorrowingReport, setPrefillBorrowingReport] =
    useState<BorrowingRecord | null>(null);

  // Overview data
  const [allItems, setAllItems] = useState<ItemListing[]>([]);
  const [requests, setRequests] = useState<ExchangeRequest[]>([]);
  const [borrowings, setBorrowings] = useState<BorrowingRecord[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [loadingOverview, setLoadingOverview] = useState(true);

  const loadOverviewData = async () => {
    setLoadingOverview(true);
    try {
      const [itmRes, reqRes, borRes, msgRes] = await Promise.all([
        api.getItems(),
        api.getRequests(),
        api.getBorrowings(),
        api.getMessages(),
      ]);
      setAllItems(itmRes.items);
      setRequests(reqRes.requests);
      setBorrowings(borRes.borrowings);
      setUnreadMessages(
        msgRes.messages.filter((m) => m.recipientId === user?.id && !m.read)
          .length
      );
    } catch {
      // ignore
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverviewData();
  }, [activeTab]);

  if (!user) return null;

  const navigateTab = (tab: WorkspaceTab) => {
    setMobileMenuOpen(false);
    setActiveTab(tab);
  };

  const openItemDetails = (itemId: string) => {
    setSelectedItemId(itemId);
    navigateTab('item-details');
  };

  const handleDashboardSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setExploreQuery(dashboardSearch);
    navigateTab('explore');
  };

  const recentlyAdded = allItems.slice(0, 3);
  const recommendedItems = allItems
    .filter((i) => i.ownerId !== user.id && i.availability === 'Available')
    .sort((a, b) => {
      const aMatch = a.ownerDepartment === user.department ? 1 : 0;
      const bMatch = b.ownerDepartment === user.department ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 3);

  const myListings = allItems.filter((i) => i.ownerId === user.id);
  const activeRequests = requests.filter(
    (r) =>
      r.status === 'Pending' ||
      r.status === 'Accepted' ||
      r.status === 'In Progress'
  );
  const currentlyBorrowed = borrowings.filter(
    (b) => b.borrowerId === user.id && b.status === 'Active'
  );

  const navItems: {
    id: WorkspaceTab;
    label: string;
    icon: React.ReactNode;
    badge?: number;
  }[] = [
    {
      id: 'overview',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'explore',
      label: 'Explore Items',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      id: 'my-listings',
      label: 'My Listings',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'my-requests',
      label: 'My Requests',
      icon: <ClipboardList className="w-4 h-4" />,
      badge: activeRequests.length > 0 ? activeRequests.length : undefined,
    },
    {
      id: 'my-borrowings',
      label: 'My Borrowings',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'exchange-history',
      label: 'Exchange History',
      icon: <History className="w-4 h-4" />,
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: <MessageSquare className="w-4 h-4" />,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      id: 'reports',
      label: 'Disputes & Reports',
      icon: <AlertTriangle className="w-4 h-4" />,
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: <User className="w-4 h-4" />,
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="px-4 py-5 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onExitToPublic('landing')}
            className="font-display text-lg font-extrabold tracking-tight text-[#172554] cursor-pointer"
          >
            REVA SWAP
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 text-slate-500"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              navigateTab('add-listing');
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item Listing</span>
          </button>
        </div>

        <nav className="px-3 space-y-1">
          {user.role === 'admin' && (
            <button
              type="button"
              onClick={() => navigateTab('admin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-[#6D5CE7]/10 text-[#6D5CE7] font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="inline-flex items-center gap-2.5">
                <Shield className="w-4 h-4" />
                <span>Admin Console</span>
              </span>
            </button>
          )}

          {navItems.map((item) => {
            const active =
              activeTab === item.id ||
              (item.id === 'my-listings' &&
                (activeTab === 'add-listing' || activeTab === 'edit-listing'));
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#172554]/8 text-[#172554] font-semibold'
                    : 'text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="inline-flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="text-xs font-semibold text-[#6D5CE7] tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-200 space-y-2">
        <div className="px-3 py-2">
          <p className="text-xs font-semibold text-[#172554] truncate">
            {user.fullName}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            {user.studentId} · {user.department}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await logout();
            onExitToPublic('landing');
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-white h-full overflow-y-auto shadow-xl z-10">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Context Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-medium text-slate-500">
              REVA SWAP Campus Workspace /{' '}
              <strong className="text-[#172554] capitalize">
                {activeTab.replace('-', ' ')}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => navigateTab('explore')}
              className="hidden sm:inline-flex text-xs font-medium text-slate-600 hover:text-[#172554] cursor-pointer"
            >
              Browse Marketplace
            </button>
            <button
              type="button"
              onClick={() => navigateTab('profile')}
              className="w-8 h-8 rounded-full bg-[#172554] text-white text-xs font-bold flex items-center justify-center overflow-hidden cursor-pointer"
              title={user.fullName}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                user.fullName.slice(0, 2).toUpperCase()
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-8 max-w-[1200px] w-full mx-auto">
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Welcome + Search */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#172554]">
                    Welcome back, {user.fullName.split(' ')[0]}
                  </h1>
                  <p className="text-sm text-slate-600 mt-1">
                    {user.department} · {user.yearOfStudy} · Verified Campus Member
                  </p>
                </div>
                <form
                  onSubmit={handleDashboardSearchSubmit}
                  className="flex items-center gap-2 w-full lg:w-96"
                >
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      value={dashboardSearch}
                      onChange={(e) => setDashboardSearch(e.target.value)}
                      placeholder="Search textbooks, lab kits, electronics..."
                      className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#F8FAFC] rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-[#172554] rounded-lg hover:bg-[#1e3270] shrink-0 cursor-pointer"
                  >
                    Search
                  </button>
                </form>
              </div>

              {/* 3-Column Operational Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Requests */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display text-base font-semibold text-[#172554]">
                        Active Requests
                      </h2>
                      <span className="font-mono text-xs font-semibold text-[#6D5CE7] tabular-nums">
                        {activeRequests.length}
                      </span>
                    </div>
                    {loadingOverview ? (
                      <div className="h-20 bg-slate-100 rounded animate-pulse" />
                    ) : activeRequests.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4">
                        No pending or active exchange requests right now.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {activeRequests.slice(0, 3).map((req) => (
                          <div key={req.id} className="py-2.5 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-slate-900 truncate">
                                {req.itemTitle}
                              </span>
                              <StatusIndicator status={req.status} />
                            </div>
                            <p className="text-[11px] text-slate-500">
                              {req.ownerId === user.id
                                ? `From ${req.requesterName}`
                                : `To ${req.ownerName}`}{' '}
                              · {req.requestType}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('my-requests')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#172554] hover:text-[#6D5CE7] cursor-pointer"
                  >
                    <span>Manage all requests</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Items Currently Borrowed */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display text-base font-semibold text-[#172554]">
                        Currently Borrowed
                      </h2>
                      <span className="font-mono text-xs font-semibold text-[#14B8A6] tabular-nums">
                        {currentlyBorrowed.length}
                      </span>
                    </div>
                    {loadingOverview ? (
                      <div className="h-20 bg-slate-100 rounded animate-pulse" />
                    ) : currentlyBorrowed.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4">
                        You are not currently borrowing any campus items.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {currentlyBorrowed.map((bor) => (
                          <div key={bor.id} className="py-2.5 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-medium text-slate-900 truncate">
                                {bor.itemTitle}
                              </span>
                              <StatusIndicator status={bor.status} />
                            </div>
                            <p className="text-[11px] text-slate-500 tabular-nums">
                              Return due: {formatShortDate(bor.expectedReturnDate)} ·
                              Owner: {bor.ownerName}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('my-borrowings')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#172554] hover:text-[#6D5CE7] cursor-pointer"
                  >
                    <span>View borrowing &amp; return tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Items Listed by Me */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="font-display text-base font-semibold text-[#172554]">
                        Items Listed by Me
                      </h2>
                      <span className="font-mono text-xs font-semibold text-[#172554] tabular-nums">
                        {myListings.length}
                      </span>
                    </div>
                    {loadingOverview ? (
                      <div className="h-20 bg-slate-100 rounded animate-pulse" />
                    ) : myListings.length === 0 ? (
                      <p className="text-xs text-slate-500 py-4">
                        No items listed yet. Share textbooks or tools to help peers.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {myListings.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="py-2.5 flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-7 rounded overflow-hidden bg-slate-100 shrink-0">
                                <SafeImage
                                  src={item.images[0]}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-slate-900 truncate">
                                  {item.title}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {formatPrice(item.price, item.exchangeType)}
                                </p>
                              </div>
                            </div>
                            <StatusIndicator status={item.availability} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('my-listings')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#172554] hover:text-[#6D5CE7] cursor-pointer"
                  >
                    <span>Manage my listings</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recommended Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#172554]">
                      Recommended for You
                    </h2>
                    <p className="text-xs text-slate-500">
                      Available items relevant to {user.department} and campus life.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateTab('explore')}
                    className="text-xs font-semibold text-[#6D5CE7] hover:underline cursor-pointer"
                  >
                    See all items
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recommendedItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={openItemDetails}
                    />
                  ))}
                </div>
              </div>

              {/* Recently Added Items */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-lg font-bold text-[#172554]">
                    Recently Added on Campus
                  </h2>
                  <button
                    type="button"
                    onClick={() => navigateTab('explore')}
                    className="text-xs font-semibold text-[#6D5CE7] hover:underline cursor-pointer"
                  >
                    Explore marketplace
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentlyAdded.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      onSelect={openItemDetails}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'explore' && (
            <ExplorePage
              embedded
              initialQuery={exploreQuery}
              onSelectItem={openItemDetails}
            />
          )}

          {activeTab === 'item-details' && selectedItemId && (
            <ItemDetailsPage
              itemId={selectedItemId}
              onBack={() => navigateTab('explore')}
              onRequireLogin={() => onExitToPublic('landing')}
              onOpenMessages={(recipientId, itemId) => {
                setMessageTarget({ recipientId, itemId });
                navigateTab('messages');
              }}
              onRequestCreated={() => navigateTab('my-requests')}
            />
          )}

          {activeTab === 'add-listing' && (
            <AddEditListingPage
              onCancel={() => navigateTab('my-listings')}
              onSaved={() => navigateTab('my-listings')}
            />
          )}

          {activeTab === 'edit-listing' && editingItem && (
            <AddEditListingPage
              editItem={editingItem}
              onCancel={() => navigateTab('my-listings')}
              onSaved={() => {
                setEditingItem(null);
                navigateTab('my-listings');
              }}
            />
          )}

          {activeTab === 'my-listings' && (
            <MyListingsView
              onAddNew={() => {
                setEditingItem(null);
                navigateTab('add-listing');
              }}
              onEdit={(item) => {
                setEditingItem(item);
                navigateTab('edit-listing');
              }}
              onViewItem={openItemDetails}
            />
          )}

          {activeTab === 'my-requests' && (
            <MyRequestsView
              onViewItem={openItemDetails}
              onOpenBorrowings={() => navigateTab('my-borrowings')}
            />
          )}

          {activeTab === 'my-borrowings' && (
            <MyBorrowingsView
              onReportIssue={(bor) => {
                setPrefillBorrowingReport(bor);
                navigateTab('reports');
              }}
            />
          )}

          {activeTab === 'exchange-history' && (
            <ExchangeHistoryView onViewItem={openItemDetails} />
          )}

          {activeTab === 'messages' && (
            <MessagesPage
              initialRecipientId={messageTarget?.recipientId}
              initialItemId={messageTarget?.itemId}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPage prefillBorrowing={prefillBorrowingReport} />
          )}

          {activeTab === 'profile' && (
            <ProfilePage onViewItem={openItemDetails} />
          )}

          {activeTab === 'admin' && user.role === 'admin' && <AdminDashboard />}
        </main>
      </div>
    </div>
  );
}
