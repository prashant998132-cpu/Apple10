import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

// Static fallback prices (updated April 2026)
const STATIC_PRICES: Record<string, { petrol: number; diesel: number; cng?: number }> = {
  delhi:      { petrol: 94.77, diesel: 87.67, cng: 74.09 },
  mumbai:     { petrol: 103.44, diesel: 89.97, cng: 66.0 },
  bangalore:  { petrol: 102.86, diesel: 88.94 },
  chennai:    { petrol: 100.75, diesel: 92.34 },
  kolkata:    { petrol: 104.95, diesel: 91.76 },
  hyderabad:  { petrol: 107.41, diesel: 95.65 },
  pune:       { petrol: 103.62, diesel: 90.12 },
  ahmedabad:  { petrol: 96.63, diesel: 92.38, cng: 75.0 },
  jaipur:     { petrol: 104.88, diesel: 90.30 },
  lucknow:    { petrol: 94.68, diesel: 87.56 },
  bhopal:     { petrol: 108.65, diesel: 93.88 },
  patna:      { petrol: 107.36, diesel: 94.06 },
  chandigarh: { petrol: 94.23, diesel: 82.38 },
  indore:     { petrol: 108.69, diesel: 93.92 },
  nagpur:     { petrol: 103.46, diesel: 89.99 },
  surat:      { petrol: 96.47, diesel: 92.21 },
  vizag:      { petrol: 109.60, diesel: 97.39 },
  kochi:      { petrol: 102.26, diesel: 91.68 },
  maihar:     { petrol: 108.65, diesel: 93.88 },
  satna:      { petrol: 108.65, diesel: 93.88 },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = (searchParams.get('city') || 'delhi').toLowerCase().trim();

  // Try to find exact match or fuzzy match
  const cityKey = Object.keys(STATIC_PRICES).find(k => city.includes(k) || k.includes(city)) || 'delhi';
  const prices = STATIC_PRICES[cityKey];

  // Try live source: mypetrolprice.com via fetch (scraping blocked, use static)
  // Always return static with disclaimer
  return NextResponse.json({
    city: cityKey.charAt(0).toUpperCase() + cityKey.slice(1),
    petrol: prices.petrol,
    diesel: prices.diesel,
    cng: prices.cng || null,
    currency: 'INR',
    unit: 'per litre',
    note: 'Approximate prices — minor local variation possible',
    updated: 'April 2026',
    allCities: Object.entries(STATIC_PRICES).map(([k, v]) => ({
      city: k.charAt(0).toUpperCase() + k.slice(1),
      petrol: v.petrol,
      diesel: v.diesel,
    })),
  });
}
