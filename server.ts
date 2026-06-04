/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { IPTVChannel, FiltersResponse, PaginatedChannels } from "./src/types";

// --- DICCIONARIOS DE TRADUCCIÓN AL ESPAÑOL ---

const SPANISH_CATEGORIES: Record<string, string> = {
  "news": "Noticias",
  "sports": "Deportes",
  "movies": "Cine / Películas",
  "music": "Música",
  "entertainment": "Entretenimiento",
  "kids": "Infantil / Niños",
  "education": "Educativo",
  "documentary": "Documentales",
  "animation": "Animación",
  "general": "Generalista",
  "religious": "Religioso / Fe",
  "culture": "Cultura / Arte",
  "business": "Economía / Negocios",
  "comedy": "Comedia",
  "series": "Series / Novelas",
  "shopping": "Televenta / Compras",
  "lifestyle": "Estilo de Vida",
  "legislative": "Gubernamental / Legislativo",
  "science": "Ciencia / Tecnología",
  "travel": "Viajes / Turismo",
  "weather": "Tiempo / Clima",
  "auto": "Motor / Autos",
  "classic": "Clásicos",
  "outdoor": "Naturaleza / Aire Libre",
  "cooking": "Cocina / Gastronomía",
  "family": "Familiar",
  "xxx": "Adultos (18+)"
};

const SPANISH_LANGUAGES: Record<string, string> = {
  "spanish": "Español",
  "english": "Inglés",
  "french": "Francés",
  "german": "Alemán",
  "portuguese": "Portugués",
  "italian": "Italiano",
  "russian": "Ruso",
  "chinese": "Chino",
  "japanese": "Japonés",
  "arabic": "Árabe",
  "hindi": "Hindi",
  "korean": "Coreano",
  "turkish": "Turco",
  "dutch": "Neerlandés",
  "polish": "Polaco",
  "catalan": "Catalán",
  "galician": "Gallego",
  "basque": "Euskera / Vasco",
  "swedish": "Sueco",
  "norwegian": "Noruego",
  "danish": "Danés",
  "finnish": "Finlandés",
  "greek": "Griego",
  "hebrew": "Hebreo",
  "vietnamese": "Vietnamita",
  "thai": "Tailandés",
  "indonesian": "Indonesio",
  "ukrainian": "Ucraniano",
  "romanian": "Rumano",
  "hungarian": "Húngaro",
  "czech": "Checo",
  "slovak": "Eslovaco",
  "bulgarian": "Búlgaro",
  "croatian": "Croata",
  "serbian": "Serbio",
  "slovenian": "Esloveno",
  "persian": "Persa",
  "bengali": "Bengalí",
  "urdu": "Urdu",
  "tamil": "Tamil",
  "punjabi": "Panyabí",
  "malay": "Malayo",
  "tagalog": "Tagalo",
  "latin": "Latín",
  "esperanto": "Esperanto",
  
  // Códigos ISO para respaldo rápido
  "spa": "Español",
  "eng": "Inglés",
  "fra": "Francés",
  "deu": "Alemán",
  "por": "Portugués",
  "ita": "Italiano",
  "rus": "Ruso",
  "zho": "Chino",
  "jpn": "Japonés",
  "ara": "Árabe",
  "hin": "Hindi",
  "kor": "Coreano",
  "tur": "Turco",
  "nld": "Neerlandés",
  "pol": "Polaco",
  "cat": "Catalán",
  "glg": "Gallego",
  "eus": "Euskera"
};

