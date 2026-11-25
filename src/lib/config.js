// Single source of truth for McB Rentals configuration.
// Fixes operating hours mismatch and broken homepage product IDs.

export const MCB_CONFIG = {
  brandName: 'McB Rentals',
  tagline: "Accra's #1 Equipment Rental House",
  address: 'Nuumo Dantu Link, Alaji – Nii Boi Man 227, Ga Central, Greater Accra',
  hours: 'Every day · 7:00am – 9:00pm',
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '233205879371',
  currency: 'GHS',
  lateFeeDailyRatePct: 0.1,
  supabaseUrl:
    import.meta.env.VITE_SUPABASE_URL || 'https://buobpvshmthmxafecqrb.supabase.co',
  supabaseAnonKey:
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    'sb_publishable_qZPMbIsflKVn9gqq_qF3gA_-eicAY9T',
  featuredProductIds: [
    { label: 'Sony FX3', id: 'inv-mr5isr5b-79l7u' },
    { label: 'Canon EOS R5', id: 'inv-mr5gqu9s-i2jxy' },
    { label: 'Canon EF 70-200mm', id: 'inv-ms9aft9o-mb3j8' },
    { label: 'Aputure LS C300d II', id: 'inv-mr5ou03n-4kquf' },
  ],
  paymentModes: [
    { id: 'momo', label: 'Mobile Money (MoMo)' },
    { id: 'cash', label: 'Physical Cash' },
    { id: 'hubtel', label: 'Hubtel' },
  ],
};
