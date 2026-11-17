import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  ActivityLog,
  BorrowingRecord,
  ChatMessage,
  DisputeReport,
  ExchangeRequest,
  ItemListing,
  PublicUser,
  UserRole,
} from '../src/types';
import { hashPassword } from './auth';

export interface StoredUser extends PublicUser {
  passwordHash: string;
  verificationCode: string | null;
  resetCode: string | null;
}

export interface DatabaseSchema {
  users: StoredUser[];
  listings: ItemListing[];
  requests: ExchangeRequest[];
  borrowings: BorrowingRecord[];
  reports: DisputeReport[];
  messages: ChatMessage[];
  activityLogs: ActivityLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'reva-swap-db.json');

function ensureDirectories(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

export function getUploadsDir(): string {
  ensureDirectories();
  return UPLOADS_DIR;
}

export function createInitialSeed(): DatabaseSchema {
  const now = new Date();
  const daysAgo = (d: number) =>
    new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
  const daysFromNow = (d: number) =>
    new Date(now.getTime() + d * 24 * 60 * 60 * 1000).toISOString();

  const studentPass = hashPassword('Student@2026');
  const adminPass = hashPassword('Admin@2026');

  const users: StoredUser[] = [
    {
      id: 'usr_ananya',
      fullName: 'Ananya Sharma',
      email: 'ananya.sharma@reva.edu.in',
      studentId: 'R23CS042',
      department: 'Computer Science & Engineering',
      yearOfStudy: '3rd Year',
      role: 'student',
      verified: true,
      accountStatus: 'Active',
      avatarUrl: '',
      bio: 'CSE junior interested in embedded systems, competitive programming, and sustainable campus sharing.',
      preferredPickup: 'Science Block Atrium',
      profileCompleted: true,
      passwordHash: studentPass,
      verificationCode: null,
      resetCode: null,
      createdAt: daysAgo(45),
    },
    {
      id: 'usr_rohan',
      fullName: 'Rohan Kulkarni',
      email: 'rohan.kulkarni@reva.edu.in',
      studentId: 'R22EC118',
      department: 'Electronics & Communication',
      yearOfStudy: '4th Year',
      role: 'student',
      verified: true,
      accountStatus: 'Active',
      avatarUrl: '',
      bio: 'Final-year ECE student passing down lab kits, textbooks, and hardware tools before graduation.',
      preferredPickup: 'CV Raman Block Lobby',
      profileCompleted: true,
      passwordHash: studentPass,
      verificationCode: null,
      resetCode: null,
      createdAt: daysAgo(62),
    },
    {
      id: 'usr_meera',
      fullName: 'Meera Nair',
      email: 'meera.nair@reva.edu.in',
      studentId: 'R24AR019',
      department: 'Architecture',
      yearOfStudy: '2nd Year',
      role: 'student',
      verified: true,
      accountStatus: 'Active',
      avatarUrl: '',
      bio: 'Architecture sophomore swapping drafting tools, sketchbooks, and hostel essentials.',
      preferredPickup: 'Design Studio Courtyard',
      profileCompleted: true,
      passwordHash: studentPass,
      verificationCode: null,
      resetCode: null,
      createdAt: daysAgo(30),
    },
    {
      id: 'usr_karthik',
      fullName: 'Karthik Reddy',
      email: 'karthik.reddy@reva.edu.in',
      studentId: 'R23ME075',
      department: 'Mechanical Engineering',
      yearOfStudy: '3rd Year',
      role: 'student',
      verified: true,
      accountStatus: 'Active',
      avatarUrl: '',
      bio: 'Mechanical undergrad and badminton club captain. Happy to lend sports gear and calculators.',
      preferredPickup: 'Sports Complex Entrance',
      profileCompleted: true,
      passwordHash: studentPass,
      verificationCode: null,
      resetCode: null,
      createdAt: daysAgo(25),
    },
    {
      id: 'usr_admin',
      fullName: 'Dr. Priya Deshmukh',
      email: 'admin@reva.edu.in',
      studentId: 'ADMIN-001',
      department: 'Campus Student Affairs',
      yearOfStudy: 'Administration',
      role: 'admin',
      verified: true,
      accountStatus: 'Active',
      avatarUrl: '',
      bio: 'REVA SWAP Campus Community Administrator overseeing trust, safety, and dispute resolution.',
      preferredPickup: 'Admin Block Room 104',
      profileCompleted: true,
      passwordHash: adminPass,
      verificationCode: null,
      resetCode: null,
      createdAt: daysAgo(90),
    },
  ];

  const listings: ItemListing[] = [
    {
      id: 'itm_os_books',
      ownerId: 'usr_rohan',
      title: 'Operating Systems & Computer Architecture Textbook Bundle',
      category: 'Books & Notes',
      description:
        'Clean hardcover editions of Tanenbaum Modern Operating Systems (5th Ed.) and Hennessy & Patterson Computer Architecture (6th Ed.), plus handwritten semester lecture notes. Zero torn pages.',
      images: [
        '/src/assets/images/item_textbooks_bundle_1794921132809.jpg',
        '/src/assets/images/item_drafting_stationery_1794921135352.jpg',
      ],
      condition: 'Like New',
      exchangeType: 'Borrow',
      price: null,
      availability: 'Available',
      borrowingDuration: '1 Semester (Up to 16 weeks)',
      pickupLocation: 'Central Library Steps',
      createdAt: daysAgo(8),
      updatedAt: daysAgo(8),
    },
    {
      id: 'itm_macbook_hub',
      ownerId: 'usr_ananya',
      title: 'Aluminum USB-C Multiport Hub & Studio Wireless Headphones',
      category: 'Electronics',
      description:
        'Reliable 7-in-1 USB-C hub with HDMI 4K output and SD reader paired with over-ear ANC wireless headphones for hackathon weekends or presentation prep.',
      images: [
        '/src/assets/images/item_laptop_electronics_1794921133058.jpg',
      ],
      condition: 'Like New',
      exchangeType: 'Lend',
      price: null,
      availability: 'Available',
      borrowingDuration: '7 Days',
      pickupLocation: 'Science Block Atrium',
      createdAt: daysAgo(6),
      updatedAt: daysAgo(6),
    },
    {
      id: 'itm_arduino_kit',
      ownerId: 'usr_rohan',
      title: 'Complete Embedded Systems & Multimeter Lab Kit',
      category: 'Lab Equipment',
      description:
        'Includes calibrated digital multimeter, Arduino Uno R3, 830-point solderless breadboard, resistor pack, and color-coded jumper wires in a hard compartment tray. Ideal for 3rd & 4th semester labs.',
      images: [
        '/src/assets/images/item_lab_equipment_1794921135375.jpg',
      ],
      condition: 'Good',
      exchangeType: 'Sell',
      price: 1250,
      availability: 'Available',
      borrowingDuration: '',
      pickupLocation: 'CV Raman Block Lobby',
      createdAt: daysAgo(5),
      updatedAt: daysAgo(5),
    },
    {
      id: 'itm_badminton_set',
      ownerId: 'usr_karthik',
      title: 'Carbon-Fiber Badminton Rackets (Pair) + Shuttlecock Tube & Bag',
      category: 'Sports Equipment',
      description:
        'Two lightweight carbon-fiber rackets freshly strung at 24 lbs, a half-full feather shuttlecock tube, and a navy canvas sports duffle. Great for evening matches at the campus indoor court.',
      images: [
        '/src/assets/images/item_sports_badminton_1794921134171.jpg',
      ],
      condition: 'Good',
      exchangeType: 'Borrow',
      price: null,
      availability: 'Borrowed',
      borrowingDuration: '3 Days',
      pickupLocation: 'Sports Complex Entrance',
      createdAt: daysAgo(12),
      updatedAt: daysAgo(2),
    },
    {
      id: 'itm_desk_lamp',
      ownerId: 'usr_meera',
      title: 'Architectural Matte Navy LED Study Lamp & Desk Organizer',
      category: 'Hostel Essentials',
      description:
        'Adjustable arm warm-white LED study lamp with toggle switch and wooden desk caddy. Moving off-campus next month and looking to swap for a compact electric kettle or sell directly.',
      images: [
        '/src/assets/images/item_hostel_lamp_1794921134896.jpg',
      ],
      condition: 'Like New',
      exchangeType: 'Swap',
      price: null,
      availability: 'Available',
      borrowingDuration: '',
      pickupLocation: 'Hostel Block B Reception',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(4),
    },
    {
      id: 'itm_drafting_set',
      ownerId: 'usr_meera',
      title: 'Precision Engineering Drafting Compass, Scale Ruler & Fineliners',
      category: 'Stationery',
      description:
        'Staedtler masterbow precision compass, aluminum triangular architect scale, set squares, and four refillable technical pens. Gently used for two studios.',
      images: [
        '/src/assets/images/item_drafting_stationery_1794921135352.jpg',
      ],
      condition: 'Good',
      exchangeType: 'Buy',
      price: 650,
      availability: 'Available',
      borrowingDuration: '',
      pickupLocation: 'Design Studio Courtyard',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
    {
      id: 'itm_free_notes',
      ownerId: 'usr_ananya',
      title: 'Data Structures & Algorithms Spiral Workbook + Revision Flashcards',
      category: 'Books & Notes',
      description:
        'Free to any 1st or 2nd year student preparing for campus placements or semester exams. Clean grid notebook with annotated complexity charts and 80+ solved graph problems.',
      images: [
        '/src/assets/images/item_textbooks_bundle_1794921132809.jpg',
      ],
      condition: 'Good',
      exchangeType: 'Free Sharing',
      price: 0,
      availability: 'Available',
      borrowingDuration: '',
      pickupLocation: 'Main Canteen Patio',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'itm_scientific_calc',
      ownerId: 'usr_karthik',
      title: 'Engineering Mechanics Reference & Scientific Drawing Pad',
      category: 'Other Items',
      description:
        'Spare reference handbook and isometric grid pad for Mechanical & Civil engineering freshman coursework. Available to borrow for exam week.',
      images: [
        '/src/assets/images/item_drafting_stationery_1794921135352.jpg',
      ],
      condition: 'Fair',
      exchangeType: 'Borrow',
      price: null,
      availability: 'Available',
      borrowingDuration: '14 Days',
      pickupLocation: 'Mechanical Workshop Gate',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(2),
    },
  ];

  const requests: ExchangeRequest[] = [
    {
      id: 'req_1',
      itemId: 'itm_badminton_set',
      ownerId: 'usr_karthik',
      requesterId: 'usr_ananya',
      requestType: 'Borrow',
      proposedDuration: '3 Days',
      swapOffer: '',
      message: 'Hi Karthik! Could I borrow the rackets for the inter-department tournament practice this week?',
      status: 'In Progress',
      createdAt: daysAgo(3),
      updatedAt: daysAgo(2),
    },
    {
      id: 'req_2',
      itemId: 'itm_os_books',
      ownerId: 'usr_rohan',
      requesterId: 'usr_ananya',
      requestType: 'Borrow',
      proposedDuration: '1 Semester',
      swapOffer: '',
      message: 'Taking OS this semester—would love to borrow the Tanenbaum edition until finals.',
      status: 'Pending',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'req_3',
      itemId: 'itm_macbook_hub',
      ownerId: 'usr_ananya',
      requesterId: 'usr_meera',
      requestType: 'Lend',
      proposedDuration: '4 Days',
      swapOffer: '',
      message: 'Need an HDMI adapter for our Architecture jury presentation on Friday!',
      status: 'Pending',
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      id: 'req_4',
      itemId: 'itm_desk_lamp',
      ownerId: 'usr_meera',
      requesterId: 'usr_rohan',
      requestType: 'Swap',
      proposedDuration: '',
      swapOffer: 'Stainless steel 1.5L electric kettle (1 year old, spotless)',
      message: 'Hey Meera, I have a clean Prestige electric kettle if you want to swap for the study lamp.',
      status: 'Completed',
      createdAt: daysAgo(14),
      updatedAt: daysAgo(10),
    },
  ];

  const borrowings: BorrowingRecord[] = [
    {
      id: 'bor_1',
      requestId: 'req_1',
      itemId: 'itm_badminton_set',
      itemTitle: 'Carbon-Fiber Badminton Rackets (Pair) + Shuttlecock Tube & Bag',
      itemImage: '/src/assets/images/item_sports_badminton_1794921134171.jpg',
      ownerId: 'usr_karthik',
      ownerName: 'Karthik Reddy',
      borrowerId: 'usr_ananya',
      borrowerName: 'Ananya Sharma',
      startDate: daysAgo(2).slice(0, 10),
      expectedReturnDate: daysFromNow(1).slice(0, 10),
      actualReturnDate: null,
      status: 'Active',
      ownerConfirmedReturn: false,
      borrowerConfirmedReturn: false,
      conditionLogs: [
        {
          id: 'cond_1',
          recordedByUserId: 'usr_karthik',
          recordedByName: 'Karthik Reddy',
          role: 'Owner',
          stage: 'Before Handover',
          condition: 'Good',
          notes: 'Both rackets intact, fresh white grip tape, 8 shuttlecocks inside tube.',
          photos: ['/src/assets/images/item_sports_badminton_1794921134171.jpg'],
          createdAt: daysAgo(2),
        },
        {
          id: 'cond_2',
          recordedByUserId: 'usr_ananya',
          recordedByName: 'Ananya Sharma',
          role: 'Borrower',
          stage: 'Before Handover',
          condition: 'Good',
          notes: 'Verified string tension and zipper on duffle bag at Sports Complex handover.',
          photos: [],
          createdAt: daysAgo(2),
        },
      ],
      createdAt: daysAgo(2),
    },
  ];

  const reports: DisputeReport[] = [
    {
      id: 'rep_1',
      reporterId: 'usr_rohan',
      againstUserId: 'usr_karthik',
      itemId: 'itm_arduino_kit',
      borrowingId: null,
      issueType: 'Late Return',
      description:
        'Multimeter probes were returned two days past the agreed date during mid-semester exams without prior message.',
      evidencePhotos: ['/src/assets/images/item_lab_equipment_1794921135375.jpg'],
      status: 'Under Review',
      adminDecision:
        'Reviewing communication timestamps with both students; reminding both parties to update expected return dates in-app.',
      reviewedBy: 'Dr. Priya Deshmukh',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(2),
    },
  ];

  const messages: ChatMessage[] = [
    {
      id: 'msg_1',
      threadId: 'thread_usr_ananya_usr_karthik',
      itemId: 'itm_badminton_set',
      itemTitle: 'Carbon-Fiber Badminton Rackets (Pair)',
      senderId: 'usr_ananya',
      senderName: 'Ananya Sharma',
      recipientId: 'usr_karthik',
      recipientName: 'Karthik Reddy',
      body: 'Thanks for lending the rackets! I can meet near the Sports Complex at 5:30 PM tomorrow to return them.',
      createdAt: daysAgo(1),
      read: false,
    },
    {
      id: 'msg_2',
      threadId: 'thread_usr_ananya_usr_karthik',
      itemId: 'itm_badminton_set',
      itemTitle: 'Carbon-Fiber Badminton Rackets (Pair)',
      senderId: 'usr_karthik',
      senderName: 'Karthik Reddy',
      recipientId: 'usr_ananya',
      recipientName: 'Ananya Sharma',
      body: 'Sounds good Ananya! Just upload the return check note when you drop them off.',
      createdAt: daysAgo(1),
      read: true,
    },
    {
      id: 'msg_3',
      threadId: 'thread_usr_ananya_usr_meera',
      itemId: 'itm_macbook_hub',
      itemTitle: 'Aluminum USB-C Multiport Hub & Studio Wireless Headphones',
      senderId: 'usr_meera',
      senderName: 'Meera Nair',
      recipientId: 'usr_ananya',
      recipientName: 'Ananya Sharma',
      body: 'Hi Ananya, is the USB-C hub compatible with M2 MacBooks for dual projector output?',
      createdAt: daysAgo(1),
      read: false,
    },
  ];

  const activityLogs: ActivityLog[] = [
    {
      id: 'act_1',
      actorId: 'usr_ananya',
      actorName: 'Ananya Sharma',
      action: 'Published free sharing listing',
      targetType: 'Listing',
      targetTitle: 'Data Structures & Algorithms Spiral Workbook',
      createdAt: daysAgo(1),
    },
    {
      id: 'act_2',
      actorId: 'usr_karthik',
      actorName: 'Karthik Reddy',
      action: 'Handed over borrowed equipment',
      targetType: 'Borrowing',
      targetTitle: 'Carbon-Fiber Badminton Rackets (Pair)',
      createdAt: daysAgo(2),
    },
    {
      id: 'act_3',
      actorId: 'usr_admin',
      actorName: 'Dr. Priya Deshmukh',
      action: 'Moved report to Under Review',
      targetType: 'Report',
      targetTitle: 'Late Return — Embedded Systems Kit',
      createdAt: daysAgo(2),
    },
  ];

  return {
    users,
    listings,
    requests,
    borrowings,
    reports,
    messages,
    activityLogs,
  };
}

let dbCache: DatabaseSchema | null = null;

export function getDb(): DatabaseSchema {
  if (dbCache) return dbCache;
  ensureDirectories();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      dbCache = JSON.parse(raw) as DatabaseSchema;
      return dbCache;
    } catch {
      // Fallback to fresh seed if corrupted
    }
  }
  dbCache = createInitialSeed();
  saveDb(dbCache);
  return dbCache;
}

