import express from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  AuthedRequest,
  hashPassword,
  requireAdmin,
  requireAuth,
  SESSION_COOKIE_NAME,
  signSessionToken,
  verifyPassword,
} from './server/auth';
import {
  enrichListing,
  enrichReport,
  enrichRequest,
  getDb,
  getUploadsDir,
  isCampusEmail,
  logActivity,
  makeId,
  saveDb,
  toPublicUser,
} from './server/db';
import type {
  BorrowingRecord,
  ConditionRecord,
  ExchangeRequest,
  ItemAvailability,
  ItemListing,
  ReportStatus,
  RequestStatus,
} from './src/types';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  const uploadsDir = getUploadsDir();
  app.use('/uploads', express.static(uploadsDir));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', service: 'REVA SWAP API' });
  });

  // Public stats
  app.get('/api/stats', (_req, res) => {
    const db = getDb();
    const totalStudents = db.users.filter((u) => u.role === 'student').length;
    const activeListings = db.listings.filter(
      (l) => l.availability === 'Available' || l.availability === 'Borrowed'
    ).length;
    const completedExchanges = db.requests.filter(
      (r) => r.status === 'Completed'
    ).length;
    const pendingReports = db.reports.filter(
      (r) => r.status !== 'Resolved'
    ).length;

    res.json({
      totalStudents,
      activeListings,
      completedExchanges,
      pendingReports,
      demoStats: {
        itemsShared: 1420 + db.listings.length,
        activeStudents: 860 + totalStudents,
        successfulExchanges: 940 + completedExchanges,
        moneySavedInr: 485000,
      },
    });
  });

  // ========================
  // AUTHENTICATION ROUTES
  // ========================
  app.post('/api/auth/register', (req, res) => {
    const {
      fullName,
      email,
      studentId,
      department,
      yearOfStudy,
      password,
      confirmPassword,
    } = req.body || {};

    if (
      !fullName?.trim() ||
      !email?.trim() ||
      !studentId?.trim() ||
      !department?.trim() ||
      !yearOfStudy?.trim() ||
      !password
    ) {
      res.status(400).json({ error: 'All registration fields are required.' });
      return;
    }

    if (!isCampusEmail(email)) {
      res.status(400).json({
        error:
          'Please use a valid university campus email address (e.g., name@reva.edu.in or .edu).',
      });
      return;
    }

    if (password.length < 8) {
      res
        .status(400)
        .json({ error: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match.' });
      return;
    }

    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();
    const existing = db.users.find(
      (u) =>
        u.email.toLowerCase() === normalizedEmail ||
        u.studentId.toLowerCase() === studentId.trim().toLowerCase()
    );
    if (existing) {
      res.status(409).json({
        error: 'An account with this university email or Student ID already exists.',
      });
      return;
    }

    const verificationCode = String(crypto.randomInt(100000, 999999));
    const newUser = {
      id: makeId('usr'),
      fullName: fullName.trim(),
      email: normalizedEmail,
      studentId: studentId.trim().toUpperCase(),
      department: department.trim(),
      yearOfStudy: yearOfStudy.trim(),
      role: 'student' as const,
      verified: false,
      accountStatus: 'Active' as const,
      avatarUrl: '',
      bio: '',
      preferredPickup: 'Central Campus Quad',
      profileCompleted: false,
      passwordHash: hashPassword(password),
      verificationCode,
      resetCode: null,
      createdAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    logActivity(
      db,
      newUser.id,
      newUser.fullName,
      'Registered campus account',
      'User',
      newUser.studentId
    );
    saveDb(db);

    res.status(201).json({
      message:
        'Account created. Enter the 6-digit campus verification code to activate your student access.',
      email: newUser.email,
      demoVerificationCode: verificationCode,
    });
  });

  app.post('/api/auth/verify-email', (req, res) => {
    const { email, code } = req.body || {};
    if (!email || !code) {
      res.status(400).json({ error: 'Email and verification code are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user) {
      res.status(404).json({ error: 'Student account not found.' });
      return;
    }

    if (user.verified) {
      const token = signSessionToken({ userId: user.id, role: user.role });
      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ user: toPublicUser(user), token });
      return;
    }

    if (user.verificationCode !== String(code).trim()) {
      res.status(400).json({ error: 'Invalid verification code.' });
      return;
    }

    user.verified = true;
    user.verificationCode = null;
    logActivity(
      db,
      user.id,
      user.fullName,
      'Verified university email',
      'User',
      user.email
    );
    saveDb(db);

    const token = signSessionToken({ userId: user.id, role: user.role });
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: toPublicUser(user), token });
  });

  app.post('/api/auth/resend-verification', (req, res) => {
    const { email } = req.body || {};
    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase()
    );
    if (!user) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }
    const code = String(crypto.randomInt(100000, 999999));
    user.verificationCode = code;
    saveDb(db);
    res.json({
      message: 'Verification code regenerated.',
      demoVerificationCode: code,
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ error: 'Invalid campus email or password.' });
      return;
    }

    if (user.accountStatus === 'Suspended') {
      res.status(403).json({
        error: 'This account has been suspended by a campus administrator.',
      });
      return;
    }

    if (!user.verified) {
      const code = user.verificationCode || String(crypto.randomInt(100000, 999999));
      user.verificationCode = code;
      saveDb(db);
      res.status(403).json({
        error: 'Please verify your campus email before signing in.',
        requiresVerification: true,
        email: user.email,
        demoVerificationCode: code,
      });
      return;
    }

    const token = signSessionToken({ userId: user.id, role: user.role });
    res.cookie(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ user: toPublicUser(user), token });
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE_NAME);
    res.json({ ok: true });
  });

  app.post('/api/auth/forgot-password', (req, res) => {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'Please enter your university email.' });
      return;
    }
    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user) {
      res.status(404).json({ error: 'No account found with that email.' });
      return;
    }
    const resetCode = String(crypto.randomInt(100000, 999999));
    user.resetCode = resetCode;
    saveDb(db);
    res.json({
      message: 'Password reset code generated for your campus email.',
      demoResetCode: resetCode,
    });
  });

  app.post('/api/auth/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body || {};
    if (!email || !code || !newPassword) {
      res.status(400).json({ error: 'Email, reset code, and new password are required.' });
      return;
    }
    if (String(newPassword).length < 8) {
      res.status(400).json({ error: 'Password must be at least 8 characters.' });
      return;
    }
    const db = getDb();
    const user = db.users.find(
      (u) => u.email.toLowerCase() === String(email).trim().toLowerCase()
    );
    if (!user || user.resetCode !== String(code).trim()) {
      res.status(400).json({ error: 'Invalid reset code or email.' });
      return;
    }
    user.passwordHash = hashPassword(newPassword);
    user.resetCode = null;
    saveDb(db);
    res.json({ message: 'Password updated successfully. You can now sign in.' });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.auth?.userId);
    if (!user) {
      res.status(401).json({ error: 'User not found.' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  });

  app.put('/api/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.auth?.userId);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    const {
      fullName,
      department,
      yearOfStudy,
      bio,
      preferredPickup,
      avatarUrl,
      profileCompleted,
    } = req.body || {};

    if (fullName?.trim()) user.fullName = fullName.trim();
    if (department?.trim()) user.department = department.trim();
    if (yearOfStudy?.trim()) user.yearOfStudy = yearOfStudy.trim();
    if (typeof bio === 'string') user.bio = bio.trim();
    if (typeof preferredPickup === 'string' && preferredPickup.trim()) {
      user.preferredPickup = preferredPickup.trim();
    }
    if (typeof avatarUrl === 'string') user.avatarUrl = avatarUrl;
    if (typeof profileCompleted === 'boolean') {
      user.profileCompleted = profileCompleted;
    } else {
      user.profileCompleted = true;
    }

    saveDb(db);
    res.json({ user: toPublicUser(user) });
  });

  // ========================
  // IMAGE UPLOAD ROUTE
  // ========================
  app.post('/api/uploads', requireAuth, (req: AuthedRequest, res) => {
    const { dataUrl, filename } = req.body || {};
    if (!dataUrl || typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Image data is required.' });
      return;
    }

    const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
    if (!match) {
      res.status(400).json({ error: 'Unsupported image format. Use PNG, JPG, or WEBP.' });
      return;
    }

    const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image must be smaller than 5MB.' });
      return;
    }

    const safeBase = (filename || 'upload')
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(0, 24);
    const outName = `${safeBase || 'img'}_${Date.now()}_${crypto
      .randomBytes(4)
      .toString('hex')}.${ext}`;
    const targetPath = path.join(uploadsDir, outName);
    fs.writeFileSync(targetPath, buffer);

    res.status(201).json({ url: `/uploads/${outName}` });
  });

  // ========================
  // ITEMS & MARKETPLACE
  // ========================
  app.get('/api/items', (req, res) => {
    const db = getDb();
    const {
      q,
      category,
      exchangeType,
      condition,
      availability,
      minPrice,
      maxPrice,
      ownerId,
    } = req.query;

    let items = db.listings.slice();

    if (q && typeof q === 'string' && q.trim()) {
      const needle = q.trim().toLowerCase();
      items = items.filter(
        (i) =>
          i.title.toLowerCase().includes(needle) ||
          i.description.toLowerCase().includes(needle) ||
          i.category.toLowerCase().includes(needle) ||
          i.pickupLocation.toLowerCase().includes(needle)
      );
    }

    if (category && category !== 'All') {
      items = items.filter((i) => i.category === category);
    }

    if (exchangeType && exchangeType !== 'All') {
      items = items.filter((i) => i.exchangeType === exchangeType);
    }

    if (condition && condition !== 'All') {
      items = items.filter((i) => i.condition === condition);
    }

    if (availability && availability !== 'All') {
      items = items.filter((i) => i.availability === availability);
    }

    if (ownerId && typeof ownerId === 'string') {
      items = items.filter((i) => i.ownerId === ownerId);
    }

    if (minPrice !== undefined && minPrice !== '') {
      const min = Number(minPrice);
      if (!Number.isNaN(min)) {
        items = items.filter((i) => (i.price ?? 0) >= min);
      }
    }

    if (maxPrice !== undefined && maxPrice !== '') {
      const max = Number(maxPrice);
      if (!Number.isNaN(max)) {
        items = items.filter((i) => (i.price ?? 0) <= max);
      }
    }

    items.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.json({ items: items.map((i) => enrichListing(db, i)) });
  });

  app.get('/api/items/:id', (req, res) => {
    const db = getDb();
    const item = db.listings.find((l) => l.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    res.json({ item: enrichListing(db, item) });
  });

  app.post('/api/items', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.auth?.userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const {
      title,
      category,
      description,
      images,
      condition,
      exchangeType,
      price,
      availability,
      borrowingDuration,
      pickupLocation,
    } = req.body || {};

    if (!title?.trim() || !category || !description?.trim() || !condition || !exchangeType || !pickupLocation?.trim()) {
      res.status(400).json({ error: 'Please complete all required listing fields.' });
      return;
    }

    const needsPrice = exchangeType === 'Buy' || exchangeType === 'Sell';
    const numericPrice = needsPrice ? Number(price) : exchangeType === 'Free Sharing' ? 0 : null;
    if (needsPrice && (numericPrice === null || Number.isNaN(numericPrice) || numericPrice < 0)) {
      res.status(400).json({ error: 'Please specify a valid price for Buy/Sell listings.' });
      return;
    }

    const now = new Date().toISOString();
    const item: ItemListing = {
      id: makeId('itm'),
      ownerId: user.id,
      title: title.trim(),
      category,
      description: description.trim(),
      images: Array.isArray(images) && images.length > 0
        ? images
        : ['/src/assets/images/item_textbooks_bundle_1794921132809.jpg'],
      condition,
      exchangeType,
      price: numericPrice,
      availability: (availability as ItemAvailability) || 'Available',
      borrowingDuration:
        exchangeType === 'Borrow' || exchangeType === 'Lend'
          ? String(borrowingDuration || '7 Days').trim()
          : '',
      pickupLocation: pickupLocation.trim(),
      createdAt: now,
      updatedAt: now,
    };

    db.listings.unshift(item);
    logActivity(db, user.id, user.fullName, 'Published new listing', 'Listing', item.title);
    saveDb(db);

    res.status(201).json({ item: enrichListing(db, item) });
  });

  app.put('/api/items/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const item = db.listings.find((l) => l.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    if (item.ownerId !== req.auth?.userId && req.auth?.role !== 'admin') {
      res.status(403).json({ error: 'You can only edit your own listings.' });
      return;
    }

    const {
      title,
      category,
      description,
      images,
      condition,
      exchangeType,
      price,
      availability,
      borrowingDuration,
      pickupLocation,
    } = req.body || {};

    if (title?.trim()) item.title = title.trim();
    if (category) item.category = category;
    if (description?.trim()) item.description = description.trim();
    if (Array.isArray(images) && images.length > 0) item.images = images;
    if (condition) item.condition = condition;
    if (exchangeType) item.exchangeType = exchangeType;
    if (availability) item.availability = availability;
    if (typeof borrowingDuration === 'string') {
      item.borrowingDuration = borrowingDuration.trim();
    }
    if (pickupLocation?.trim()) item.pickupLocation = pickupLocation.trim();

    if (item.exchangeType === 'Buy' || item.exchangeType === 'Sell') {
      item.price = price !== undefined && price !== null ? Number(price) : item.price ?? 0;
    } else if (item.exchangeType === 'Free Sharing') {
      item.price = 0;
    } else {
      item.price = null;
    }

    item.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json({ item: enrichListing(db, item) });
  });

  app.delete('/api/items/:id', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const idx = db.listings.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    const item = db.listings[idx];
    if (item.ownerId !== req.auth?.userId && req.auth?.role !== 'admin') {
      res.status(403).json({ error: 'You can only delete your own listings.' });
      return;
    }

    db.listings.splice(idx, 1);
    const actor = db.users.find((u) => u.id === req.auth?.userId);
    logActivity(
      db,
      req.auth?.userId || '',
      actor?.fullName || 'User',
      'Deleted listing',
      'Listing',
      item.title
    );
    saveDb(db);
    res.json({ ok: true });
  });

  // ========================
  // EXCHANGE REQUESTS
  // ========================
  app.get('/api/requests', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const list = db.requests
      .filter((r) => r.ownerId === userId || r.requesterId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((r) => enrichRequest(db, r));
    res.json({ requests: list });
  });

  app.post('/api/requests', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.auth?.userId);
    if (!user) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { itemId, proposedDuration, swapOffer, message } = req.body || {};
    const item = db.listings.find((l) => l.id === itemId);
    if (!item) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    if (item.ownerId === user.id) {
      res.status(400).json({ error: 'You cannot send a request for your own listing.' });
      return;
    }

    if (item.availability !== 'Available') {
      res.status(400).json({ error: `This item is currently ${item.availability.toLowerCase()}.` });
      return;
    }

    const existingActive = db.requests.find(
      (r) =>
        r.itemId === item.id &&
        r.requesterId === user.id &&
        (r.status === 'Pending' || r.status === 'Accepted' || r.status === 'In Progress')
    );
    if (existingActive) {
      res.status(409).json({ error: 'You already have an active request for this item.' });
      return;
    }

    const now = new Date().toISOString();
    const requestRecord: ExchangeRequest = {
      id: makeId('req'),
      itemId: item.id,
      ownerId: item.ownerId,
      requesterId: user.id,
      requestType: item.exchangeType,
      proposedDuration: String(proposedDuration || item.borrowingDuration || '').trim(),
      swapOffer: String(swapOffer || '').trim(),
      message: String(message || '').trim(),
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    };

    db.requests.unshift(requestRecord);
    logActivity(
      db,
      user.id,
      user.fullName,
      `Sent ${item.exchangeType} request`,
      'Request',
      item.title
    );
    saveDb(db);

    res.status(201).json({ request: enrichRequest(db, requestRecord) });
  });

  app.patch('/api/requests/:id/status', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const reqRecord = db.requests.find((r) => r.id === req.params.id);
    if (!reqRecord) {
      res.status(404).json({ error: 'Exchange request not found.' });
      return;
    }

    const { status } = req.body as { status: RequestStatus };
    const isOwner = reqRecord.ownerId === userId;
    const isRequester = reqRecord.requesterId === userId;

    if (!isOwner && !isRequester) {
      res.status(403).json({ error: 'Not authorized to update this request.' });
      return;
    }

    if (status === 'Accepted' || status === 'Rejected') {
      if (!isOwner) {
        res.status(403).json({ error: 'Only the listing owner can accept or reject requests.' });
        return;
      }
      if (reqRecord.status !== 'Pending') {
        res.status(400).json({ error: 'Only pending requests can be accepted or rejected.' });
        return;
      }
    } else if (status === 'Cancelled') {
      if (!isRequester) {
        res.status(403).json({ error: 'Only the requester can cancel this request.' });
        return;
      }
      if (reqRecord.status !== 'Pending' && reqRecord.status !== 'Accepted') {
        res.status(400).json({ error: 'This request can no longer be cancelled.' });
        return;
      }
    } else if (status === 'In Progress' || status === 'Completed') {
      if (!isOwner && !isRequester) {
        res.status(403).json({ error: 'Not authorized.' });
        return;
      }
    } else {
      res.status(400).json({ error: 'Invalid status transition.' });
      return;
    }

    reqRecord.status = status;
    reqRecord.updatedAt = new Date().toISOString();

    const item = db.listings.find((l) => l.id === reqRecord.itemId);
    const owner = db.users.find((u) => u.id === reqRecord.ownerId);
    const requester = db.users.find((u) => u.id === reqRecord.requesterId);

    if (item) {
      if (status === 'Accepted') {
        item.availability = 'Reserved';
        // Reject other pending requests for this same item? Leave them pending or let owner decide, keep item Reserved.
        if (
          (item.exchangeType === 'Borrow' || item.exchangeType === 'Lend') &&
          !db.borrowings.some((b) => b.requestId === reqRecord.id)
        ) {
          const startDate = new Date();
          const expected = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          const borrowing: BorrowingRecord = {
            id: makeId('bor'),
            requestId: reqRecord.id,
            itemId: item.id,
            itemTitle: item.title,
            itemImage: item.images[0] || '',
            ownerId: reqRecord.ownerId,
            ownerName: owner?.fullName || 'Owner',
            borrowerId: reqRecord.requesterId,
            borrowerName: requester?.fullName || 'Borrower',
            startDate: startDate.toISOString().slice(0, 10),
            expectedReturnDate: expected.toISOString().slice(0, 10),
            actualReturnDate: null,
            status: 'Active',
            ownerConfirmedReturn: false,
            borrowerConfirmedReturn: false,
            conditionLogs: [],
            createdAt: new Date().toISOString(),
          };
          db.borrowings.unshift(borrowing);
        }
      } else if (status === 'In Progress') {
        item.availability =
          item.exchangeType === 'Borrow' || item.exchangeType === 'Lend'
            ? 'Borrowed'
            : 'Reserved';
      } else if (status === 'Completed') {
        item.availability =
          item.exchangeType === 'Borrow' || item.exchangeType === 'Lend'
            ? 'Available'
            : 'Completed';
      } else if (status === 'Cancelled' || status === 'Rejected') {
        if (item.availability === 'Reserved') {
          item.availability = 'Available';
        }
      }
      item.updatedAt = new Date().toISOString();
    }

    const actor = db.users.find((u) => u.id === userId);
    logActivity(
      db,
      userId,
      actor?.fullName || 'Student',
      `Updated request to ${status}`,
      'Request',
      item?.title || reqRecord.id
    );
    saveDb(db);

    res.json({ request: enrichRequest(db, reqRecord) });
  });

  // ========================
  // BORROWINGS & RETURNS
  // ========================
  app.get('/api/borrowings', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const list = db.borrowings
      .filter((b) => b.ownerId === userId || b.borrowerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json({ borrowings: list });
  });

  app.post('/api/borrowings/:id/condition', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const borrowing = db.borrowings.find((b) => b.id === req.params.id);
    if (!borrowing) {
      res.status(404).json({ error: 'Borrowing record not found.' });
      return;
    }

    const isOwner = borrowing.ownerId === userId;
    const isBorrower = borrowing.borrowerId === userId;
    if (!isOwner && !isBorrower) {
      res.status(403).json({ error: 'Not authorized to update condition for this borrowing.' });
      return;
    }

    const { stage, condition, notes, photos } = req.body || {};
    if (!stage || !condition || !notes?.trim()) {
      res.status(400).json({ error: 'Stage, condition, and notes are required.' });
      return;
    }

    const user = db.users.find((u) => u.id === userId);
    const log: ConditionRecord = {
      id: makeId('cond'),
      recordedByUserId: userId,
      recordedByName: user?.fullName || 'Student',
      role: isOwner ? 'Owner' : 'Borrower',
      stage,
      condition,
      notes: notes.trim(),
      photos: Array.isArray(photos) ? photos : [],
      createdAt: new Date().toISOString(),
    };

    borrowing.conditionLogs.push(log);

    // If Before Handover logged, move linked request to In Progress
    if (stage === 'Before Handover') {
      const reqRec = db.requests.find((r) => r.id === borrowing.requestId);
      if (reqRec && reqRec.status === 'Accepted') {
        reqRec.status = 'In Progress';
        reqRec.updatedAt = new Date().toISOString();
      }
      const item = db.listings.find((l) => l.id === borrowing.itemId);
      if (item) {
        item.availability = 'Borrowed';
      }
    }

    saveDb(db);
    res.status(201).json({ borrowing });
  });

  app.post('/api/borrowings/:id/confirm-return', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const borrowing = db.borrowings.find((b) => b.id === req.params.id);
    if (!borrowing) {
      res.status(404).json({ error: 'Borrowing record not found.' });
      return;
    }

    const isOwner = borrowing.ownerId === userId;
    const isBorrower = borrowing.borrowerId === userId;
    if (!isOwner && !isBorrower) {
      res.status(403).json({ error: 'Not authorized.' });
      return;
    }

    if (isOwner) borrowing.ownerConfirmedReturn = true;
    if (isBorrower) borrowing.borrowerConfirmedReturn = true;

    if (borrowing.ownerConfirmedReturn) {
      borrowing.status = 'Returned';
      borrowing.actualReturnDate = new Date().toISOString().slice(0, 10);

      const reqRec = db.requests.find((r) => r.id === borrowing.requestId);
      if (reqRec) {
        reqRec.status = 'Completed';
        reqRec.updatedAt = new Date().toISOString();
      }

      const item = db.listings.find((l) => l.id === borrowing.itemId);
      if (item) {
        item.availability = 'Available';
        item.updatedAt = new Date().toISOString();
      }

      const actor = db.users.find((u) => u.id === userId);
      logActivity(
        db,
        userId,
        actor?.fullName || 'Student',
        'Confirmed item return',
        'Borrowing',
        borrowing.itemTitle
      );
    }

    saveDb(db);
    res.json({ borrowing });
  });

  // ========================
  // MESSAGES
  // ========================
  app.get('/api/messages', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const messages = db.messages
      .filter((m) => m.senderId === userId || m.recipientId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    res.json({ messages });
  });

  app.post('/api/messages', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const sender = db.users.find((u) => u.id === req.auth?.userId);
    if (!sender) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { recipientId, itemId, body } = req.body || {};
    if (!recipientId || !body?.trim()) {
      res.status(400).json({ error: 'Recipient and message text are required.' });
      return;
    }

    if (recipientId === sender.id) {
      res.status(400).json({ error: 'Cannot message yourself.' });
      return;
    }

    const recipient = db.users.find((u) => u.id === recipientId);
    if (!recipient) {
      res.status(404).json({ error: 'Recipient student not found.' });
      return;
    }

    const item = itemId ? db.listings.find((l) => l.id === itemId) : null;
    const sortedIds = [sender.id, recipient.id].sort();
    const threadId = `thread_${sortedIds[0]}_${sortedIds[1]}`;

    const message = {
      id: makeId('msg'),
      threadId,
      itemId: item ? item.id : null,
      itemTitle: item ? item.title : null,
      senderId: sender.id,
      senderName: sender.fullName,
      recipientId: recipient.id,
      recipientName: recipient.fullName,
      body: body.trim(),
      createdAt: new Date().toISOString(),
      read: false,
    };

    db.messages.push(message);
    saveDb(db);
    res.status(201).json({ message });
  });

  app.post('/api/messages/read', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const { threadId } = req.body || {};
    for (const m of db.messages) {
      if (m.threadId === threadId && m.recipientId === userId) {
        m.read = true;
      }
    }
    saveDb(db);
    res.json({ ok: true });
  });

  // ========================
  // DISPUTE & DAMAGE REPORTS
  // ========================
  app.get('/api/reports', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const userId = req.auth!.userId;
    const isAdmin = req.auth?.role === 'admin';
    const reports = db.reports
      .filter((r) => isAdmin || r.reporterId === userId || r.againstUserId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .map((r) => enrichReport(db, r));
    res.json({ reports });
  });

  app.post('/api/reports', requireAuth, (req: AuthedRequest, res) => {
    const db = getDb();
    const reporter = db.users.find((u) => u.id === req.auth?.userId);
    if (!reporter) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    const { itemId, againstUserId, borrowingId, issueType, description, evidencePhotos } =
      req.body || {};
    if (!itemId || !issueType || !description?.trim()) {
      res.status(400).json({ error: 'Item, issue type, and description are required.' });
      return;
    }

    const item = db.listings.find((l) => l.id === itemId);
    const targetUserId = againstUserId || item?.ownerId || '';
    if (!targetUserId) {
      res.status(400).json({ error: 'Unable to identify counterpart user for this report.' });
      return;
    }

    const now = new Date().toISOString();
    const report = {
      id: makeId('rep'),
      reporterId: reporter.id,
      againstUserId: targetUserId,
      itemId,
      borrowingId: borrowingId || null,
      issueType,
      description: description.trim(),
      evidencePhotos: Array.isArray(evidencePhotos) ? evidencePhotos : [],
      status: 'Submitted' as ReportStatus,
      adminDecision: '',
      reviewedBy: null,
      createdAt: now,
      updatedAt: now,
    };

    if (borrowingId) {
      const bor = db.borrowings.find((b) => b.id === borrowingId);
      if (bor) bor.status = 'Disputed';
    }

    db.reports.unshift(report);
    logActivity(
      db,
      reporter.id,
      reporter.fullName,
      `Submitted ${issueType} report`,
      'Report',
      item?.title || itemId
    );
    saveDb(db);
    res.status(201).json({ report: enrichReport(db, report) });
  });

  // ========================
  // USER PROFILE SUMMARY
  // ========================
  app.get('/api/users/:id/summary', requireAuth, (req, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'Student not found.' });
      return;
    }

    const listedItems = db.listings
      .filter((l) => l.ownerId === user.id)
      .map((l) => enrichListing(db, l));
    const exchangeHistory = db.requests
      .filter(
        (r) =>
          (r.ownerId === user.id || r.requesterId === user.id) &&
          (r.status === 'Completed' || r.status === 'Cancelled' || r.status === 'Rejected')
      )
      .map((r) => enrichRequest(db, r));
    const completedCount = db.requests.filter(
      (r) => (r.ownerId === user.id || r.requesterId === user.id) && r.status === 'Completed'
    ).length;

    res.json({
      user: toPublicUser(user),
      listedItems,
      exchangeHistory,
      completedCount,
    });
  });

  // ========================
  // ADMIN CONSOLE ROUTES
  // ========================
  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const db = getDb();
    const students = db.users.map(toPublicUser);
    const listings = db.listings.map((l) => enrichListing(db, l));
    const reports = db.reports.map((r) => enrichReport(db, r));
    const requests = db.requests.map((r) => enrichRequest(db, r));

    res.json({
      metrics: {
        totalStudents: db.users.filter((u) => u.role === 'student').length,
        activeListings: db.listings.filter(
          (l) => l.availability === 'Available' || l.availability === 'Borrowed'
        ).length,
        totalExchanges: db.requests.filter((r) => r.status === 'Completed').length,
        pendingReports: db.reports.filter((r) => r.status !== 'Resolved').length,
      },
      students,
      listings,
      reports,
      requests,
      activityLogs: db.activityLogs,
    });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const user = db.users.find((u) => u.id === req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }
    if (user.id === req.auth?.userId) {
      res.status(400).json({ error: 'Cannot suspend your own administrator account.' });
      return;
    }

    const { accountStatus, verified } = req.body || {};
    if (accountStatus === 'Active' || accountStatus === 'Suspended') {
      user.accountStatus = accountStatus;
    }
    if (typeof verified === 'boolean') {
      user.verified = verified;
    }

    const admin = db.users.find((u) => u.id === req.auth?.userId);
    logActivity(
      db,
      req.auth!.userId,
      admin?.fullName || 'Admin',
      `Updated account (${user.accountStatus})`,
      'User',
      user.fullName
    );
    saveDb(db);
    res.json({ user: toPublicUser(user) });
  });

  app.delete('/api/admin/listings/:id', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const idx = db.listings.findIndex((l) => l.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }
    const [removed] = db.listings.splice(idx, 1);
    const admin = db.users.find((u) => u.id === req.auth?.userId);
    logActivity(
      db,
      req.auth!.userId,
      admin?.fullName || 'Admin',
      'Removed listing during review',
      'Listing',
      removed.title
    );
    saveDb(db);
    res.json({ ok: true });
  });

  app.patch('/api/admin/reports/:id', requireAdmin, (req: AuthedRequest, res) => {
    const db = getDb();
    const report = db.reports.find((r) => r.id === req.params.id);
    if (!report) {
      res.status(404).json({ error: 'Report not found.' });
      return;
    }

    const { status, adminDecision } = req.body || {};
    if (status === 'Submitted' || status === 'Under Review' || status === 'Resolved') {
      report.status = status;
    }
    if (typeof adminDecision === 'string') {
      report.adminDecision = adminDecision.trim();
    }

    const admin = db.users.find((u) => u.id === req.auth?.userId);
    report.reviewedBy = admin?.fullName || 'Campus Administrator';
    report.updatedAt = new Date().toISOString();

    logActivity(
      db,
      req.auth!.userId,
      admin?.fullName || 'Admin',
      `Set report status to ${report.status}`,
      'Report',
      report.issueType
    );
    saveDb(db);
    res.json({ report: enrichReport(db, report) });
  });

  // ========================
  // VITE / STATIC SERVING
  // ========================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REVA SWAP server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
