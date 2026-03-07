/**
 * Dealership partners: brands we have dealership for.
 * Source: src/data/partners.json (add new logo files in public/partners/ and add an entry there).
 */

import partnersData from "./partners.json";

export type DealershipPartner = {
  name: string;
  logo: string;
  url?: string;
};

const PARTNER_LOGO_BASE = "/partners";

function logoPath(filename: string): string {
  return `${PARTNER_LOGO_BASE}/${encodeURIComponent(filename)}`;
}

type PartnerEntry = { name: string; logoFile: string };

export const DEALERSHIP_PARTNERS: DealershipPartner[] = (partnersData as PartnerEntry[]).map(
  (p) => ({ name: p.name, logo: logoPath(p.logoFile) })
);

/** All brand names from the partners list (for use in admin, filters, seed-brands, etc.) */
export const PARTNER_BRAND_NAMES: string[] = DEALERSHIP_PARTNERS.map((p) => p.name);
