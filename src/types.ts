export type UserRole = 'student' | 'admin';

export type ItemCategory =
  | 'Books & Notes'
  | 'Electronics'
  | 'Lab Equipment'
  | 'Sports Equipment'
  | 'Stationery'
  | 'Hostel Essentials'
  | 'Other Items';

export type ItemCondition = 'New' | 'Like New' | 'Good' | 'Fair';

export type ExchangeType =
  | 'Borrow'
  | 'Lend'
  | 'Buy'
  | 'Sell'
  | 'Swap'
  | 'Free Sharing';

export type ItemAvailability =
  | 'Available'
  | 'Reserved'
  | 'Borrowed'
  | 'Completed';

export type RequestStatus =
  | 'Pending'
  | 'Accepted'
  | 'Rejected'
  | 'In Progress'
  | 'Completed'
  | 'Cancelled';

export type BorrowingStatus =
  | 'Active'
  | 'Overdue'
  | 'Returned'
  | 'Disputed';

export type ReportIssueType =
  | 'Damaged Item'
  | 'Missing Item'
  | 'Late Return'
  | 'Unreturned Item'
  | 'Other Issue';

export type ReportStatus = 'Submitted' | 'Under Review' | 'Resolved';

export interface PublicUser {
  id: string;
  fullName: string;
  email: string;
  studentId: string;
  department: string;
  yearOfStudy: string;
  role: UserRole;
  verified: boolean;
  accountStatus: 'Active' | 'Suspended';
  avatarUrl: string;
  bio: string;
  preferredPickup: string;
  profileCompleted: boolean;
  createdAt: string;
}

export interface ItemListing {
  id: string;
  ownerId: string;
  ownerName?: string;
  ownerDepartment?: string;
  ownerYear?: string;
  ownerVerified?: boolean;
  ownerAvatar?: string;
  ownerCompletedExchanges?: number;
  title: string;
  category: ItemCategory;
  description: string;
  images: string[];
  condition: ItemCondition;
  exchangeType: ExchangeType;
  price: number | null;
  availability: ItemAvailability;
  borrowingDuration: string;
  pickupLocation: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExchangeRequest {
  id: string;
  itemId: string;
  itemTitle?: string;
  itemImage?: string;
  itemExchangeType?: ExchangeType;
  ownerId: string;
  ownerName?: string;
  requesterId: string;
  requesterName?: string;
  requesterDepartment?: string;
  requestType: ExchangeType;
  proposedDuration: string;
  swapOffer: string;
  message: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ConditionRecord {
  id: string;
  recordedByUserId: string;
  recordedByName: string;
  role: 'Owner' | 'Borrower';
  stage: 'Before Handover' | 'After Return';
  condition: ItemCondition;
  notes: string;
  photos: string[];
  createdAt: string;
}

export interface BorrowingRecord {
  id: string;
  requestId: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  ownerId: string;
  ownerName: string;
  borrowerId: string;
  borrowerName: string;
  startDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: BorrowingStatus;
  ownerConfirmedReturn: boolean;
  borrowerConfirmedReturn: boolean;
  conditionLogs: ConditionRecord[];
  createdAt: string;
}

export interface DisputeReport {
  id: string;
  reporterId: string;
  reporterName?: string;
  againstUserId: string;
  againstUserName?: string;
  itemId: string;
  itemTitle?: string;
  borrowingId: string | null;
  issueType: ReportIssueType;
  description: string;
  evidencePhotos: string[];
  status: ReportStatus;
  adminDecision: string;
  reviewedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  itemId: string | null;
  itemTitle?: string | null;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityLog {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  targetType: 'User' | 'Listing' | 'Request' | 'Borrowing' | 'Report';
  targetTitle: string;
  createdAt: string;
}

export interface PlatformStats {
  totalStudents: number;
  activeListings: number;
  completedExchanges: number;
  pendingReports: number;
  demoStats: {
    itemsShared: number;
    activeStudents: number;
    successfulExchanges: number;
    moneySavedInr: number;
  };
}
