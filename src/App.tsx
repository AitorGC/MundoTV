/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useRef } from "react";
import { 
  Tv, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Globe, 
  Tag, 
  Languages, 
  RefreshCw, 
  Share2, 
  Info, 
  AlertTriangle,
  Play,
  Grid,
  FilterX,
  Lock,
  Unlock,
  CheckCircle2,
  ListFilter,
  Heart,
  Sun,
  Moon,
  MonitorPlay,
  Maximize,
  Minimize,
  Clock,
  Plus,
  Trash2,
  Upload
} from "lucide-react";
import { IPTVChannel, FiltersResponse, PaginatedChannels } from "./types";
import VideoPlayer from "./components/VideoPlayer";
import EPGGuide from "./components/EPGGuide";
import { getChannelEPG, parseM3UPlaylist, EPGProgram } from "./utils";
import { motion } from "motion/react";

export default function App() {
  // App initialization states
  const [initStatus, setInitStatus] = useState({
    isLoaded: false,
    progress: "Conectándose al servidor backend...",
    totalChannels: 0
  });

  // Channels fetching & paging states
  const [channels, setChannels] = useState<IPTVChannel[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingChannels, setIsLoadingChannels] = useState(false);

  // Theme setup: True for dark mode, False for light mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem("iptv_theme_mode");
      return saved ? saved === "dark" : true;
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem("iptv_theme_mode", newVal ? "dark" : "light");
      return newVal;
    });
  };

  // Filters state (metadata from API)
  const [allFilters, setAllFilters] = useState<FiltersResponse>({
    categories: [],
    countries: [],
    languages: [],
    regions: []
  });

  // User input & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [httpsOnly, setHttpsOnly] = useState(true);

  // Filter tab selector (for right panel metadata selectors)
  // "categories" | "countries" | "languages" | "regions"
  const [activeMetadataTab, setActiveMetadataTab] = useState<"categories" | "countries" | "languages" | "regions">("categories");
  const [metadataSearch, setMetadataSearch] = useState("");

  // Currently playing channel state
  const [activeChannel, setActiveChannel] = useState<IPTVChannel | null>(null);

  // UI status alerts
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Show list tab in sidebar (Todos vs Favoritos vs PC/VLC vs Listas M3U)
  const [activeTab, setActiveTab] = useState<"all" | "favorites" | "vlc" | "custom">("all");

  // User's custom channels persisted via localStorage
  const [customChannels, setCustomChannels] = useState<IPTVChannel[]>(() => {
    try {
      const saved = localStorage.getItem("iptv_custom_channels_v1");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync custom channels changes with local storage
  useEffect(() => {
    try {
      localStorage.setItem("iptv_custom_channels_v1", JSON.stringify(customChannels));
    } catch (e) {
      console.warn("Error al persistir canales personalizados:", e);
    }
  }, [customChannels]);

  // User's favorites list persisted via localStorage
  const [favorites, setFavorites] = useState<IPTVChannel[]>(() => {
    try {
      const saved = localStorage.getItem("iptv_favorites_channels_v1");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Error al cargar favoritos de localStorage:", e);
      return [];
    }
  });

  // User's VLC list persisted via localStorage
  const [vlcChannels, setVlcChannels] = useState<IPTVChannel[]>(() => {
    try {
      const saved = localStorage.getItem("iptv_vlc_channels_v1");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // User's recent channels persisted via localStorage
  const [recentChannels, setRecentChannels] = useState<IPTVChannel[]>(() => {
    try {
      const saved = localStorage.getItem("iptv_recent_channels_v1");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // States for Custom M3U / Custom Channels creation forms (Improvement 2)
  const [m3uText, setM3uText] = useState("");
  const [showImportForm, setShowImportForm] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualUrl, setManualUrl] = useState("");
  const [manualLogo, setManualLogo] = useState("");
  const [manualCategory, setManualCategory] = useState("");

  const [isCinemaMode, setIsCinemaMode] = useState(false);
  const [checkingChannel, setCheckingChannel] = useState<string | null>(null);
  const [channelStatusCache, setChannelStatusCache] = useState<Record<string, boolean>>({});

  // Atajos de teclado (Hotkeys globales) - Nivel App
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el usuario está escribiendo o si presiona Command/Ctrl (no queremos sobreescribir atajos del SO)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsCinemaMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sync favorites state changes with local storage
  useEffect(() => {
    try {
      localStorage.setItem("iptv_favorites_channels_v1", JSON.stringify(favorites));
      localStorage.setItem("iptv_vlc_channels_v1", JSON.stringify(vlcChannels));
      localStorage.setItem("iptv_recent_channels_v1", JSON.stringify(recentChannels));
    } catch (e) {
      console.warn("Error al guardar en localStorage:", e);
    }
  }, [favorites, vlcChannels, recentChannels]);

  const toggleFavorite = (channel: IPTVChannel) => {
    setFavorites(prev => {
      const exists = prev.some(c => c.id === channel.id);
      if (exists) {
        return prev.filter(c => c.id !== channel.id);
      } else {
        return [...prev, channel];
      }
    });
  };

  const isFavorite = (channelId: string) => {
    return favorites.some(c => c.id === channelId);
  };

  const markAsVlc = (channel: IPTVChannel) => {
    setVlcChannels(prev => {
      const exists = prev.some(c => c.id === channel.id);
      if (exists) return prev;
      return [...prev, channel];
    });
    setCopiedUrl(true); // Re-use toast/alert UI vaguely for success feedback
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isVlc = (channelId: string) => {
    return vlcChannels.some(c => c.id === channelId);
  };

  const handleSelectChannel = async (channel: IPTVChannel) => {
    // If we already checked and it's explicitly false, force play anyway if they clicked a second time
    // But on first click we check.
    if (channelStatusCache[channel.id] === false) {
      setActiveChannel(channel);
      setRecentChannels(prev => {
        const filtered = prev.filter(c => c.id !== channel.id);
        return [channel, ...filtered].slice(0, 5);
      });
      return;
    }

    if (channelStatusCache[channel.id] === true) {
      setActiveChannel(channel);
      setRecentChannels(prev => {
        const filtered = prev.filter(c => c.id !== channel.id);
        return [channel, ...filtered].slice(0, 5);
      });
      return;
    }

    setCheckingChannel(channel.id);
    try {
      const res = await fetch(`/api/check-stream?url=${encodeURIComponent(channel.streamUrl)}`);
      const data = await res.json();
      
      if (data.active) {
        setChannelStatusCache(prev => ({ ...prev, [channel.id]: true }));
        setActiveChannel(channel);
        setRecentChannels(prev => {
          const filtered = prev.filter(c => c.id !== channel.id);
          return [channel, ...filtered].slice(0, 5);
        });
      } else {
        setChannelStatusCache(prev => ({ ...prev, [channel.id]: false }));
      }
    } catch {
      setChannelStatusCache(prev => ({ ...prev, [channel.id]: false }));
    } finally {
      setCheckingChannel(null);
    }
  };

  // Helper for computing client-side lists
  const computeClientSideList = (list: IPTVChannel[]) => list.filter(ch => {
    // Apply HTTPS Only
    if (httpsOnly && !ch.isHttps) return false;
    // Apply category filter
    if (selectedCategory && !ch.categories.map(c => c.toLowerCase()).includes(selectedCategory)) return false;
    // Apply country filter
    if (selectedCountry && !ch.countries.map(c => c.toUpperCase()).includes(selectedCountry)) return false;
    // Apply language filter
    if (selectedLanguage && !ch.languages.map(l => l.toLowerCase()).includes(selectedLanguage)) return false;
    // Apply region filter
    if (selectedRegion) {
      const reg = allFilters.regions.find(r => r.id === selectedRegion);
      const rCountries = reg?.countries || [];
      if (!ch.countries.some(c => rCountries.includes(c.toUpperCase()))) return false;
    }
    // Apply search query
    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase().trim();
      return (
        ch.name.toLowerCase().includes(s) ||
        ch.id.toLowerCase().includes(s) ||
        ch.countryNames.some(c => c.toLowerCase().includes(s)) ||
        ch.languageNames.some(l => l.toLowerCase().includes(s)) ||
        ch.categoryNames.some(c => c.toLowerCase().includes(s))
      );
    }
    return true;
  });

  const filteredFavorites = computeClientSideList(favorites);
  const filteredVlc = computeClientSideList(vlcChannels);
  const filteredCustom = computeClientSideList(customChannels);
  
  const itemsPerPage = 50;
  const currentFavPage = Math.min(page, Math.ceil(filteredFavorites.length / itemsPerPage) || 1) || 1;
  const currentVlcPage = Math.min(page, Math.ceil(filteredVlc.length / itemsPerPage) || 1) || 1;
  const currentCustomPageStored = Math.min(page, Math.ceil(filteredCustom.length / itemsPerPage) || 1) || 1;

  const paginatedFavs = filteredFavorites.slice(0, currentFavPage * itemsPerPage);
  const paginatedVlc = filteredVlc.slice(0, currentVlcPage * itemsPerPage);
  const paginatedCustom = filteredCustom.slice(0, currentCustomPageStored * itemsPerPage);

  const displayedChannels = activeTab === "favorites" ? paginatedFavs 
                          : activeTab === "vlc" ? paginatedVlc 
                          : activeTab === "custom" ? paginatedCustom
                          : channels.filter(c => !isVlc(c.id));
                          
  const activeTotalResults = activeTab === "favorites" ? filteredFavorites.length 
                           : activeTab === "vlc" ? filteredVlc.length 
                           : activeTab === "custom" ? filteredCustom.length
                           : totalResults;
                           
  const activeTotalPages = activeTab === "favorites" ? (Math.ceil(filteredFavorites.length / itemsPerPage) || 1)
                         : activeTab === "vlc" ? (Math.ceil(filteredVlc.length / itemsPerPage) || 1)
                         : activeTab === "custom" ? (Math.ceil(filteredCustom.length / itemsPerPage) || 1)
                         : totalPages;
                         
  const activePage = activeTab === "favorites" ? currentFavPage 
                   : activeTab === "vlc" ? currentVlcPage 
                   : activeTab === "custom" ? currentCustomPageStored
                   : page;

  // Testeo Preventivo en Segundo Plano (Background Check)
  useEffect(() => {
    // Collect channels that haven't been checked yet
    let isSubscribed = true;
    let timeoutId: NodeJS.Timeout;

    const testNext = async (index: number) => {
      if (!isSubscribed || index >= displayedChannels.length) return;
      
      const channel = displayedChannels[index];
      
      // If already checked or cached, skip instantly
      setChannelStatusCache(currentCache => {
        if (currentCache[channel.id] !== undefined) {
          // Already have it cache, move to next instantly
          timeoutId = setTimeout(() => testNext(index + 1), 10);
          return currentCache;
        }
        
        // Not checked yet, let's do the fetch outside state updater
        (async () => {
          try {
            const res = await fetch(`/api/check-stream?url=${encodeURIComponent(channel.streamUrl)}`);
            const data = await res.json();
            if (isSubscribed && data && typeof data.active === "boolean") {
              setChannelStatusCache(prev => ({ ...prev, [channel.id]: data.active }));
            }
          } catch (err) {
            if (isSubscribed) {
              setChannelStatusCache(prev => ({ ...prev, [channel.id]: false }));
            }
          }
          
          // Delay before next check
          if (isSubscribed) {
             timeoutId = setTimeout(() => testNext(index + 1), 600);
          }
        })();
        
        return currentCache;
      });
    };

    // Give priority to rendering first
    timeoutId = setTimeout(() => testNext(0), 1000);

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
    };
  }, [displayedChannels]);

  // Poll server loading progress on startup
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/status");
        if (res.ok) {
          const data = await res.json();
          setInitStatus(data);
          
          if (data.isLoaded) {
            clearInterval(intervalId);
          }
        }
      } catch (err) {
        console.warn("Error al consultar estado del servidor:", err);
      }
    };

    // Check immediately and then every 2 seconds
    checkStatus();
    intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, []);

  // Sync debounce for search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page on search
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Load metadata filters once server has loaded them
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const res = await fetch("/api/filters");
        if (res.ok) {
          const data = await res.json();
          setAllFilters(data);
        }
      } catch (err) {
        console.warn("Error al obtener metadatos de filtros:", err);
      }
    };

    if (initStatus.isLoaded) {
      loadFilters();
    }
  }, [initStatus.isLoaded]);

  // Fetch channels based on search and selected filters from backend
  const fetchChannels = async () => {
    setIsLoadingChannels(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "50", // Ensure enough items to cause native overflow and enable infinite scroll
        search: debouncedSearch,
        category: selectedCategory,
        country: selectedCountry,
        language: selectedLanguage,
        region: selectedRegion,
        https: httpsOnly.toString()
      });

      const res = await fetch(`/api/channels?${queryParams.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as PaginatedChannels;
        if (page === 1) {
          setChannels(data.channels);
        } else {
          setChannels(prev => [...prev, ...data.channels]);
        }
        setTotalResults(data.total);
        setTotalPages(data.totalPages);

        // Auto select first channel if none is active yet (on initial startup load)
        if (!activeChannel && data.channels.length > 0 && page === 1) {
          handleSelectChannel(data.channels[0]);
        }
      }
    } catch (err) {
      console.warn("Error al cargar canales:", err);
    } finally {
      setIsLoadingChannels(false);
    }
  };

  useEffect(() => {
    fetchChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, selectedCategory, selectedCountry, selectedLanguage, selectedRegion, httpsOnly, page, initStatus.isLoaded]);

  // Clean all filters
  const resetAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedCountry("");
    setSelectedLanguage("");
    setSelectedRegion("");
    setMetadataSearch("");
    setPage(1);
  };

  const handleCopyUrl = () => {
    if (activeChannel?.streamUrl) {
      navigator.clipboard.writeText(activeChannel.streamUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  // Human country flag helper (simple fallback)
  const getFlagEmoji = (countryCode: string) => {
    if (!countryCode) return "🌐";
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map(char =>  127397 + char.charCodeAt(0));
    try {
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌐";
    }
  };

  // Get active filters and counts
  const getMetadataOptionsByTab = () => {
    const list = allFilters[activeMetadataTab] || [];
    if (!metadataSearch.trim()) return list.slice(0, 50); // Show top 50 in list naturally to prevent lag
    
    return list.filter(opt => 
      opt.name.toLowerCase().includes(metadataSearch.toLowerCase()) || 
      opt.id.toLowerCase().includes(metadataSearch.toLowerCase())
    ).slice(0, 50);
  };

  const activeMetadataTitle = {
    categories: "Géneros / Categorías",
    countries: "Países",
    languages: "Idiomas",
    regions: "Regiones"
  }[activeMetadataTab] || "Regiones";

  const metadataIcon = {
    categories: <Tag className="w-4 h-4" />,
    countries: <Globe className="w-4 h-4" />,
    languages: <Languages className="w-4 h-4" />,
    regions: <Globe className="w-4 h-4" />
  }[activeMetadataTab] || <Globe className="w-4 h-4" />;

  return (
    <div id="iptv-app" className={`min-h-screen font-sans antialiased selection:bg-cabildo-blue selection:text-white transition-colors duration-200 ${
      darkMode 
        ? "dark bg-black text-zinc-100" 
        : "bg-white text-zinc-800"
    }`}>
      
      {/* Decorative ambient gradient backdrop */}
      <div className={`absolute top-0 left-1/4 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none -z-10 transition-colors ${
        darkMode ? "bg-cabildo-blue/5" : "bg-cabildo-blue/[0.04]"
      }`} />
      <div className={`absolute bottom-10 right-1/4 w-[400px] h-[400px] blur-[100px] rounded-full pointer-events-none -z-10 transition-colors ${
        darkMode ? "bg-cabildo-blue/5" : "bg-cabildo-blue/[0.04]"
      }`} />

      {/* Primary Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-xl border-b px-4 py-3.5 sm:px-6 lg:px-8 transition-colors ${
        darkMode 
          ? "bg-black/80 border-zinc-900/80" 
          : "bg-white/90 border-slate-200/80 shadow-xs"
      }`}>
        <div className="w-full mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl shadow-inner transition-colors border ${
              darkMode 
                ? "bg-cabildo-yellow/10 border-cabildo-yellow/20 text-cabildo-yellow" 
                : "bg-cabildo-yellow/20 border-cabildo-yellow/40 text-[#004993]"
            }`}>
              <Tv className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className={`text-md sm:text-lg font-extrabold tracking-tight flex items-center gap-2 ${
                darkMode ? "text-white" : "text-[#004993]"
              }`}>
                MundoTV by Aitor Santana
              </h1>
              <p className={`text-[11px] sm:text-xs tracking-tight ${
                darkMode ? "text-zinc-400" : "text-slate-500"
              }`}>
                TV en abierto en todas partes del mundo.
              </p>
            </div>
          </div>

          {/* Sync status, Theme toggle and HTTPS quick toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Status indicators */}
            <div className={`flex items-center gap-2.5 border px-3 py-1.5 rounded-lg shadow-sm transition-colors ${
              darkMode 
                ? "bg-zinc-900/60 border-zinc-800 text-zinc-300" 
                : "bg-slate-50 border-slate-200 text-slate-700"
            }`}>
              <div className={`w-2 h-2 rounded-full ${initStatus.isLoaded ? "bg-cabildo-blue animate-pulse" : "bg-cabildo-yellow animate-ping"}`} />
              <span className="text-[11px] font-semibold font-secondary">
                {initStatus.isLoaded 
                  ? `Sincronizado (${initStatus.totalChannels.toLocaleString()} canales)` 
                  : `${initStatus.progress}`}
              </span>
            </div>

            {/* Theme Toggle Button */}
            <button
              id="iptv-theme-toggle-btn"
              onClick={toggleTheme}
              title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
              className={`flex items-center justify-center p-2 rounded-lg border cursor-pointer transition-colors ${
                darkMode
                  ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-[#ffd600]"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-[#004993]"
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cinema Mode Toggle Button */}
            <button
              id="iptv-cinema-toggle-btn"
              onClick={() => setIsCinemaMode(!isCinemaMode)}
              title={isCinemaMode ? "Salir de Modo Cine (C)" : "Modo Cine (C)"}
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                isCinemaMode
                  ? "bg-cabildo-yellow hover:bg-[#e6c000] border-cabildo-yellow text-black font-bold"
                  : darkMode
                    ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white font-bold"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-black font-bold"
              }`}
            >
              {isCinemaMode ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
              <span className="font-secondary text-xs">{isCinemaMode ? "Minimizar" : "Modo Cine"}</span>
            </button>

            {/* Quick action button to trigger pull refresh */}
            <button
              id="iptv-refresh-filters-btn"
              onClick={resetAllFilters}
              title="Restaurar todos los filtros y búsquedas"
              className={`flex items-center gap-2 border px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                darkMode
                  ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-300/80 text-slate-700 hover:text-black"
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="font-secondary font-bold">Limpiar filtros</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main body of App */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 relative pb-28">
        <div className={`grid grid-cols-1 ${isCinemaMode ? "lg:grid-cols-1" : "lg:grid-cols-12"} gap-6 items-start`}>
          
          {/* Left panel: Video Player and selected channel information */}
          <div className={`${isCinemaMode ? "col-span-1" : "lg:col-span-7 xl:col-span-8"} flex flex-col gap-6`}>
            
            {/* The active player wrapper */}
            {activeChannel ? (
              <>
                <VideoPlayer 
                  src={activeChannel.streamUrl || ""} 
                  title={activeChannel.name}
                  logo={activeChannel.logo}
                  isHttps={activeChannel.isHttps}
                  onMarkAsVlc={() => markAsVlc(activeChannel)}
                />
                
                <EPGGuide
                  channelId={activeChannel.id}
                  channelName={activeChannel.name}
                  category={activeChannel.categories[0] || ""}
                  darkMode={darkMode}
                />
              </>
            ) : (
              <div className={`aspect-video rounded-2xl border flex flex-col items-center justify-center p-8 text-center shadow-lg transition-colors ${
                darkMode
                  ? "bg-black border-zinc-900"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-pulse transition-colors ${
                  darkMode ? "bg-cabildo-yellow/10 text-cabildo-yellow" : "bg-cabildo-yellow/20 text-[#004993]"
                }`}>
                  <Tv className="w-8 h-8" />
                </div>
                <h3 className={`font-bold font-display text-lg mb-1 ${
                  darkMode ? "text-white" : "text-[#004993]"
                }`}>
                  Ningún canal en reproducción
                </h3>
                <p className={`text-sm max-w-sm leading-relaxed transition-colors ${
                  darkMode ? "text-zinc-400" : "text-slate-600"
                }`}>
                  Busca y selecciona cualquier canal del listado de la derecha para iniciar la reproducción pública.
                </p>
              </div>
            )}

            {/* Selected Channel Metadata Details */}
            {activeChannel && (
              <section id="iptv-channel-details" className={`rounded-2xl border p-5 shadow-xs transition-colors ${
                darkMode
                  ? "bg-zinc-950/60 border-zinc-900"
                  : "bg-slate-50 border-slate-200"
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {activeChannel.logo ? (
                      <img
                        src={activeChannel.logo}
                        alt=""
                        referrerPolicy="no-referrer"
                        className={`w-14 h-14 bg-white p-1 rounded-xl object-contain ring-2 shadow-md flex-shrink-0 transition-colors ${
                          darkMode ? "ring-zinc-800" : "ring-slate-200/85"
                        }`}
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ring-2 ${
                        darkMode ? "bg-zinc-900 ring-zinc-800 text-zinc-500" : "bg-slate-100 ring-slate-200 text-slate-400"
                      }`}>
                        <Tv className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h2 className={`text-lg font-extrabold font-display ${
                        darkMode ? "text-white" : "text-[#004993]"
                      }`}>
                        {activeChannel.name}
                      </h2>
                      <p className={`text-xs font-mono mt-0.5 truncate max-w-sm transition-colors ${
                        darkMode ? "text-zinc-500" : "text-slate-400"
                      }`}>
                        ID: {activeChannel.id}
                      </p>

                      {/* Attribute Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {activeChannel.countryNames.map((name, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-secondary transition-colors ${
                            darkMode 
                              ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" 
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}>
                            <span>{getFlagEmoji(activeChannel.countries[i])}</span>
                            <span>{name}</span>
                          </span>
                        ))}
                        {activeChannel.languageNames.map((name, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-secondary transition-colors ${
                            darkMode 
                              ? "bg-zinc-900/80 border-zinc-800 text-zinc-300" 
                              : "bg-slate-100 border-slate-200 text-slate-700"
                          }`}>
                            <Languages className="w-3 h-3 text-zinc-400" />
                            <span>{name}</span>
                          </span>
                        ))}
                        {activeChannel.categories.map((cat, i) => (
                          <span key={i} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-secondary font-bold transition-colors ${
                            darkMode 
                              ? "bg-cabildo-blue/15 border-cabildo-blue/30 text-blue-300" 
                              : "bg-cabildo-blue/10 border-cabildo-blue/20 text-[#004993]"
                          }`}>
                            <Tag className="w-3 h-3 opacity-70" />
                            <span className="capitalize">{activeChannel.categoryNames?.[i] || cat}</span>
                          </span>
                        ))}
                      </div>

                      {/* Secondary Details Grid for Newly Extracted Metadata */}
                      {(activeChannel.nativeName || activeChannel.network || (activeChannel.owners && activeChannel.owners.length > 0) || activeChannel.subdivisionName || activeChannel.city || activeChannel.launched || activeChannel.website || activeChannel.isNsfw || (activeChannel.broadcastArea && activeChannel.broadcastArea.length > 0)) && (
                        <div className={`mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs font-secondary transition-colors ${
                          darkMode ? "border-zinc-900 text-zinc-400" : "border-slate-200 text-slate-600"
                        }`}>
                          {activeChannel.nativeName && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Nombre original:</span>
                              <span>{activeChannel.nativeName}</span>
                            </div>
                          )}
                          {activeChannel.network && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Red / Cadena:</span>
                              <span>{activeChannel.network}</span>
                            </div>
                          )}
                          {activeChannel.owners && activeChannel.owners.length > 0 && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Propietario:</span>
                              <span className="truncate max-w-[200px]" title={activeChannel.owners.join(', ')}>{activeChannel.owners.join(', ')}</span>
                            </div>
                          )}
                          {activeChannel.subdivisionName && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Región:</span>
                              <span>{activeChannel.subdivisionName}</span>
                            </div>
                          )}
                          {activeChannel.city && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Ciudad:</span>
                              <span>{activeChannel.city}</span>
                            </div>
                          )}
                          {activeChannel.launched && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Lanzamiento:</span>
                              <span>{activeChannel.launched}</span>
                            </div>
                          )}
                          {activeChannel.isNsfw && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className="font-bold text-red-500">Restricción:</span>
                              <span className="px-1.5 py-0.5 text-[10px] bg-red-950/40 text-red-400 rounded border border-red-900/30 font-bold uppercase tracking-wider">NSFW / +18</span>
                            </div>
                          )}
                          {activeChannel.website && (
                            <div className="flex items-center gap-1.5 py-0.5">
                              <span className={`font-bold ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Sitio Web:</span>
                              <a
                                href={activeChannel.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`hover:underline font-bold flex items-center gap-1 truncate ${
                                  darkMode ? "text-blue-400" : "text-[#004993]"
                                }`}
                              >
                                {activeChannel.website.replace(/^https?:\/\/(www\.)?/, '')}
                              </a>
                            </div>
                          )}
                          {activeChannel.broadcastArea && activeChannel.broadcastArea.length > 0 && (
                            <div className="flex items-start gap-1.5 py-0.5 md:col-span-2">
                              <span className={`font-bold flex-shrink-0 ${darkMode ? "text-zinc-300" : "text-slate-800"}`}>Área de transmisión:</span>
                              <span className={`uppercase text-[10px] tracking-wide max-w-lg leading-snug ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
                                {activeChannel.broadcastArea.join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top-Right details panel with links/actions */}
                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                    <button
                      id="iptv-toggle-favorite-btn"
                      onClick={() => toggleFavorite(activeChannel)}
                      className={`p-2 border rounded-lg text-xs font-secondary font-bold flex items-center gap-2 cursor-pointer transition-all ${
                        isFavorite(activeChannel.id)
                          ? "bg-rose-950/20 border-rose-900/40 text-rose-400 hover:bg-rose-900/30"
                          : (darkMode 
                              ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white"
                              : "bg-slate-100 border-slate-300 text-slate-700 hover:text-black")
                      }`}
                      title={isFavorite(activeChannel.id) ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(activeChannel.id) ? "fill-current text-rose-500" : ""}`} />
                      <span>{isFavorite(activeChannel.id) ? "Favorito" : "Añadir a favoritos"}</span>
                    </button>

                    <button
                      id="iptv-copy-url-btn"
                      onClick={handleCopyUrl}
                      className={`p-2 border rounded-lg text-xs font-secondary font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                        darkMode
                          ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300 hover:text-white"
                          : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-black"
                      }`}
                      title="Copiar URL del streaming"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>{copiedUrl ? "¡Copiado!" : "Copiar URL"}</span>
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* Direct Filters Dashboard Card (Moved to Left Panel for better balance) */}
            <div className={`border rounded-2xl p-4 shadow-xs flex flex-col gap-4 transition-colors ${
              darkMode
                ? "bg-zinc-950 border-zinc-900"
                : "bg-slate-50 border-slate-200/90 shadow-2xs"
            }`}>
              <h3 className={`font-bold font-display text-sm tracking-tight flex items-center gap-2 ${
                darkMode ? "text-zinc-200" : "text-[#004993]"
              }`}>
                <ListFilter className={`w-4 h-4 ${darkMode ? 'text-cabildo-yellow' : 'text-[#004993]'}`} />
                <span>Panel de Búsqueda y Filtros</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Search & Settings */}
                <div className="flex flex-col gap-4">
                  {/* Free-form search box */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
                    <input
                      id="iptv-search-input"
                      type="text"
                      placeholder="Buscar canal, país, idioma..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={`w-full border text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-1 focus:ring-cabildo-yellow focus:border-cabildo-yellow transition-all ${
                        darkMode
                          ? "bg-[#121214] border-zinc-800 text-zinc-100 placeholder-zinc-500"
                          : "bg-white border-slate-300 text-slate-800 placeholder-slate-400 shadow-inner"
                      }`}
                    />
                  </div>

                  {/* HTTPS Quick switch */}
                  <div className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    darkMode
                      ? "bg-zinc-900/40 border-zinc-900"
                      : "bg-slate-100/60 border-slate-200/80"
                  }`}>
                    <div className="flex flex-col gap-0.5 pr-2">
                      <span className={`text-xs font-semibold flex items-center gap-1.5 ${
                        darkMode ? "text-zinc-200" : "text-slate-800"
                      }`}>
                        Solo canales HTTPS
                        <Lock className={`w-3 h-3 inline ${darkMode ? 'text-blue-400' : 'text-[#004993]'}`} />
                      </span>
                      <span className="text-[10px] text-zinc-500 font-secondary">
                        Oculta canales que el navegador bloqueará
                      </span>
                    </div>
                    <button
                      id="iptv-https-toggle-btn"
                      onClick={() => setHttpsOnly(!httpsOnly)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                        httpsOnly ? "bg-cabildo-yellow" : (darkMode ? "bg-zinc-800" : "bg-slate-300")
                      }`}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        httpsOnly ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  
                  {/* Applied filters feedback chips */}
                  {(selectedCategory || selectedCountry || selectedLanguage || selectedRegion) && (
                    <div className={`flex flex-wrap gap-1.5 pt-2 border-t ${
                      darkMode ? "border-zinc-900" : "border-slate-200"
                    }`}>
                      {selectedCategory && (
                        <span className={`px-2 py-1 border rounded-lg text-[10px] font-secondary font-bold flex items-center gap-1 transition-colors ${
                          darkMode ? "bg-cabildo-blue/15 border-cabildo-blue/30 text-blue-300" : "bg-cabildo-blue/10 border-cabildo-blue/20 text-[#004993]"
                        }`}>
                          <span>Cat: {allFilters.categories.find(c => c.id === selectedCategory)?.name || selectedCategory}</span>
                          <button onClick={() => setSelectedCategory("")} className="hover:opacity-60 ml-0.5 font-bold cursor-pointer">×</button>
                        </span>
                      )}
                      {selectedCountry && (
                        <span className={`px-2 py-1 border rounded-lg text-[10px] font-secondary font-bold flex items-center gap-1 transition-colors ${
                          darkMode ? "bg-cabildo-blue/15 border-cabildo-blue/30 text-blue-300" : "bg-cabildo-blue/10 border-cabildo-blue/20 text-[#004993]"
                        }`}>
                          <span>País: {getFlagEmoji(selectedCountry)} {allFilters.countries.find(c => c.id === selectedCountry)?.name || selectedCountry}</span>
                          <button onClick={() => setSelectedCountry("")} className="hover:opacity-60 ml-0.5 font-bold cursor-pointer">×</button>
                        </span>
                      )}
                      {selectedLanguage && (
                        <span className={`px-2 py-1 border rounded-lg text-[10px] font-secondary font-bold flex items-center gap-1 transition-colors ${
                          darkMode ? "bg-cabildo-blue/15 border-cabildo-blue/30 text-blue-300" : "bg-cabildo-blue/10 border-cabildo-blue/20 text-[#004993]"
                        }`}>
                          <span>Idioma: {allFilters.languages.find(l => l.id === selectedLanguage)?.name || selectedLanguage}</span>
                          <button onClick={() => setSelectedLanguage("")} className="hover:opacity-60 ml-0.5 font-bold cursor-pointer">×</button>
                        </span>
                      )}
                      {selectedRegion && (
                        <span className={`px-2 py-1 border rounded-lg text-[10px] font-secondary font-bold flex items-center gap-1 transition-colors ${
                          darkMode ? "bg-cabildo-blue/15 border-cabildo-blue/30 text-blue-300" : "bg-cabildo-blue/10 border-cabildo-blue/20 text-[#004993]"
                        }`}>
                          <span>Región: {allFilters.regions?.find(r => r.id === selectedRegion)?.name || selectedRegion}</span>
                          <button onClick={() => setSelectedRegion("")} className="hover:opacity-60 ml-0.5 font-bold cursor-pointer">×</button>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Metadata selection */}
                <div className="flex flex-col gap-0">
                  <div className={`flex border-b mb-3 text-[11px] sm:text-xs transition-colors ${
                    darkMode ? "border-zinc-800" : "border-slate-200"
                  }`}>
                    <button
                      id="iptv-tab-categories"
                      onClick={() => { setActiveMetadataTab("categories"); setMetadataSearch(""); }}
                      className={`flex-1 pb-2 text-center font-bold font-secondary transition-colors cursor-pointer ${
                        activeMetadataTab === "categories" 
                          ? (darkMode ? "text-cabildo-yellow border-b-2 border-cabildo-yellow font-extrabold" : "text-[#004993] border-b-2 border-cabildo-yellow font-extrabold") 
                          : (darkMode ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-black")
                      }`}
                    >
                      Géneros ({allFilters.categories.length})
                    </button>
                    <button
                      id="iptv-tab-countries"
                      onClick={() => { setActiveMetadataTab("countries"); setMetadataSearch(""); }}
                      className={`flex-1 pb-2 text-center font-bold font-secondary transition-colors cursor-pointer ${
                        activeMetadataTab === "countries" 
                          ? (darkMode ? "text-cabildo-yellow border-b-2 border-cabildo-yellow font-extrabold" : "text-[#004993] border-b-2 border-cabildo-yellow font-extrabold")  
                          : (darkMode ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-black")
                      }`}
                    >
                      Países ({allFilters.countries.length})
                    </button>
                    <button
                      id="iptv-tab-languages"
                      onClick={() => { setActiveMetadataTab("languages"); setMetadataSearch(""); }}
                      className={`flex-1 pb-2 text-center font-bold font-secondary transition-colors cursor-pointer ${
                        activeMetadataTab === "languages" 
                          ? (darkMode ? "text-cabildo-yellow border-b-2 border-cabildo-yellow font-extrabold" : "text-[#004993] border-b-2 border-cabildo-yellow font-extrabold")  
                          : (darkMode ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-black")
                      }`}
                    >
                      Idiomas ({allFilters.languages.length})
                    </button>
                    <button
                      id="iptv-tab-regions"
                      onClick={() => { setActiveMetadataTab("regions"); setMetadataSearch(""); }}
                      className={`flex-1 pb-2 text-center font-bold font-secondary transition-colors cursor-pointer ${
                        activeMetadataTab === "regions" 
                          ? (darkMode ? "text-cabildo-yellow border-b-2 border-cabildo-yellow font-extrabold" : "text-[#004993] border-b-2 border-cabildo-yellow font-extrabold")  
                          : (darkMode ? "text-zinc-400 hover:text-zinc-200" : "text-slate-500 hover:text-black")
                      }`}
                    >
                      Regiones ({allFilters.regions?.length || 0})
                    </button>
                  </div>

                  {/* Sub search input for metadata filter values */}
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500" />
                    <input
                      id="iptv-metadata-subsearch"
                      type="text"
                      placeholder={`Filtrar listado de ${activeMetadataTitle.toLowerCase()}...`}
                      value={metadataSearch}
                      onChange={(e) => setMetadataSearch(e.target.value)}
                      className={`w-full border text-xs pl-8 pr-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-cabildo-yellow focus:border-cabildo-yellow transition-all ${
                        darkMode
                          ? "bg-[#121214] border-zinc-800 text-zinc-100 placeholder-zinc-500"
                          : "bg-white border-slate-300 text-slate-800 placeholder-slate-400"
                      }`}
                    />
                  </div>

                  {/* Scrollable meta items selector */}
                  <div className={`max-h-[140px] overflow-y-auto border rounded-xl text-xs p-1 flex flex-col gap-0.5 animate-fade-in transition-colors ${
                    darkMode
                      ? "bg-black border-zinc-900"
                      : "bg-white border-slate-200 shadow-inner"
                  }`}>
                    <button
                      onClick={() => {
                        if (activeMetadataTab === "categories") setSelectedCategory("");
                        if (activeMetadataTab === "countries") setSelectedCountry("");
                        if (activeMetadataTab === "languages") setSelectedLanguage("");
                        if (activeMetadataTab === "regions") setSelectedRegion("");
                        setPage(1);
                      }}
                      className={`text-left px-2.5 py-1.5 rounded-lg font-medium font-secondary cursor-pointer transition-colors flex items-center justify-between ${
                        (activeMetadataTab === "categories" && !selectedCategory) ||
                        (activeMetadataTab === "countries" && !selectedCountry) ||
                        (activeMetadataTab === "languages" && !selectedLanguage) ||
                        (activeMetadataTab === "regions" && !selectedRegion)
                          ? (darkMode ? "bg-cabildo-yellow/20 text-yellow-400 font-bold" : "bg-cabildo-yellow/20 text-[#a88d00] font-bold")
                          : (darkMode ? "hover:bg-zinc-900 text-zinc-400" : "hover:bg-slate-100 text-slate-600")
                      }`}
                    >
                      <span>Mostrar TODOS</span>
                      <span className="text-[10px] font-mono font-medium brightness-75">Por defecto</span>
                    </button>

                    {getMetadataOptionsByTab().map((opt) => {
                      const isSelected = 
                        (activeMetadataTab === "categories" && selectedCategory === opt.id) ||
                        (activeMetadataTab === "countries" && selectedCountry === opt.id) ||
                        (activeMetadataTab === "languages" && selectedLanguage === opt.id) ||
                        (activeMetadataTab === "regions" && selectedRegion === opt.id);

                      return (
                        <button
                          key={opt.id}
                          onClick={() => {
                            if (activeMetadataTab === "categories") setSelectedCategory(isSelected ? "" : opt.id);
                            if (activeMetadataTab === "countries") setSelectedCountry(isSelected ? "" : opt.id);
                            if (activeMetadataTab === "languages") setSelectedLanguage(isSelected ? "" : opt.id);
                            if (activeMetadataTab === "regions") setSelectedRegion(isSelected ? "" : opt.id);
                            setPage(1);
                          }}
                          className={`text-left px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                            isSelected
                              ? (darkMode 
                                  ? "bg-cabildo-yellow/15 text-yellow-400 font-semibold border-l-2 border-cabildo-yellow" 
                                  : "bg-cabildo-yellow/10 text-[#a88d00] font-bold border-l-2 border-cabildo-yellow")
                              : (darkMode ? "hover:bg-zinc-900 text-zinc-300" : "hover:bg-slate-100 text-slate-700")
                          }`}
                        >
                          <span className="truncate pr-2 flex items-center gap-1.5 font-secondary">
                            {activeMetadataTab === "countries" && getFlagEmoji(opt.id) + " "}
                            <span className="capitalize">{opt.name}</span>
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono border ${
                            darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-slate-100 border-slate-200 text-slate-500"
                          }`}>
                            {opt.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right panel: Channels list */}
          {!isCinemaMode && (
            <div id="iptv-controls-container" className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-[90px] self-start h-[600px] lg:h-[calc(100vh-120px)]">
            
            {/* Channels List Section Container */}
            <div className={`border rounded-2xl flex flex-col flex-1 shadow-xs overflow-hidden transition-colors min-h-0 ${
              darkMode
                ? "bg-zinc-950 border-zinc-900"
                : "bg-slate-50 border-slate-200 shadow-2xs"
            }`}>
              
              {/* Sidebar Tabs (Todos vs Favoritos vs PC) */}
              <div className={`flex border-b text-xs transition-colors ${
                darkMode ? "border-zinc-900 text-zinc-400" : "border-slate-200 text-slate-500"
              }`}>
                <button
                  onClick={() => {
                    setActiveTab("all");
                    setPage(1);
                  }}
                  className={`flex-1 py-3 px-2 md:px-4 text-[10px] md:text-[11px] text-center font-extrabold tracking-tight font-sans transition-all border-r flex items-center justify-center gap-1 md:gap-2 cursor-pointer ${
                    darkMode ? "border-zinc-900/60" : "border-slate-200/60"
                  } ${
                    activeTab === "all" 
                      ? (darkMode 
                          ? "bg-zinc-900/40 text-cabildo-yellow font-extrabold border-b-2 border-cabildo-yellow" 
                          : "bg-white text-[#004993] font-black border-b-2 border-cabildo-yellow") 
                      : (darkMode ? "hover:bg-zinc-900/40 hover:text-zinc-200" : "hover:bg-slate-100 hover:text-black")
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>APP</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("vlc");
                    setPage(1);
                  }}
                  className={`flex-1 py-3 px-2 md:px-4 text-[10px] md:text-[11px] text-center font-extrabold tracking-tight font-sans transition-all border-r flex items-center justify-center gap-1 md:gap-2 cursor-pointer ${
                    darkMode ? "border-zinc-900/60" : "border-slate-200/60"
                  } ${
                    activeTab === "vlc" 
                      ? (darkMode 
                          ? "bg-zinc-900/40 text-cabildo-yellow font-extrabold border-b-2 border-cabildo-yellow" 
                          : "bg-white text-[#004993] font-black border-b-2 border-cabildo-yellow") 
                      : (darkMode ? "hover:bg-zinc-900/40 hover:text-zinc-200" : "hover:bg-slate-100 hover:text-black")
                  }`}
                >
                  <MonitorPlay className="w-3.5 h-3.5 text-[#FF8800]" />
                  <span>PC/VLC</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("favorites");
                    setPage(1);
                  }}
                  className={`flex-1 py-3 px-2 md:px-4 text-[10px] md:text-[11px] text-center font-extrabold tracking-tight font-sans transition-all border-r flex items-center justify-center gap-1 md:gap-2 cursor-pointer ${
                    darkMode ? "border-zinc-900/60" : "border-slate-200/60"
                  } ${
                    activeTab === "favorites" 
                      ? (darkMode 
                          ? "bg-zinc-900/40 text-cabildo-yellow font-extrabold border-b-2 border-cabildo-yellow" 
                          : "bg-white text-[#004993] font-black border-b-2 border-cabildo-yellow") 
                      : (darkMode ? "hover:bg-zinc-900/40 hover:text-zinc-200" : "hover:bg-slate-100 hover:text-black")
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 text-rose-500 ${favorites.length > 0 ? "fill-current text-rose-500" : ""}`} />
                  <span>FAVS</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab("custom");
                    setPage(1);
                  }}
                  className={`flex-1 py-3 px-2 md:px-4 text-[10px] md:text-[11px] text-center font-extrabold tracking-tight font-sans transition-all flex items-center justify-center gap-1 md:gap-2 cursor-pointer ${
                    activeTab === "custom" 
                      ? (darkMode 
                          ? "bg-zinc-900/40 text-cabildo-yellow font-extrabold border-b-2 border-cabildo-yellow" 
                          : "bg-white text-[#004993] font-black border-b-2 border-cabildo-yellow") 
                      : (darkMode ? "hover:bg-zinc-900/40 hover:text-zinc-200" : "hover:bg-slate-100 hover:text-black")
                  }`}
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>M3U</span>
                </button>
              </div>

              <div className={`p-3 border-b flex items-center justify-between transition-colors ${
                darkMode ? "border-zinc-900/60" : "border-slate-200"
              }`}>
                <span className={`text-[10px] font-bold tracking-wider font-secondary ${
                  darkMode ? "text-zinc-500" : "text-slate-500"
                }`}>
                  {activeTab === "favorites" ? "MIS FAVORITOS GUARDADOS" 
                   : activeTab === "vlc" ? "CANALES SOLO PARA PC" 
                   : activeTab === "custom" ? "LISTAS Y CANALES M3U"
                   : "CANALES EN LÍNEA"} ({activeTotalResults.toLocaleString()} COINCIDENCIAS)
                </span>
                {activeTab === "all" && isLoadingChannels && (
                  <div className="w-3.5 h-3.5 border-2 border-cabildo-yellow/30 border-t-cabildo-yellow rounded-full animate-spin" />
                )}
              </div>

              {/* Scrollable list of channel items */}
              <div 
                className="flex-1 min-h-0 overflow-y-auto p-2 flex flex-col gap-1 text-sm"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  if (target.scrollHeight - Math.ceil(target.scrollTop) <= target.clientHeight + 250) {
                    if (activePage < activeTotalPages && !isLoadingChannels) {
                      setPage(p => p + 1);
                    }
                  }
                }}
              >
                {/* Custom Content Management Tools (Improvement 2) */}
                {activeTab === "custom" && (
                  <div className={`p-2.5 mb-2 rounded-xl border flex flex-col gap-2.5 transition-colors ${
                    darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-slate-100/75 border-slate-200"
                  }`}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowImportForm(!showImportForm);
                          setShowManualForm(false);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold font-secondary flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer border ${
                          showImportForm
                            ? "bg-emerald-600 text-white border-transparent font-extrabold"
                            : darkMode
                            ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cargar M3U</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowManualForm(!showManualForm);
                          setShowImportForm(false);
                        }}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold font-secondary flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer border ${
                          showManualForm
                            ? "bg-cabildo-yellow text-zinc-950 border-transparent font-extrabold"
                            : darkMode
                            ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                            : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Canal Manual</span>
                      </button>
                    </div>

                    {/* Import M3U Form */}
                    {showImportForm && (
                      <div className="flex flex-col gap-2 pt-1 font-secondary">
                        <textarea
                          value={m3uText}
                          onChange={(e) => setM3uText(e.target.value)}
                          placeholder={"#EXTM3U\n#EXTINF:-1 tvg-logo=\"logo_url\" group-title=\"Noticias\",Canal 1\nhttps://ejemplo.com/stream.m3u8"}
                          rows={4}
                          className={`w-full p-2 text-[10px] font-mono rounded-lg border outline-none transition-colors resize-none ${
                            darkMode 
                              ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-zinc-750" 
                              : "bg-white border-slate-200 text-slate-700 focus:border-slate-300"
                          }`}
                        />
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] leading-normal ${darkMode ? "text-zinc-500" : "text-slate-400"}`}>
                            Pega código M3U completo para procesarlo.
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!m3uText.trim()) return;
                              const imported = parseM3UPlaylist(m3uText);
                              if (imported.length > 0) {
                                setCustomChannels(prev => [...imported, ...prev]);
                                setM3uText("");
                                setShowImportForm(false);
                              } else {
                                alert("No se detectaron formatos de trasmisión válidos en M3U. Asegúrese de que existan URLs correctas (http/https).");
                              }
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[10px] px-3 py-1 rounded-md transition-colors cursor-pointer"
                          >
                            Importar {m3uText.split("\n").filter(l => l.trim().startsWith("http")).length || ""} canales
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Manual Channel Form */}
                    {showManualForm && (
                      <div className="flex flex-col gap-2 pt-1 font-secondary">
                        <div className="flex flex-col gap-1">
                          <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
                            Nombre del Canal *
                          </label>
                          <input
                            type="text"
                            value={manualName}
                            onChange={(e) => setManualName(e.target.value)}
                            placeholder="Ej. Canal Deportivo"
                            className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                              darkMode ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-zinc-700" : "bg-white border-slate-200 text-slate-700 focus:border-slate-300"
                            }`}
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
                            URL de Transmisión (HLS/.m3u8) *
                          </label>
                          <input
                            type="text"
                            value={manualUrl}
                            onChange={(e) => setManualUrl(e.target.value)}
                            placeholder="https://servidor.com/live.m3u8"
                            className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                              darkMode ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-zinc-700" : "bg-white border-slate-200 text-slate-700"
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-1">
                            <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
                              Logotipo URL
                            </label>
                            <input
                              type="text"
                              value={manualLogo}
                              onChange={(e) => setManualLogo(e.target.value)}
                              placeholder="https://enlace.com/logo.png"
                              className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                                darkMode ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-zinc-700" : "bg-white border-slate-200 text-slate-700"
                              }`}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
                              Categoría / Grupo
                            </label>
                            <input
                              type="text"
                              value={manualCategory}
                              onChange={(e) => setManualCategory(e.target.value)}
                              placeholder="Ej. Deportes"
                              className={`w-full px-2 py-1.5 text-xs rounded-lg border outline-none transition-colors ${
                                darkMode ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-zinc-700" : "bg-white border-slate-200 text-slate-700"
                              }`}
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (!manualName.trim() || !manualUrl.trim()) return;
                            const id = `custom_${Math.random().toString(36).substr(2, 9)}`;
                            const newChan: IPTVChannel = {
                              id,
                              name: manualName.trim(),
                              logo: manualLogo.trim() || null,
                              countries: ["M3U"],
                              languages: ["es"],
                              categories: [(manualCategory.trim() || "Personalizado").toLowerCase().replace(/\s+/g, "_")],
                              streamUrl: manualUrl.trim(),
                              isHttps: manualUrl.trim().startsWith("https://"),
                              status: "online",
                              countryNames: ["Personalizado"],
                              languageNames: ["Español"],
                              categoryNames: [manualCategory.trim() || "Personalizado"]
                            };
                            setCustomChannels(prev => [newChan, ...prev]);
                            setManualName("");
                            setManualUrl("");
                            setManualLogo("");
                            setManualCategory("");
                            setShowManualForm(false);
                          }}
                          disabled={!manualName.trim() || !manualUrl.trim()}
                          className="bg-cabildo-yellow hover:bg-yellow-400 disabled:bg-neutral-800 disabled:text-zinc-500 text-zinc-950 font-extrabold text-[10px] py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Guardar Canal
                        </button>
                      </div>
                    )}

                    {/* Clear custom channels */}
                    {customChannels.length > 0 && (
                      <div className="flex items-center justify-between border-t border-dashed border-neutral-800/15 dark:border-neutral-800/30 pt-2 bg-transparent">
                        <span className={`text-[9px] font-bold uppercase ${darkMode ? "text-zinc-500" : "text-slate-400"}`}>
                          Tienes {customChannels.length} canales guardados
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if(window.confirm("¿Estás seguro de que quieres borrar todos tus canales personalizados cargados?")) {
                              setCustomChannels([]);
                            }
                          }}
                          className="text-[9px] font-extrabold text-red-500 hover:text-red-400 flex items-center gap-1 cursor-pointer hover:underline uppercase"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Limpiar Todo</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                 {displayedChannels.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    {activeTab === "favorites" ? (
                      <>
                        <Heart className="w-10 h-10 text-zinc-650 mb-2" />
                        <span className={`font-semibold font-secondary text-xs ${
                          darkMode ? "text-zinc-300" : "text-slate-700"
                        }`}>No tienes favoritos aún</span>
                        <span className="text-zinc-500 text-[10px] mt-1 pr-4 pl-4 max-w-xs font-secondary">
                          Marca los canales con el botón de corazón para guardarlos de forma persistente.
                        </span>
                      </>
                    ) : activeTab === "vlc" ? (
                      <>
                        <MonitorPlay className="w-10 h-10 text-zinc-650 mb-2" />
                        <span className={`font-semibold font-secondary text-xs ${
                          darkMode ? "text-zinc-300" : "text-slate-700"
                        }`}>Agrega canales desde el reproductor</span>
                        <span className="text-zinc-500 text-[10px] mt-1 pr-4 pl-4 max-w-xs font-secondary">
                          Aquellos canales bloqueados en la web pueden ser enviados aquí para abrirlos en PC con clics fáciles.
                        </span>
                      </>
                    ) : activeTab === "custom" ? (
                      <>
                        <Upload className="w-10 h-10 text-zinc-650 mb-2" />
                        <span className={`font-semibold font-secondary text-xs ${
                          darkMode ? "text-zinc-300" : "text-slate-700"
                        }`}>No has cargado canales M3U</span>
                        <span className="text-zinc-500 text-[10px] mt-1 pr-4 pl-4 max-w-xs font-secondary">
                          Usa los botones superiores para pegar una lista M3U o registrar cualquier transmisión libre de tu agrado.
                        </span>
                      </>
                    ) : (
                      <>
                        <FilterX className="w-10 h-10 text-zinc-550 mb-2" />
                        <span className={`font-semibold font-secondary text-xs ${
                          darkMode ? "text-zinc-300" : "text-slate-700"
                        }`}>No se encontraron canales</span>
                        <span className="text-zinc-500 text-[10px] mt-1 pr-4 pl-4 font-secondary">
                          Intenta borrar o ajustar tus filtros o desactivar la casilla de solo HTTPS.
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  displayedChannels.map((chan) => {
                    const isActive = activeChannel?.id === chan.id;
                    const isChanFav = isFavorite(chan.id);
                    return (
                      <motion.div
                        key={chan.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => handleSelectChannel(chan)}
                        className={`group/item flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left border ${
                          isActive 
                            ? (darkMode 
                                ? "bg-cabildo-blue/15 border-[#004993]/40 text-blue-300 ring-1 ring-cabildo-blue/20" 
                                : "bg-cabildo-blue/10 border-cabildo-blue/30 text-[#004993] ring-1 ring-cabildo-blue/20") 
                            : (darkMode 
                                ? "bg-transparent border-transparent hover:bg-zinc-900/80 hover:border-zinc-800 text-zinc-300 hover:text-white"
                                : "bg-transparent border-transparent hover:bg-slate-100 hover:border-slate-200 text-slate-700 hover:text-black")
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate pr-2">
                          <div className={`w-11 h-11 bg-white border shadow-xs p-1 rounded-lg flex items-center justify-center flex-shrink-0 relative transition-colors ${
                            darkMode ? "border-zinc-800" : "border-slate-200"
                          }`}>
                            {chan.logo ? (
                              <img
                                src={chan.logo}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <Tv className="w-5 h-5 text-zinc-400" />
                            )}
                            {/* Overlay check for active channel */}
                            {isActive && (
                              <div className="absolute -top-1 -right-1 p-0.5 bg-cabildo-yellow text-black rounded-full text-[9px] shadow-sm">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          
                          <div className="truncate flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs sm:text-sm truncate">
                                {chan.name}
                              </span>
                              {checkingChannel === chan.id && (
                                <div className="w-2.5 h-2.5 flex-shrink-0 animate-spin border-2 border-cabildo-yellow/30 border-t-cabildo-yellow rounded-full" title="Verificando..." />
                              )}
                              {channelStatusCache[chan.id] === false && (
                                <span className="bg-red-950/40 text-[9px] text-red-400 px-1.5 py-[1px] rounded border border-red-900/30 uppercase tracking-wide font-bold">
                                  Offline
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-secondary">
                              <span>{chan.countryNames[0] || "Internacional"}</span>
                              <span>•</span>
                              <span className="capitalize">{chan.categoryNames?.[0] || chan.categories[0] || "Gral."}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions container */}
                        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          {/* Trash button for custom channels */}
                          {chan.id.startsWith("custom_") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Quieres borrar el canal "${chan.name}" de tus personalizados?`)) {
                                  setCustomChannels(prev => prev.filter(c => c.id !== chan.id));
                                  if (activeChannel?.id === chan.id) {
                                    setActiveChannel(null);
                                  }
                                }
                              }}
                              className={`p-1.5 border rounded-lg transition-colors cursor-pointer border-transparent text-red-500 hover:bg-red-500/10 hover:border-red-500/20`}
                              title="Borrar canal de la lista"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Heart toggle directly in list */}
                          <button
                            onClick={() => toggleFavorite(chan)}
                            className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                              isChanFav 
                                ? "bg-rose-950/25 border-rose-900/30 text-rose-400" 
                                : `opacity-0 group-hover/item:opacity-100 border text-zinc-500 hover:text-black hover:opacity-100 transition-opacity ${
                                    darkMode 
                                      ? "bg-zinc-900 border-zinc-800 hover:text-white hover:border-zinc-700" 
                                      : "bg-slate-100 border-slate-300 hover:bg-slate-200 hover:border-slate-400"
                                  }`
                            }`}
                            title={isChanFav ? "Quitar de favoritos" : "Añadir a favoritos"}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isChanFav ? "fill-current text-rose-500" : ""}`} />
                          </button>

                          {isActive ? (
                            <span className={`px-2 py-1 font-bold font-secondary text-[10px] rounded-md border ${
                              darkMode 
                                ? "bg-cabildo-yellow/20 border-cabildo-yellow/40 text-yellow-500" 
                                : "bg-cabildo-yellow/20 border-cabildo-yellow/50 text-[#ccab00]"
                            }`}>
                              EMITIENDO
                            </span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSelectChannel(chan); }}
                              className={`opacity-0 group-hover/item:opacity-100 p-1.5 border hover:text-black rounded-lg transition-all focus:opacity-100 cursor-pointer ${
                                darkMode 
                                  ? "bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-cabildo-yellow hover:border-cabildo-yellow" 
                                  : "bg-slate-200 border-slate-300 text-slate-700 hover:bg-cabildo-yellow hover:border-cabildo-yellow"
                              }`}
                              title="Reproducir ahora"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Loading Indicator for Infinite Scroll */}
              {isLoadingChannels && activePage > 1 && (
                <div className={`p-3 border-t flex flex-col items-center justify-center text-xs transition-colors rounded-b-2xl ${
                  darkMode 
                    ? "border-zinc-900 bg-zinc-950/90 text-zinc-400" 
                    : "border-slate-200 bg-slate-100/60 text-slate-650"
                }`}>
                  <div className="w-5 h-5 border-2 border-cabildo-yellow/30 border-t-cabildo-yellow rounded-full animate-spin mb-1" />
                  <span className="font-secondary">Cargando más canales...</span>
                </div>
              )}
            </div>

          </div>
          )}

        </div>
      </main>

      {/* Humble platform footer */}
      <footer className={`border-t py-8 px-4 sm:px-6 lg:px-8 mt-12 text-center text-xs transition-colors ${
        darkMode 
          ? "border-zinc-900 bg-zinc-950/40 text-zinc-500" 
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}>
        <div className="w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Tv className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-[#004993]'}`} />
            <span className="font-bold font-secondary">Desarrollado por Aitor Santana © 2026</span>
          </div>
          <p className={`max-w-md sm:text-right leading-relaxed font-secondary truncate-xs ${
            darkMode ? "text-zinc-600" : "text-slate-400"
          }`}>
            Ninguna señal de video es alojada ni transmitida por esta aplicación. Todos los flujos provienen directamente de listas públicas compartidas colectivamente por los creadores en GitHub.
          </p>
        </div>
      </footer>
      
      {/* Recently Viewed Bar (Fixed Bottom) */}
      {recentChannels.length > 0 && (
        <div className={`fixed flex items-center bottom-0 left-0 right-0 z-40 border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-colors h-14 ${
          darkMode ? "bg-zinc-950/95 backdrop-blur border-zinc-800" : "bg-white/95 backdrop-blur border-slate-200"
        }`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 mx-auto flex items-center justify-start gap-3 overflow-x-auto no-scrollbar">
            <span className={`text-[10px] font-bold tracking-wider whitespace-nowrap hidden sm:inline-block ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
              VISTOS RECIENTEMENTE
            </span>
            <div className="h-4 w-px bg-zinc-800 hidden sm:block mx-1"></div>
            {recentChannels.map((chan, idx) => {
              const isActive = activeChannel?.id === chan.id;
              return (
                <button
                  key={`recent-${chan.id}-${idx}`}
                  onClick={() => handleSelectChannel(chan)}
                  className={`flex items-center gap-2 flex-shrink-0 px-3 py-1.5 rounded-full border text-xs whitespace-nowrap cursor-pointer transition-all ${
                    isActive
                      ? (darkMode ? "bg-cabildo-blue/20 border-cabildo-blue/50 text-blue-300 ring-1 ring-cabildo-blue/20" : "bg-cabildo-blue/10 border-cabildo-blue/30 text-[#004993] ring-1 ring-cabildo-blue/20")
                      : (darkMode ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white" : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-black")
                  }`}
                  title={chan.name}
                >
                  {chan.logo ? (
                    <img 
                      src={chan.logo} 
                      className="w-3.5 h-3.5 rounded-[2px] object-contain flex-shrink-0" 
                      referrerPolicy="no-referrer" 
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }} 
                    />
                  ) : <Tv className="w-3 h-3 flex-shrink-0 opacity-70" />}
                  <span className="font-semibold max-w-[120px] truncate font-secondary">{chan.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
