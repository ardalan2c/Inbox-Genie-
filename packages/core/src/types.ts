export type ID = string;

export type Tenant = {
  id: ID;
  name: string;
  timezone: string;
};

export type BusinessProfile = {
  name: string;
  industry: 'real-estate' | 'salon' | 'clinic' | 'other';
  phone?: string;
  bookingLink?: string;
  services?: Array<{ id: ID; name: string; durationMin: number; price?: number }>;
  hours?: Record<string, { open: string; close: string; closed?: boolean }>;
  faq?: Array<{ q: string; a: string }>;
  policies?: string[];
};

export type AvailabilitySlot = {
  start: string;
  end: string;
};