export function saveDb(db: DatabaseSchema): void {
  ensureDirectories();
  dbCache = db;
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _p, verificationCode: _v, resetCode: _r, ...pub } = user;
  return pub;
}

export function enrichListing(db: DatabaseSchema, item: ItemListing): ItemListing {
  const owner = db.users.find((u) => u.id === item.ownerId);
  const completedExchanges = db.requests.filter(
    (r) =>
      (r.ownerId === item.ownerId || r.requesterId === item.ownerId) &&
      r.status === 'Completed'
  ).length;
  return {
    ...item,
    ownerName: owner?.fullName || 'Campus Student',
    ownerDepartment: owner?.department || 'University Student',
    ownerYear: owner?.yearOfStudy || '',
    ownerVerified: owner?.verified ?? false,
    ownerAvatar: owner?.avatarUrl || '',
    ownerCompletedExchanges: completedExchanges,
  };
}

export function enrichRequest(db: DatabaseSchema, req: ExchangeRequest): ExchangeRequest {
  const item = db.listings.find((l) => l.id === req.itemId);
  const owner = db.users.find((u) => u.id === req.ownerId);
  const requester = db.users.find((u) => u.id === req.requesterId);
  return {
    ...req,
    itemTitle: item?.title || 'Campus Item',
    itemImage: item?.images?.[0] || '',
    itemExchangeType: item?.exchangeType || req.requestType,
    ownerName: owner?.fullName || 'Owner',
    requesterName: requester?.fullName || 'Student',
    requesterDepartment: requester?.department || '',
  };
}

