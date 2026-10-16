import React, { useState } from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  FastForward,
  Bell,
  ChevronUp,
  ChevronDown,
  Clock,
  MapPin,
  ExternalLink
} from 'lucide-react';
import type { EventLogItem } from '../types/simulation';

interface BottomTimelineProps {
  currentTick: number;
  maxTicks: number;
  timestampStr: string;
  isRunning: boolean;
  onTogglePlay: () => void;
  onStepForward: (steps: number) => void;
  onReset: () => void;
  onScrubTimeline: (tick: number) => void;
  events: EventLogItem[];
  allMilestones?: EventLogItem[];
  playbackSpeed: number;
  onChangeSpeed: (speed: number) => void;
}

export const BottomTimeline: React.FC<BottomTimelineProps> = ({
  currentTick,
  maxTicks,
  timestampStr,
  isRunning,
  onTogglePlay,
  onStepForward,
  onReset,
  onScrubTimeline,
  events,
  allMilestones = [],
  playbackSpeed,
  onChangeSpeed
}) => {
  const [showEventFeed, setShowEventFeed] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<EventLogItem | null>(null);

  // Fallback milestone list if not passed
  const displayMilestones = allMilestones.length > 0 ? allMilestones : events;

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden select-none">
      {/* Main Playback Bar */}
      <div className="p-3.5 flex flex-col md:flex-row items-center gap-4">
        {/* Playback Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-2 transition shadow-md ${
              isRunning
                ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/25'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isRunning ? 'PAUSE' : 'RUN SIMULATION'}</span>
          </button>

          <button
            onClick={() => onStepForward(1)}
            className="p-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            title="Step Forward 1 Tick"
          >
            <StepForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => onStepForward(5)}
            className="p-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
            title="Fast Step (+5 Ticks)"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            className="p-2.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
            title="Reset Timeline to T+00:00"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-full p-0.5 text-xs font-semibold">
            {[1, 2, 4].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-3 py-1 rounded-full transition ${
                  playbackSpeed === s ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Scrubber & Interactive Event Markers */}
        <div className="flex-1 flex items-center gap-3 w-full">
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{timestampStr}</span>
            <span className="text-[10px] text-slate-400 font-normal">({currentTick}/{maxTicks})</span>
          </div>

          <div className="flex-1 relative flex items-center h-8">
            {/* Interactive Milestone Event Pins on Track */}
            <div className="absolute inset-x-0 h-2 top-3 pointer-events-none">
              {displayMilestones.map((ev, i) => {
                const pct = Math.max(0, Math.min(100, (ev.tick / maxTicks) * 100));
                const isCrit = ev.level === 'CRITICAL' || (ev as any).severity === 'critical';
                const isWarn = ev.level === 'WARNING' || (ev as any).severity === 'warning';
                const isAction = ev.level === 'ACTION';

                return (
                  <div
                    key={ev.id || i}
                    onClick={(e) => {
                      e.stopPropagation();
                      onScrubTimeline(ev.tick);
                    }}
                    onMouseEnter={() => setHoveredEvent(ev)}
                    onMouseLeave={() => setHoveredEvent(null)}
                    style={{ left: `${pct}%` }}
                    className={`absolute -top-1.5 -translate-x-1/2 w-4 h-4 rounded-full cursor-pointer pointer-events-auto transition hover:scale-125 z-10 border-2 border-white shadow-sm flex items-center justify-center ${
                      isCrit ? 'bg-rose-500' : isWarn ? 'bg-amber-500' : isAction ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    title={`[${ev.timestamp_str || `T+${ev.tick}`}] ${ev.title || ev.description}`}
                  >
                    <span className="w-1 h-1 rounded-full bg-white" />
                  </div>
                );
              })}
            </div>

            {/* Scrubber Range Slider */}
            <input
              type="range"
              min="0"
              max={maxTicks}
              value={currentTick}
              onChange={(e) => onScrubTimeline(Number(e.target.value))}
              className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg cursor-pointer relative z-0"
            />

            {/* Hover Tooltip for Milestone */}
            {hoveredEvent && (
              <div
                style={{
                  left: `${Math.max(10, Math.min(90, (hoveredEvent.tick / maxTicks) * 100))}%`
                }}
                className="absolute -top-11 -translate-x-1/2 bg-slate-900 text-white px-2.5 py-1 rounded-xl text-[10px] font-mono shadow-xl pointer-events-none z-30 whitespace-nowrap border border-slate-700 animate-in fade-in duration-100"
              >
                <span className="text-blue-400 font-bold">[{hoveredEvent.timestamp_str || `T+${hoveredEvent.tick}`}]</span>{' '}
                {hoveredEvent.title || hoveredEvent.description}
              </div>
            )}
          </div>
        </div>

        {/* Real-time Alert Drawer Toggle */}
        <button
          onClick={() => setShowEventFeed(!showEventFeed)}
          className={`px-3.5 py-2 rounded-full border text-xs font-bold flex items-center gap-1.5 transition shrink-0 ${
            events.length > 0
              ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 shadow-sm'
              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${events.length > 0 ? 'text-rose-600 animate-bounce' : 'text-slate-400'}`} />
          <span>ALERTS ({events.length})</span>
          {showEventFeed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Alert Log Feed with Click-to-Jump replay */}
      {showEventFeed && (
        <div className="border-t border-slate-100 bg-slate-50/70 p-3 max-h-44 overflow-y-auto space-y-1.5 text-xs font-mono">
          <div className="text-[10px] text-slate-400 flex items-center justify-between pb-1 px-1">
            <span>HISTORICAL INCIDENT LOG · CLICK ANY EVENT TO REPLAY TIMESTEP</span>
            <span>{events.length} RECORDED EVENTS</span>
          </div>
          {events.length === 0 ? (
            <div className="text-slate-400 text-center py-2">No critical alert warnings recorded at this timestep.</div>
          ) : (
            events.map((ev, i) => (
              <div
                key={i}
                onClick={() => onScrubTimeline(ev.tick)}
                className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition cursor-pointer group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-blue-600 font-bold group-hover:underline">
                    [{ev.timestamp_str || (ev as any).time || 'T+00:00'}]
                  </span>
                  <span className="text-slate-800">{ev.description || ev.title || (ev as any).text || 'Event'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    (ev.level === 'CRITICAL' || (ev as any).severity === 'critical')
                      ? 'bg-rose-100 text-rose-800'
                      : (ev.level === 'WARNING' || (ev as any).severity === 'warning')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {ev.level || (ev as any).severity || 'INFO'}
                  </span>
                  <span className="text-[10px] text-blue-600 font-sans font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-0.5">
                    Jump <ExternalLink className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