const SPANISH_COUNTRIES: Record<string, string> = {
  "spain": "España",
  "germany": "Alemania",
  "france": "Francia",
  "united states": "Estados Unidos",
  "united kingdom": "Reino Unido",
  "italy": "Italia",
  "portugal": "Portugal",
  "brazil": "Brasil",
  "mexico": "México",
  "argentina": "Argentina",
  "colombia": "Colombia",
  "venezuela": "Venezuela",
  "chile": "Chile",
  "peru": "Perú",
  "ecuador": "Ecuador",
  "bolivia": "Bolivia",
  "paraguay": "Paraguay",
  "uruguay": "Uruguay",
  "panama": "Panamá",
  "costa rica": "Costa Rica",
  "honduras": "Honduras",
  "nicaragua": "Nicaragua",
  "el salvador": "El Salvador",
  "guatemala": "Guatemala",
  "cuba": "Cuba",
  "dominican republic": "República Dominicana",
  "puerto rico": "Puerto Rico",
  "canada": "Canadá",
  "japan": "Japón",
  "china": "China",
  "south korea": "Corea del Sur",
  "russia": "Rusia",
  "india": "India",
  "australia": "Australia",
  "belgium": "Bélgica",
  "switzerland": "Suiza",
  "austria": "Austria",
  "netherlands": "Países Bajos",
  "sweden": "Suecia",
  "norway": "Noruega",
  "denmark": "Dinamarca",
  "finland": "Finlandia",
  "greece": "Grecia",
  "turkey": "Turquía",
  "ukraine": "Ucrania",
  "ireland": "Irlanda",
  "saudi arabia": "Arabia Saudita",
  "south africa": "Sudáfrica",
  "egypt": "Egipto",
  "morocco": "Marruecos",
  "israel": "Israel",
  "new zealand": "Nueva Zelanda",
  "singapore": "Singapur",
  "thailand": "Tailandia",
  "vietnam": "Vietnam",
  "andorra": "Andorra",
  "vatican city": "Ciudad del Vaticano",
  "romania": "Rumanía",
  "hungary": "Hungría",
  "czechia": "República Checa",
  "czech republic": "República Checa",
  "slovakia": "Eslovaquia",
  "bulgaria": "Bulgaria",
  "croatia": "Croacia",
  "serbia": "Serbia",
  "philippines": "Filipinas",
  
  "ES": "España",
  "DE": "Alemania",
  "FR": "Francia",
  "US": "Estados Unidos",
  "GB": "Reino Unido",
  "IT": "Italia",
  "PT": "Portugal",
  "BR": "Brasil",
  "MX": "México",
  "AR": "Argentina",
  "CO": "Colombia",
  "VE": "Venezuela",
  "CL": "Chile",
  "PE": "Perú",
  "EC": "Ecuador",
  "BO": "Bolivia",
  "PY": "Paraguay",
  "UY": "Uruguay",
  "PA": "Panamá",
  "CR": "Costa Rica",
  "HN": "Honduras",
  "NI": "Nicaragua",
  "SV": "El Salvador",
  "GT": "Guatemala",
  "CU": "Cuba",
  "DO": "República Dominicana",
  "PR": "Puerto Rico",
  "CA": "Canadá",
  "JP": "Japón",
  "CN": "China",
  "KR": "Corea del Sur",
  "RU": "Rusia",
  "IN": "India",
  "AU": "Australia",
  "BE": "Bélgica",
  "CH": "Suiza",
  "AT": "Austria",
  "NL": "Países Bajos",
  "SE": "Suecia",
  "NO": "Noruega",
  "DK": "Dinamarca",
  "FI": "Finlandia",
  "GR": "Grecia",
  "TR": "Turquía",
  "UA": "Ucrania",
  "IE": "Irlanda",
  "SA": "Arabia Saudita",
  "ZA": "Sudáfrica",
  "EG": "Egipto",
  "MA": "Marruecos",
  "IL": "Israel",
  "NZ": "Nueva Zelanda",
  "SG": "Singapur",
  "TH": "Tailandia",
  "VN": "Vietnam",
  "AD": "Andorra",
  "VA": "Ciudad del Vaticano",
  "RO": "Rumanía",
  "HU": "Hungría",
  "CZ": "Chequia",
  "SK": "Eslovaquia",
  "BG": "Bulgaria",
  "HR": "Croacia",
  "RS": "Serbia",
  "PH": "Filipinas"
};

