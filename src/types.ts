/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface IPTVChannel {
  id: string;
  name: string;
  logo: string | null;
  countries: string[];
  languages: string[];
  categories: string[];
  streamUrl: string | null;
  isHttps: boolean;
  status: string;
  countryNames: string[];
  languageNames: string[];
  categoryNames: string[];
  // Campos extraídos de la API de iptv-org
  nativeName?: string | null;
  network?: string | null;
  owners?: string[];
  subdivision?: string | null;
  subdivisionName?: string | null;
  city?: string | null;
  isNsfw?: boolean;
  launched?: string | null;
  website?: string | null;
  broadcastArea?: string[];
}

export interface FilterOption {
  id: string;
  name: string;
  count: number;
  countries?: string[];
}

export interface FiltersResponse {
  categories: FilterOption[];
  countries: FilterOption[];
  languages: FilterOption[];
  regions: FilterOption[];
}

export interface PaginatedChannels {
  channels: IPTVChannel[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
