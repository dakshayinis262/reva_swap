import React, { useEffect, useState } from 'react';
import { ArrowLeft, ImagePlus, Trash2 } from 'lucide-react';
import { api, uploadImageFile } from '../api/client';
import { SafeImage } from '../components/SafeImage';
import {
  EXCHANGE_TYPES,
  ITEM_CATEGORIES,
  ITEM_CONDITIONS,
  PICKUP_LOCATIONS,
} from '../constants';
import { useAuth } from '../context/AuthContext';
import type {
  ExchangeType,
  ItemAvailability,
  ItemCategory,
  ItemCondition,
  ItemListing,
} from '../types';

interface AddEditListingPageProps {
  editItem?: ItemListing | null;
  onCancel: () => void;
  onSaved: () => void;
}

export function AddEditListingPage({
  editItem,
  onCancel,
  onSaved,
}: AddEditListingPageProps) {
  const { notify } = useAuth();
  const [title, setTitle] = useState(editItem?.title || '');
  const [category, setCategory] = useState<ItemCategory>(
    editItem?.category || 'Books & Notes'
  );
  const [description, setDescription] = useState(editItem?.description || '');
  const [condition, setCondition] = useState<ItemCondition>(
    editItem?.condition || 'Like New'
  );
  const [exchangeType, setExchangeType] = useState<ExchangeType>(
    editItem?.exchangeType || 'Borrow'
  );
  const [price, setPrice] = useState(
    editItem?.price !== null && editItem?.price !== undefined
      ? String(editItem.price)
      : ''
  );
  const [availability, setAvailability] = useState<ItemAvailability>(
    editItem?.availability || 'Available'
  );
  const [borrowingDuration, setBorrowingDuration] = useState(
    editItem?.borrowingDuration || '7 Days'
  );
  const [pickupLocation, setPickupLocation] = useState(
    editItem?.pickupLocation || PICKUP_LOCATIONS[0]
  );
  const [images, setImages] = useState<string[]>(editItem?.images || []);

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editItem) {
      setTitle(editItem.title);
      setCategory(editItem.category);
      setDescription(editItem.description);
      setCondition(editItem.condition);
      setExchangeType(editItem.exchangeType);
      setPrice(
        editItem.price !== null && editItem.price !== undefined
          ? String(editItem.price)
          : ''
      );
      setAvailability(editItem.availability);
      setBorrowingDuration(editItem.borrowingDuration || '7 Days');
      setPickupLocation(editItem.pickupLocation);
      setImages(editItem.images || []);
    }
  }, [editItem]);

  const showPriceField = exchangeType === 'Buy' || exchangeType === 'Sell';
  const showBorrowField = exchangeType === 'Borrow' || exchangeType === 'Lend';

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files.slice(0, 4)) {
        const url = await uploadImageFile(file);
        uploaded.push(url);
      }
      setImages((prev) => [...prev, ...uploaded].slice(0, 5));
      notify('Photos uploaded and previewed.', 'success');
    } catch (err: unknown) {
      notify(err instanceof Error ? err.message : 'Photo upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !description.trim() || !pickupLocation.trim()) {
      setError('Please fill in Item Name, Description, and Pickup Location.');
      return;
    }

    if (showPriceField && (!price || Number(price) < 0 || Number.isNaN(Number(price)))) {
      setError('Please enter a valid price in INR for Buy or Sell listings.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        description: description.trim(),
        condition,
        exchangeType,
        price: showPriceField ? Number(price) : exchangeType === 'Free Sharing' ? 0 : null,
        availability,
        borrowingDuration: showBorrowField ? borrowingDuration.trim() : '',
        pickupLocation: pickupLocation.trim(),
        images:
          images.length > 0
            ? images
            : ['/src/assets/images/item_textbooks_bundle_1794921132809.jpg'],
      };

      if (editItem) {
        await api.updateItem(editItem.id, payload);
        notify('Listing updated successfully!', 'success');
      } else {
        await api.createItem(payload);
        notify('Listing published to campus marketplace!', 'success');
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save listing.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-[#172554] mb-4 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold text-[#172554] mb-1">
          {editItem ? 'Edit Item Listing' : 'Add Item Listing'}
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Share clear details and photos so fellow students can discover and request your item.
        </p>

        {error && (
          <div
            role="alert"
            className="mb-5 p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Item Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Casio fx-991EX Scientific Calculator"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Category <span className="text-rose-600">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              >
                {ITEM_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Item Condition <span className="text-rose-600">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as ItemCondition)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              >
                {ITEM_CONDITIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Exchange Type <span className="text-rose-600">*</span>
              </label>
              <select
                value={exchangeType}
                onChange={(e) => setExchangeType(e.target.value as ExchangeType)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              >
                {EXCHANGE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Availability
              </label>
              <select
                value={availability}
                onChange={(e) =>
                  setAvailability(e.target.value as ItemAvailability)
                }
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              >
                <option value="Available">Available</option>
                <option value="Reserved">Reserved</option>
                <option value="Borrowed">Borrowed</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {showPriceField && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Price (₹) <span className="text-rose-600">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 500"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7] tabular-nums"
              />
            </div>
          )}

          {showBorrowField && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Borrowing Duration
              </label>
              <input
                type="text"
                value={borrowingDuration}
                onChange={(e) => setBorrowingDuration(e.target.value)}
                placeholder="e.g., 7 Days, 2 Weeks, 1 Semester"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Campus Pickup Location <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              list="campus-pickup-suggestions"
              required
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g., Central Library Steps"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
            />
            <datalist id="campus-pickup-suggestions">
              {PICKUP_LOCATIONS.map((loc) => (
                <option key={loc} value={loc} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Include model/edition, accessories included, and any usage notes..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#6D5CE7]"
            />
          </div>

          {/* Photo Upload & Preview */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Upload Photos (up to 5)
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {images.map((url, idx) => (
                <div
                  key={`${url}_${idx}`}
                  className="relative w-28 aspect-[4/3] rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group"
                >
                  <SafeImage
                    src={url}
                    alt={`Uploaded item preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    aria-label="Remove photo"
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 text-rose-600 hover:bg-rose-600 hover:text-white shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {images.length < 5 && (
                <label className="w-28 aspect-[4/3] rounded-lg border border-dashed border-slate-300 hover:border-[#6D5CE7] bg-slate-50 flex flex-col items-center justify-center gap-1 text-xs font-medium text-slate-600 cursor-pointer transition-colors">
                  <ImagePlus className="w-5 h-5 text-[#6D5CE7]" />
                  <span>{uploading ? 'Uploading...' : 'Add Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={uploading}
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              If no photo is uploaded, a clean category studio placeholder is attached.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-[#172554] hover:bg-[#1e3270] disabled:opacity-60 rounded-lg transition-colors cursor-pointer"
            >
              {submitting
                ? 'Saving...'
                : editItem
                  ? 'Save Changes'
                  : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