export function enrichReport(db: DatabaseSchema, rep: DisputeReport): DisputeReport {
  const reporter = db.users.find((u) => u.id === rep.reporterId);
  const against = db.users.find((u) => u.id === rep.againstUserId);
  const item = db.listings.find((l) => l.id === rep.itemId);
  return {
    ...rep,
    reporterName: reporter?.fullName || 'Student',
    againstUserName: against?.fullName || 'Student',
    itemTitle: item?.title || 'Campus Item',
  };
}

export function logActivity(
  db: DatabaseSchema,
  actorId: string,
  actorName: string,
  action: string,
  targetType: ActivityLog['targetType'],
  targetTitle: string
): void {
  db.activityLogs.unshift({
    id: `act_${crypto.randomBytes(6).toString('hex')}`,
    actorId,
    actorName,
    action,
    targetType,
    targetTitle,
    createdAt: new Date().toISOString(),
  });
  if (db.activityLogs.length > 80) {
    db.activityLogs = db.activityLogs.slice(0, 80);
  }
}

export function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

export function isCampusEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return (
    /^[^\s@]+@[^\s@]+\.(edu|edu\.in|ac\.in)$/i.test(normalized) ||
    normalized.endsWith('@reva.edu.in')
  );
}

export function isValidRole(role: string): role is UserRole {
  return role === 'student' || role === 'admin';
}