const SPANISH_REGIONS: Record<string, string> = {
  "AFR": "África",
  "AMER": "América (General)",
  "APAC": "Asia-Pacífico",
  "ARAB": "Mundo Árabe",
  "ASEAN": "Sudeste Asiático (ASEAN)",
  "ASIA": "Asia",
  "BALKAN": "Balcanes",
  "BENELUX": "Benelux",
  "CARIB": "Caribe",
  "CAS": "Asia Central",
  "CEE": "Europa Central y Oriental",
  "CENAMER": "Centroamérica",
  "CEU": "Europa Central",
  "CIS": "Comunidad de Estados Independientes (CIS)",
  "EAF": "África Oriental",
  "EAS": "Asia Oriental",
  "EMEA": "Europa, Oriente Medio y África",
  "EU": "Unión Europea",
  "EUR": "Europa",
  "GCC": "Consejo de Cooperación del Golfo (GCC)",
  "HISPAM": "Hispanoamérica",
  "LAC": "América Latina y el Caribe",
  "LATAM": "América Latina",
  "MAGHREB": "Magreb",
  "MENA": "Oriente Medio y Norte de África (MENA)",
  "MIDEAST": "Oriente Medio",
  "NAM": "Norteamérica",
  "NEU": "Europa del Norte",
  "NORD": "Islas Nórdicas / Nórdicos",
  "OCE": "Oceanía",
  "SAF": "África Austral / del Sur",
  "SAS": "Asia del Sur",
  "SEA": "Sudeste de Asia",
  "SER": "Europa del Sur",
  "SOUTHAM": "Sudamérica",
  "SSA": "África Subsahariana",
  "UN": "Naciones Unidas",
  "WAF": "África Occidental",
  "WAS": "Asia Occidental",
  "WER": "Europa Occidental",
  "WW": "Mundial / Todo el mundo"
};

