/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Clock, Calendar, ChevronDown, ChevronUp, Radio } from "lucide-react";
import { getChannelEPG, EPGProgram } from "../utils";

interface EPGGuideProps {
  channelId: string;
  channelName: string;
  category: string;
  darkMode: boolean;
}

export default function EPGGuide({ channelId, channelName, category, darkMode }: EPGGuideProps) {
  const [schedule, setSchedule] = useState<EPGProgram[]>([]);
  const [currentShow, setCurrentShow] = useState<EPGProgram | null>(null);
  const [nextShow, setNextShow] = useState<EPGProgram | null>(null);
  const [showProgress, setShowProgress] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedShowIndex, setSelectedShowIndex] = useState<number | null>(null);

  useEffect(() => {
    // Generate scheduling for the channel
    const programs = getChannelEPG(channelId, category, channelName);
    setSchedule(programs);
    setSelectedShowIndex(null); // Reset detail selector
  }, [channelId, category, channelName]);

  // Keep calculating elapsed progress and currently active shows every 15 seconds
  useEffect(() => {
    const updateShowStatus = () => {
      if (schedule.length === 0) return;
      const now = new Date();

      // Find active show
      const activeIndex = schedule.findIndex(
        (show) => now >= show.start && now < show.end
      );

      if (activeIndex !== -1) {
        const active = schedule[activeIndex];
        const next = schedule[activeIndex + 1] || null;
        setCurrentShow(active);
        setNextShow(next);

        // Calculate progress percentage
        const totalDuration = active.end.getTime() - active.start.getTime();
        const elapsed = now.getTime() - active.start.getTime();
        const pct = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
        setShowProgress(pct);
      } else {
        // Fallback or outside of timeline
        setCurrentShow(schedule[0] || null);
        setNextShow(schedule[1] || null);
        setShowProgress(0);
      }
    };

    updateShowStatus();
    const interval = setInterval(updateShowStatus, 15000);
    return () => clearInterval(interval);
  }, [schedule]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (schedule.length === 0) return null;

  return (
    <div
      id={`epg-container-${channelId}`}
      className={`rounded-2xl border p-4 shadow-sm transition-all duration-300 ${
        darkMode ? "bg-zinc-950/40 border-zinc-900" : "bg-white border-slate-200"
      }`}
    >
      {/* Realtime Active Show Header Block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-dashed border-neutral-800/15 dark:border-neutral-800/50">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className={`text-[10px] uppercase font-bold tracking-wider ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
              EN EMISIÓN AHORA
            </p>
          </div>

          {currentShow ? (
            <div>
              <h3 className={`text-base font-extrabold tracking-tight ${darkMode ? "text-zinc-100" : "text-slate-800"}`}>
                {currentShow.title}
              </h3>
              <p className={`text-xs mt-1 leading-relaxed ${darkMode ? "text-zinc-400" : "text-slate-600"}`}>
                {currentShow.description}
              </p>
              
              {/* Progress Line */}
              <div className="mt-3 flex items-center gap-3">
                <span className={`text-[11px] font-mono leading-none ${darkMode ? "text-zinc-500" : "text-slate-400"}`}>
                  {formatTime(currentShow.start)}
                </span>
                <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cabildo-yellow transition-all duration-1000"
                    style={{ width: `${showProgress}%` }}
                  />
                </div>
                <span className={`text-[11px] font-mono leading-none ${darkMode ? "text-zinc-500" : "text-slate-400"}`}>
                  {formatTime(currentShow.end)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Cargando programación del canal...</p>
          )}
        </div>

        {/* Up Next Preview Panel */}
        {nextShow && (
          <div className={`md:w-64 p-3 rounded-xl border border-dotted ${
            darkMode ? "bg-zinc-900/40 border-zinc-800" : "bg-slate-50 border-slate-200"
          }`}>
            <p className={`text-[9px] uppercase font-bold tracking-widest ${darkMode ? "text-zinc-400" : "text-slate-500"}`}>
              A CONTINUACIÓN
            </p>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className={`text-[10px] font-bold font-mono ${darkMode ? "text-cabildo-yellow" : "text-amber-600"}`}>
                {formatTime(nextShow.start)}
              </span>
              <h4 className={`text-xs font-extrabold truncate max-w-[150px] ${darkMode ? "text-zinc-200" : "text-slate-700"}`} title={nextShow.title}>
                {nextShow.title}
              </h4>
            </div>
            <p className={`text-[10px] mt-0.5 line-clamp-2 leading-normal ${darkMode ? "text-zinc-500" : "text-slate-500"}`}>
              {nextShow.description}
            </p>
          </div>
        )}
      </div>

      {/* Accordion Expandable Full Timeline */}
      <div className="mt-2.5">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors cursor-pointer ${
            darkMode ? "hover:bg-zinc-900 text-zinc-400" : "hover:bg-slate-100 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cabildo-yellow" />
            <span className="font-bold">Ver Guía Horaria Completa (24h)</span>
          </div>
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {isExpanded && (
          <div className="mt-3 grid grid-cols-1 gap-1 border-t pt-3 border-neutral-800/10 dark:border-neutral-800/40">
            <div className="max-h-60 overflow-y-auto pr-1 flex flex-col gap-1">
              {schedule.map((show, idx) => {
                const now = new Date();
                const isActive = now >= show.start && now < show.end;
                const isSelected = selectedShowIndex === idx;

                return (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => setSelectedShowIndex(isSelected ? null : idx)}
                      className={`w-full text-left p-2 rounded-lg flex items-center justify-between gap-4 text-xs select-none transition-colors border ${
                        isActive
                          ? "bg-cabildo-yellow/10 border-cabildo-yellow/20 font-bold"
                          : isSelected
                          ? "bg-zinc-800/30 border-zinc-700"
                          : darkMode
                          ? "hover:bg-zinc-900 border-transparent text-zinc-300"
                          : "hover:bg-slate-50 border-transparent text-slate-700"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          isActive
                            ? "bg-cabildo-yellow text-zinc-950 font-extrabold"
                            : darkMode
                            ? "bg-zinc-900 text-zinc-400"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                          {formatTime(show.start)} - {formatTime(show.end)}
                        </span>
                        <span className="truncate max-w-[200px] sm:max-w-md">{show.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold uppercase tracking-wider scale-90">
                            En vivo
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500">
                          {isSelected ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </span>
                      </div>
                    </button>

                    {/* Popover Description Details */}
                    {isSelected && (
                      <div className={`p-2.5 mx-2 mb-1.5 -mt-1 rounded-b-lg text-[11px] leading-relaxed border-x border-b ${
                        darkMode 
                          ? "bg-zinc-900/30 border-zinc-800 text-zinc-400" 
                          : "bg-slate-50/50 border-slate-200 text-slate-600"
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1 text-[9px] text-zinc-500 uppercase font-mono">
                          <Clock className="w-3 h-3" />
                          <span>Duración: {Math.round((show.end.getTime() - show.start.getTime()) / 60000)} minutos</span>
                        </div>
                        {show.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
