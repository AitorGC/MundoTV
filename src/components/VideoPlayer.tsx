/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, ChangeEvent } from "react";
import Hls from "hls.js";
import { Play, Pause, Volume2, VolumeX, Maximize2, Tv, AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  src: string;
  title: string;
  logo: string | null;
  isHttps: boolean;
  onAutoPlayFailed?: () => void;
  onMarkAsVlc?: () => void;
}

export default function VideoPlayer({ src, title, logo, isHttps, onMarkAsVlc }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset states on source update
    setError(null);
    setIsLoading(true);
    setIsPlaying(false);

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if it is a valid live stream url
    if (!src) {
      setError("No se ha proporcionado una dirección de transmisión (URL).");
      setIsLoading(false);
      return;
    }

    // Alert for mixed content issues
    if (!isHttps && window.location.protocol === "https:") {
      console.warn("Mixed content warning for stream:", src);
    }

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxMaxBufferLength: 15,
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Autoplay blocked by browser policy, waiting for user click:", err);
            setIsPlaying(false);
          });
      });

      let retryCount = 0;

      hls.on(Hls.Events.ERROR, (_, data) => {
        console.error("HLS error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (retryCount < 3) {
                retryCount++;
                console.warn(`HLS Network error... auto-reconnecting (${retryCount}/3)`);
                setError(`Conexión inestable... reintentando auto-conexión (${retryCount}/3)...`);
                setIsLoading(true);
                setTimeout(() => {
                  if (hlsRef.current) hlsRef.current.startLoad();
                }, 2000);
              } else {
                setError("Error de red persistente. El servidor del canal no responde o bloquea la conexión.");
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError("Error de medio. No se puede decodificar este formato de video. Reintentando...");
              hls.recoverMediaError();
              break;
            default:
              setError("No se pudo iniciar la transmisión de este canal.");
              hls.destroy();
              setIsLoading(false);
              break;
          }
        }
      });
    } else if (video.canPlayType("application/x-mpegURL") || video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS support
      video.src = src;
      video.addEventListener("loadedmetadata", () => {
        setIsLoading(false);
        video.play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      });
      video.addEventListener("error", () => {
        setError("Error de reproducción nativa en el navegador.");
        setIsLoading(false);
      });
    } else {
      setError("Tu navegador no soporta la reproducción de flujos HLS (.m3u8).");
      setIsLoading(false);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, isHttps]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || error) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Playback error:", err));
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
      video.muted = true;
    } else {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if ((video as any).webkitRequestFullscreen) {
      (video as any).webkitRequestFullscreen(); // Safari
    } else if ((video as any).msRequestFullscreen) {
      (video as any).msRequestFullscreen(); // IE11
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar eventos si el usuario está escribiendo en campos de texto
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const video = videoRef.current;
      if (!video) return;

      switch(e.key.toLowerCase()) {
        case ' ': // Space = Play/Pause
          e.preventDefault();
          togglePlay();
          break;
        case 'm': // M = Mute
          e.preventDefault();
          toggleMute();
          break;
        case 'f': // F = Fullscreen
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'arrowup': // Up = Volume Up
          e.preventDefault();
          setVolume(prev => {
            const newVol = Math.min(1, prev + 0.05);
            video.volume = newVol;
            if(newVol > 0) {
              setIsMuted(false);
              video.muted = false;
            }
            return newVol;
          });
          break;
        case 'arrowdown': // Down = Volume Down
          e.preventDefault();
          setVolume(prev => {
            const newVol = Math.max(0, prev - 0.05);
            video.volume = newVol;
            if(newVol === 0) {
              setIsMuted(true);
              video.muted = true;
            }
            return newVol;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, error]);

  return (
    <div id="iptv-player-container" className="relative group aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-neutral-800">
      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Glassmorphism Title bar */}
      <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none opacity-100 transition-opacity duration-300">
        <div className="flex items-center gap-3">
          {logo ? (
            <img
              src={logo}
              alt=""
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-md bg-white p-1 object-contain shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-md bg-neutral-800 flex items-center justify-center">
              <Tv className="w-4 h-4 text-neutral-400" />
            </div>
          )}
          <span className="text-white font-medium text-sm md:text-base drop-shadow-md truncate max-w-[250px] sm:max-w-md">
            {title || "Selecciona un canal para comenzar"}
          </span>
        </div>
        {!isHttps && (
          <span className="px-2.5 py-0.5 bg-amber-500/90 text-black font-semibold text-[10px] rounded-full shadow-lg">
            HTTP (Mixto)
          </span>
        )}
      </div>

      {/* Loading overlay */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 z-10">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-[#004993]/50 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="mt-4 text-neutral-400 text-sm font-medium animate-pulse">
            Cargando flujo de video...
          </p>
        </div>
      )}

      {/* Error / Fallback display */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/95 px-6 py-4 text-center z-10 border border-red-950/20">
          <AlertCircle className="w-12 h-12 text-red-500 mb-3" />
          <h4 className="text-white font-semibold text-base mb-1">
            No se pudo reproducir la transmisión
          </h4>
          <p className="text-neutral-400 text-xs max-w-md mb-4 leading-relaxed">
            {error}
          </p>
          
          {!isHttps && window.location.protocol === "https:" && (
            <div className="bg-amber-950/40 border border-amber-900/30 rounded-xl p-3 max-w-sm text-left mb-4">
              <p className="text-amber-300 text-[11px] leading-relaxed font-medium">
                ⚠️ <strong>Causa posible: Contenido Mixto Blorqueado.</strong> Este canal transmite mediante HTTP ("http://..."). Como esta app corre bajo HTTPS seguro, tu navegador bloquea la conexión insegura por defecto de forma silenciosa.
              </p>
              <p className="text-neutral-400 text-[10px] mt-1.5 leading-relaxed">
                Prueba activando "Solo canales HTTPS" en los filtros o permitiendo "Contenido no seguro" en la configuración de privacidad del sitio de tu navegador.
              </p>
            </div>
          )}

          {isHttps && error.includes("red") && (
            <div className="bg-red-950/40 border border-red-900/30 rounded-xl p-3 max-w-sm flex flex-col items-center mb-4">
              <p className="text-red-300 text-[11px] leading-relaxed font-medium mb-3 text-center">
                Es posible que este canal bloquee la reproducción en navegadores.
              </p>
              <div className="flex flex-col gap-2 w-full">
                <a
                  href={`vlc://${src}`}
                  className="bg-[#FF8800] hover:bg-[#e67a00] text-white text-[11px] font-bold py-2.5 px-4 rounded-lg flex items-center justify-center transition-colors shadow-md w-full"
                  title="Requiere tener VLC instalado y el protocolo vlc:// habilitado en tu sistema"
                >
                  <Play className="w-3.5 h-3.5 fill-current mr-1.5" />
                  ABRIR DIRECTAMENTE EN VLC
                </a>
                <a
                  href={`data:audio/x-mpegurl;charset=utf-8,${encodeURIComponent(`#EXTM3U\n#EXTINF:-1,${title}\n${src}`)}`}
                  download={`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.m3u`}
                  className="bg-red-950 hover:bg-red-900 border border-red-900/50 text-red-200 text-[10px] font-bold py-1.5 px-4 rounded-lg flex items-center justify-center transition-colors w-full"
                >
                  O descargar archivo .m3u
                </a>
                {onMarkAsVlc && (
                  <button
                    onClick={onMarkAsVlc}
                    className="bg-neutral-800 hover:bg-neutral-700 border border-neutral-700/50 text-neutral-300 text-[10px] font-bold py-1.5 px-4 rounded-lg flex items-center justify-center transition-colors w-full mt-1 outline-none cursor-pointer"
                  >
                    Ocultar este canal en la web (Mover a pestaña PC)
                  </button>
                )}
              </div>
            </div>
          )}

          <span className="text-[11px] text-zinc-500 font-mono select-all truncate max-w-xs sm:max-w-sm">
            URL: {src}
          </span>
        </div>
      )}

      {/* Control overlay */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-300 flex flex-col gap-3">
        
        {/* Playback Controls & Volume & Fullscreen */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              id="iptv-play-toggle-btn"
              onClick={togglePlay}
              disabled={!!error}
              className="p-2 bg-cabildo-yellow hover:bg-[#e6c000] text-black rounded-full transition-transform hover:scale-105 active:scale-95 shadow-md disabled:bg-neutral-800 disabled:text-neutral-600 disabled:scale-100 cursor-pointer"
              title={isPlaying ? "Pausar (Espacio)" : "Reproducir (Espacio)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 group/volume">
              <button
                id="iptv-mute-toggle-btn"
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Quitar silencio (M)" : "Silenciar (M)"}
              >
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                id="iptv-volume-slider"
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-cabildo-yellow h-1 bg-neutral-800 rounded-lg cursor-pointer max-w-[0px] group-hover/volume:max-w-[80px] focus:max-w-[80px] transition-all duration-300"
                title="Volumen (Flechas Arriba/Abajo)"
              />
            </div>
          </div>

          <button
            id="iptv-fullscreen-btn"
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title="Pantalla completa (F)"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