function translateCategory(name: string): string {
  const clean = name.toLowerCase().trim();
  if (SPANISH_CATEGORIES[clean]) {
    return SPANISH_CATEGORIES[clean];
  }
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function translateLanguage(name: string): string {
  const clean = name.toLowerCase().trim();
  if (SPANISH_LANGUAGES[clean]) {
    return SPANISH_LANGUAGES[clean];
  }
  let translated = name;
  translated = translated.replace(/\bEnglish\b/g, "Inglés");
  translated = translated.replace(/\bSpanish\b/g, "Español");
  translated = translated.replace(/\bFrench\b/g, "Francés");
  translated = translated.replace(/\bGerman\b/g, "Alemán");
  translated = translated.replace(/\bPortuguese\b/g, "Portugués");
  return translated;
}

function translateCountry(name: string, code?: string): string {
  if (code) {
    const cleanCode = code.toUpperCase().trim();
    if (SPANISH_COUNTRIES[cleanCode]) {
      return SPANISH_COUNTRIES[cleanCode];
    }
  }
  const cleanName = name.toLowerCase().trim();
  if (SPANISH_COUNTRIES[cleanName]) {
    return SPANISH_COUNTRIES[cleanName];
  }
  if (name.includes(",")) {
    const parts = name.split(",").map(p => p.trim());
    if (parts.length > 1) {
      return `${parts[1]} ${parts[0]}`;
    }
  }
  return name;
}

// Default/Fallback high-quality public HTTPS IPTV streams
const DEFAULT_CHANNELS: IPTVChannel[] = [
  {
    id: "RTVE.es",
    name: "RTVE Canal 24 Horas (España)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e4/RTVE_24h_logo.png",
    countries: ["ES"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://rtvev4-live.akamaized.net/rtvesec/24h/24h_main_3.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["España"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "Canal26.ar",
    name: "Canal 26 (Argentina)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/Canal_26_de_Argentina.png",
    countries: ["AR"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://live-canal26.telecentro.com.ar/cl26/cl26/playlist.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Argentina"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "TeleSUR.ve",
    name: "TeleSUR (Venezuela/Latinoamérica)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ce/Telesur_logo.png",
    countries: ["VE"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://telesur.ssl.cdn.cra.com.ar/telesur/smil:telesur.smil/playlist.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Venezuela"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "EuronewsES.fr",
    name: "Euronews Español (Europa)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Euronews_logo_2016.svg/512px-Euronews_logo_2016.svg.png",
    countries: ["FR"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://euronews-es.live.net.ar/live/index.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Francia"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "France24ES.fr",
    name: "France 24 Español",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/France_24_logo.svg",
    countries: ["FR"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://static.france24.com/live/F24_ES_LO_HLS/live_web.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Francia"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "DW_ES.de",
    name: "Deutsche Welle Español (Alemania)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Deutsche_Welle_logo_2012.svg",
    countries: ["DE"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://dwstream4-lh.akamaihd.net/i/dwstream4_live@124434/master.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Alemania"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "Milenio.mx",
    name: "Milenio TV (México)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/0/05/Milenio_Televisi%C3%B3n_Logo.jpg",
    countries: ["MX"],
    languages: ["spa"],
    categories: ["news"],
    streamUrl: "https://milenio-live.akamaized.net/hls/live/2034089/milenio/master.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["México"],
    languageNames: ["Español"],
    categoryNames: ["Noticias"]
  },
  {
    id: "RedBullTV.at",
    name: "Red Bull TV",
    logo: "https://upload.wikimedia.org/wikipedia/commons/f/fb/Red_Bull_TV_logo.svg",
    countries: ["AT"],
    languages: ["eng"],
    categories: ["sports"],
    streamUrl: "https://rbmn-live.akamaized.net/hls/live/590964/sports/sports_1/master.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Austria"],
    languageNames: ["Inglés"],
    categoryNames: ["Deportes"]
  },
  {
    id: "NASA_TV.us",
    name: "NASA TV HD (EEUU)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e5/NASA_logo.svg",
    countries: ["US"],
    languages: ["eng"],
    categories: ["science"],
    streamUrl: "https://ntv1.nasatv.net/hls/ntv1_1080.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Estados Unidos"],
    languageNames: ["Inglés"],
    categoryNames: ["Ciencia / Tecnología"]
  },
  {
    id: "Sintel.demo",
    name: "Sintel HD (Demo Cine)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Sintel_poster.jpg",
    countries: ["NL"],
    languages: ["eng"],
    categories: ["movies"],
    streamUrl: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Países Bajos"],
    languageNames: ["Inglés"],
    categoryNames: ["Cine / Películas"]
  },
  {
    id: "BigBuckBunny.demo",
    name: "Big Buck Bunny HLS (Demo Animación)",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/424px-Big_buck_bunny_poster_big.jpg",
    countries: ["NL"],
    languages: ["eng"],
    categories: ["animation"],
    streamUrl: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8",
    isHttps: true,
    status: "online",
    countryNames: ["Países Bajos"],
    languageNames: ["Inglés"],
    categoryNames: ["Animación"]
  }
];

// App Server Memory Cache
let isDataLoaded = false;
let loadingProgress = "Iniciando servidor...";
let iptvChannels: IPTVChannel[] = [...DEFAULT_CHANNELS];

interface RegionData {
  code: string;
  name: string;
  countries: string[];
}
let regionsList: RegionData[] = [];

let cachedFilters: FiltersResponse = {
  categories: [],
  countries: [],
  languages: [],
  regions: []
};

// Start background fetching of the massive iptv-org catalogs
async function loadIPTVData() {
  console.log("[IPTV Loader] Iniciando descarga de catálogos públicos de iptv-org...");
  try {
    loadingProgress = "Descargando streams en línea de iptv-org...";
    
    // Fetch streams (the URL sources)
    const streamsRes = await fetch("https://iptv-org.github.io/api/streams.json");
    if (!streamsRes.ok) throw new Error(`Fallo al descargar streams (${streamsRes.status})`);
    
    // We get streams and convert them to a fast lookup map: channel_id -> stream_url
    const streamsData = await streamsRes.json() as any[];
    console.log(`[IPTV Loader] Descargados ${streamsData.length} streams de iptv-org.`);
    
    const streamMap = new Map<string, { url: string, status: string }>();
    const unmappedStreams: any[] = [];
    for (const stream of streamsData) {
      if (stream.channel && stream.url) {
        const existing = streamMap.get(stream.channel);
        if (!existing || stream.status === "online" || stream.status === "active") {
          streamMap.set(stream.channel, { url: stream.url, status: stream.status || "online" });
        }
      } else if (!stream.channel && stream.url) {
        if (!stream.status || stream.status === "online" || stream.status === "active") {
          unmappedStreams.push({
            id: `unmapped_${Math.random().toString(36).substr(2, 9)}`,
            name: stream.title || 'Canal Desconocido',
            url: stream.url,
            status: stream.status || "online"
          });
        }
      }
    }

    loadingProgress = "Descargando países, idiomas, categorías, regiones y subdivisiones...";
    
    // Concurrently fetch metadata maps
    const [countriesRes, languagesRes, categoriesRes, regionsRes, subdivisionsRes] = await Promise.all([
      fetch("https://iptv-org.github.io/api/countries.json").catch(() => null),
      fetch("https://iptv-org.github.io/api/languages.json").catch(() => null),
      fetch("https://iptv-org.github.io/api/categories.json").catch(() => null),
      fetch("https://iptv-org.github.io/api/regions.json").catch(() => null),
      fetch("https://iptv-org.github.io/api/subdivisions.json").catch(() => null)
    ]);

    // Build country code mapping ("ES" -> "España")
    const countriesMap = new Map<string, string>();
    if (countriesRes?.ok) {
      const countries = await countriesRes.json() as any[];
      for (const c of countries) {
        const spanName = translateCountry(c.name, c.code);
        countriesMap.set(c.code.toUpperCase(), spanName);
      }
    }

    // Build language mapping ("spa" -> "Español")
    const languagesMap = new Map<string, string>();
    if (languagesRes?.ok) {
      const languages = await languagesRes.json() as any[];
      for (const lang of languages) {
        const spanName = translateLanguage(lang.name);
        languagesMap.set(lang.code.toLowerCase(), spanName);
      }
    }

    // Build category mapping ("movies" -> "Cine / Películas")
    const categoriesMap = new Map<string, string>();
    if (categoriesRes?.ok) {
      const categories = await categoriesRes.json() as any[];
      for (const cat of categories) {
        const spanName = translateCategory(cat.name);
        categoriesMap.set(cat.id.toLowerCase(), spanName);
      }
    }

    // Build subdivisions mapping ("ES-MD" -> "Madrid")
    const subdivisionsMap = new Map<string, string>();
    if (subdivisionsRes?.ok) {
      const subdivisions = await subdivisionsRes.json() as any[];
      for (const s of subdivisions) {
        if (s.code && s.name) {
          subdivisionsMap.set(s.code.toUpperCase(), s.name);
        }
      }
    }

    // Build regions mapping list
    if (regionsRes?.ok) {
      const regions = await regionsRes.json() as any[];
      regionsList = regions.map((r: any) => ({
        code: r.code.toUpperCase(),
        name: SPANISH_REGIONS[r.code.toUpperCase()] || r.name,
        countries: Array.isArray(r.countries) ? r.countries.map((c: string) => c.toUpperCase()) : []
      }));
    }

    loadingProgress = "Descargando base de canales de iptv-org...";
    const channelsRes = await fetch("https://iptv-org.github.io/api/channels.json");
    if (!channelsRes.ok) throw new Error(`Fallo al descargar canales (${channelsRes.status})`);
    
    const channelsData = await channelsRes.json() as any[];
    console.log(`[IPTV Loader] Descargados ${channelsData.length} canales base de iptv-org.`);

    loadingProgress = "Cruzando referencias e indexando...";
    const mergedList: IPTVChannel[] = [];
    
    for (const ch of channelsData) {
      const streamInfo = streamMap.get(ch.id);
      if (streamInfo && streamInfo.url) {
        // Human country names in Spanish
        const countryCodes = Array.isArray(ch.countries) ? ch.countries : [];
        const countryNames = countryCodes.map((code: string) => {
          const uCode = code.toUpperCase();
          return countriesMap.get(uCode) || uCode;
        });

        // Human language names in Spanish
        const langCodes = Array.isArray(ch.languages) ? ch.languages : [];
        const languageNames = langCodes.map((code: string) => {
          const lCode = code.toLowerCase();
          return languagesMap.get(lCode) || lCode;
        });

        // Translate categories or fallback
        const channelCategories = Array.isArray(ch.categories) ? ch.categories : [];
        const transCategories = channelCategories.map((cat: string) => {
          const lCat = cat.toLowerCase();
          return categoriesMap.get(lCat) || cat;
        });

        const isHttps = streamInfo.url.startsWith("https://");

        const subdivisionCode = ch.subdivision ? ch.subdivision.toUpperCase() : null;
        const subdivisionName = subdivisionCode ? (subdivisionsMap.get(subdivisionCode) || ch.subdivision) : null;
        
        const nativeName = ch.native_name || ch.nativeName || null;
        const network = ch.network || null;
        const owners = Array.isArray(ch.owners) ? ch.owners : [];
        const city = ch.city || null;
        const launched = ch.launched || null;
        const website = ch.website || null;
        const isNsfw = !!(ch.is_nsfw || ch.isNsfw);
        const broadcastArea = Array.isArray(ch.broadcast_area) ? ch.broadcast_area : [];

        mergedList.push({
          id: ch.id,
          name: ch.name || ch.id,
          logo: ch.logo || null,
          countries: countryCodes,
          languages: langCodes,
          categories: channelCategories, // raw ids kept for strict key logic
          streamUrl: streamInfo.url,
          isHttps,
          status: streamInfo.status,
          countryNames,
          languageNames,
          categoryNames: transCategories,
          // Newly extracted fields from the API
          nativeName,
          network,
          owners,
          subdivision: subdivisionCode,
          subdivisionName,
          city,
          launched,
          website,
          isNsfw,
          broadcastArea
        });
      }
    }

    // Include unmapped active streams as separate channels
    for (const stream of unmappedStreams) {
      mergedList.push({
        id: stream.id,
        name: stream.name,
        logo: null,
        countries: [],
        languages: [],
        categories: [],
        streamUrl: stream.url,
        isHttps: stream.url.startsWith("https://"),
        status: stream.status,
        countryNames: [],
        languageNames: [],
        categoryNames: [],
        nativeName: null,
        network: null,
        owners: [],
        subdivision: null,
        subdivisionName: null,
        city: null,
        launched: null,
        website: null,
        isNsfw: false,
        broadcastArea: []
      });
    }

    console.log(`[IPTV Loader] Enlazados exitosamente ${mergedList.length} canales activos con flujos listos para reproducir.`);

    if (mergedList.length > 0) {
      const existingIds = new Set(mergedList.map(m => m.id));
      const remainingDefaults = DEFAULT_CHANNELS.filter(d => !existingIds.has(d.id));
      iptvChannels = [...remainingDefaults, ...mergedList];
    }

    // Now index filter counts
    loadingProgress = "Calculando agregaciones de filtros...";
    const catCounts = new Map<string, { name: string, count: number }>();
    const countryCounts = new Map<string, { name: string, count: number }>();
    const langCounts = new Map<string, { name: string, count: number }>();
    const regionCounts = new Map<string, { name: string, count: number, countries: string[] }>();
    
    for (const r of regionsList) {
      regionCounts.set(r.code, { name: r.name, count: 0, countries: r.countries });
    }

    for (const ch of iptvChannels) {
      // 1. Categories
      ch.categories.forEach((catId) => {
        const cleanCat = catId.toLowerCase();
        const mappedName = categoriesMap.get(cleanCat) || catId;
        const current = catCounts.get(cleanCat) || { name: mappedName, count: 0 };
        current.count++;
        catCounts.set(cleanCat, current);
      });

      // 2. Countries
      ch.countries.forEach((countryCode) => {
        const uCode = countryCode.toUpperCase();
        const mappedName = countriesMap.get(uCode) || uCode;
        const current = countryCounts.get(uCode) || { name: mappedName, count: 0 };
        current.count++;
        countryCounts.set(uCode, current);

        // Aggregate regions from countries
        for (const [rCode, reg] of regionCounts.entries()) {
          if (reg.countries.includes(uCode)) {
            reg.count++;
          }
        }
      });

      // 3. Languages
      ch.languages.forEach((langCode) => {
        const lCode = langCode.toLowerCase();
        const mappedName = languagesMap.get(lCode) || lCode;
        const current = langCounts.get(lCode) || { name: mappedName, count: 0 };
        current.count++;
        langCounts.set(lCode, current);
      });
    }

    // Compile into cached filters (sorted by channel popularity)
    cachedFilters.categories = Array.from(catCounts.entries())
      .map(([id, val]) => ({ id, name: val.name, count: val.count }))
      .sort((a, b) => b.count - a.count);

    cachedFilters.countries = Array.from(countryCounts.entries())
      .map(([id, val]) => ({ id, name: val.name, count: val.count }))
      .sort((a, b) => b.count - a.count);

    cachedFilters.languages = Array.from(langCounts.entries())
      .map(([id, val]) => ({ id, name: val.name, count: val.count }))
      .sort((a, b) => b.count - a.count);

    cachedFilters.regions = Array.from(regionCounts.entries())
      .map(([id, val]) => ({ id, name: val.name, count: val.count, countries: val.countries }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count);

    isDataLoaded = true;
    loadingProgress = "Listo";
    console.log(`[IPTV Loader] ¡Carga completada totalmente! Filtros en español listos.`);

  } catch (err: any) {
    console.error("[IPTV Loader] Error al cargar listas de iptv-org:", err);
    loadingProgress = `Fallo en carga: ${err?.message || err}. Usando canales por defecto de alta calidad.`;
    
    const catCounts = new Map<string, { name: string, count: number }>();
    const countryCounts = new Map<string, { name: string, count: number }>();
    const langCounts = new Map<string, { name: string, count: number }>();

    for (const ch of DEFAULT_CHANNELS) {
      ch.categories.forEach((cat, index) => {
        const clean = cat.toLowerCase();
        const mappedName = ch.categoryNames[index] || translateCategory(cat);
        const current = catCounts.get(clean) || { name: mappedName, count: 0 };
        current.count++;
        catCounts.set(clean, current);
      });
      ch.countries.forEach((cty, index) => {
        const uCode = cty.toUpperCase();
        const mappedName = ch.countryNames[index] || translateCountry(uCode, uCode);
        const current = countryCounts.get(uCode) || { name: mappedName, count: 0 };
        current.count++;
        countryCounts.set(uCode, current);
      });
      ch.languages.forEach((lng, index) => {
        const lCode = lng.toLowerCase();
        const mappedName = ch.languageNames[index] || translateLanguage(lng);
        const current = langCounts.get(lCode) || { name: mappedName, count: 0 };
        current.count++;
        langCounts.set(lCode, current);
      });
    }

    cachedFilters.categories = Array.from(catCounts.entries()).map(([id, val]) => ({ id, name: val.name, count: val.count })).sort((a, b) => b.count - a.count);
    cachedFilters.countries = Array.from(countryCounts.entries()).map(([id, val]) => ({ id, name: val.name, count: val.count })).sort((a, b) => b.count - a.count);
    cachedFilters.languages = Array.from(langCounts.entries()).map(([id, val]) => ({ id, name: val.name, count: val.count })).sort((a, b) => b.count - a.count);
    cachedFilters.regions = [];
    
    isDataLoaded = true;
  }
}

// Start loading background process
loadIPTVData();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Loading status
  app.get("/api/status", (req, res) => {
    res.json({
      isLoaded: isDataLoaded,
      progress: loadingProgress,
      totalChannels: iptvChannels.length
    });
  });

  // API Route: Available filters metadata count (Spanish)
  app.get("/api/filters", (req, res) => {
    res.json(cachedFilters);
  });

  // API Route: Filterable and searchable paginated channel list
  app.get("/api/channels", (req, res) => {
    const search = (req.query.search as string || "").toLowerCase().trim();
    const category = (req.query.category as string || "").toLowerCase();
    const country = (req.query.country as string || "").toUpperCase();
    const language = (req.query.language as string || "").toLowerCase();
    const region = (req.query.region as string || "").toUpperCase();
    const httpsOnly = req.query.https === "true";

    let filtered = iptvChannels;

    // Apply strict filters
    if (httpsOnly) {
      filtered = filtered.filter(ch => ch.isHttps);
    }
    if (category) {
      filtered = filtered.filter(ch => ch.categories.map(c => c.toLowerCase()).includes(category));
    }
    if (country) {
      filtered = filtered.filter(ch => ch.countries.map(c => c.toUpperCase()).includes(country));
    }
    if (language) {
      filtered = filtered.filter(ch => ch.languages.map(l => l.toLowerCase()).includes(language));
    }
    if (region) {
      const regObj = regionsList.find(r => r.code === region);
      if (regObj) {
        const rCountries = regObj.countries;
        filtered = filtered.filter(ch => ch.countries.some(c => rCountries.includes(c.toUpperCase())));
      }
    }

    // Apply free-form query search with Spanish labels mapping and comprehensive attributes
    if (search) {
      filtered = filtered.filter(ch => {
        // Find if any regions match search
        const matchingRegions = regionsList.filter(r => r.name.toLowerCase().includes(search));
        const matchedCountriesOfRegions = matchingRegions.flatMap(r => r.countries);

        return (
          ch.name.toLowerCase().includes(search) ||
          ch.id.toLowerCase().includes(search) ||
          (ch.nativeName && ch.nativeName.toLowerCase().includes(search)) ||
          (ch.network && ch.network.toLowerCase().includes(search)) ||
          (ch.city && ch.city.toLowerCase().includes(search)) ||
          (ch.subdivisionName && ch.subdivisionName.toLowerCase().includes(search)) ||
          ch.countryNames.some(c => c.toLowerCase().includes(search)) ||
          ch.languageNames.some(l => l.toLowerCase().includes(search)) ||
          ch.categoryNames.some(c => c.toLowerCase().includes(search)) ||
          ch.countries.some(c => matchedCountriesOfRegions.includes(c.toUpperCase()))
        );
      });
    }

    // Pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      channels: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit)
    });
  });

  app.get("/api/check-stream", async (req, res) => {
    const streamUrl = req.query.url as string;
    if (!streamUrl) {
      return res.status(400).json({ active: false, reason: "No URL" });
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      
      const response = await fetch(streamUrl, {
        method: "GET",
        headers: { "Range": "bytes=0-100" }, // Avoid downloading full if supported
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return res.json({ active: true });
      } else {
        return res.json({ active: false, reason: `HTTP ${response.status}` });
      }
    } catch (error) {
      return res.json({ active: false, reason: "Unreachable or timeout" });
    }
  });

  // Vite integrations
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[IPTV Server] Corriendo exitosamente en http://localhost:${PORT}`);
  });
}

startServer();
