import type {
  ExchangeType,
  ItemCategory,
  ItemCondition,
} from './types';

export const ITEM_CATEGORIES: ItemCategory[] = [
  'Books & Notes',
  'Electronics',
  'Lab Equipment',
  'Sports Equipment',
  'Stationery',
  'Hostel Essentials',
  'Other Items',
];

export const ITEM_CONDITIONS: ItemCondition[] = [
  'New',
  'Like New',
  'Good',
  'Fair',
];

export const EXCHANGE_TYPES: ExchangeType[] = [
  'Borrow',
  'Lend',
  'Buy',
  'Sell',
  'Swap',
  'Free Sharing',
];

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Architecture',
  'Biotechnology',
  'Business & Management',
  'Applied Sciences',
];

export const YEARS_OF_STUDY = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  '5th Year (Arch)',
  'Postgraduate',
];

export const PICKUP_LOCATIONS = [
  'Central Library Steps',
  'Science Block Atrium',
  'CV Raman Block Lobby',
  'Design Studio Courtyard',
  'Sports Complex Entrance',
  'Hostel Block B Reception',
  'Main Canteen Patio',
  'Mechanical Workshop Gate',
];

export function formatPrice(price: number | null | undefined, exchangeType: ExchangeType): string {
  if (exchangeType === 'Free Sharing' || price === 0) return 'Free';
  if ((exchangeType === 'Buy' || exchangeType === 'Sell') && price !== null && price !== undefined) {
    return `₹${price.toLocaleString('en-IN')}`;
  }
  return exchangeType;
}

export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
