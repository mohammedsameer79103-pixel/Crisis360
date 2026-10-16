import React, { useState } from 'react';
import {
  BarChart3,
  Network,
  Users,
  Brain,
  Truck,
  AlertOctagon,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Droplets,
  Radio,
  SendHorizontal,
  FileText,
  ShieldCheck,
  TrendingDown,
  Info,
  CornerDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid
} from 'recharts';
import type { BranchTickMetrics, FullSimulationResponse, BranchId } from '../types/simulation';
import { generateCopilotAnalysis } from '../services/copilotEngine';

interface AnalyticsDeckProps {
  currentMetrics: BranchTickMetrics;
  simulationData: FullSimulationResponse;
  activeBranch: BranchId;
  onDispatchAction: (actionType: string) => void;
  onOpenReportModal?: () => void;
}

export const AnalyticsDeck: React.FC<AnalyticsDeckProps> = ({
  currentMetrics,
  simulationData,
  activeBranch,
  onDispatchAction,
  onOpenReportModal
}) => {
  const [activeTab, setActiveTab] = useState<'charts' | 'copilot' | 'cascade' | 'evacuation' | 'logistics'>('copilot');

  // Explainable AI Copilot Analysis
  const copilot = generateCopilotAnalysis(
    simulationData.config,
    simulationData.city,
    currentMetrics,
    activeBranch,
    simulationData
  );

  // Chart data generation across all 3 branches
  const chartData = simulationData.branch_A.timeline
    .filter((_, idx) => idx % 2 === 0)
    .map((tickA, idx) => {
      const tickB = simulationData.branch_B.timeline[idx] || tickA;
      const tickC = simulationData.branch_C.timeline[idx] || tickA;
      return {
        time: tickA.timestamp_str,
        'Branch A (No Intervention)': tickA.residual_risk_pct,
        'Branch B (Early Intervention)': tickB.residual_risk_pct,
        'Branch C (Resource-Constrained)': tickC.residual_risk_pct,
        'Loss A (₹ Cr)': tickA.economic_loss_cr,
        'Loss B (₹ Cr)': tickB.economic_loss_cr,
      };
    });

  // Calculate shelter occupancy from real metrics
  const totalEvac = currentMetrics.people_evacuated || 0;
  const shelter1Cap = 12000;
  const shelter2Cap = 14000;
  const s1Occupied = Math.min(shelter1Cap, totalEvac);
  const s2Occupied = Math.min(shelter2Cap, Math.max(0, totalEvac - shelter1Cap));

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden select-none">
      {/* Top Header with SitRep Export Button */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Decision Analytics
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
            BRANCH {activeBranch}
          </span>
        </div>

        {onOpenReportModal && (
          <button
            onClick={onOpenReportModal}
            className="px-2.5 py-1 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5 text-[11px] font-bold shadow-sm shadow-blue-500/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>EXPORT SITREP</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/40 text-[11px] font-bold p-1 gap-1">
        <button
          onClick={() => setActiveTab('copilot')}
          className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'copilot'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-blue-600" />
          <span>AI COPILOT</span>
        </button>

        <button
          onClick={() => setActiveTab('charts')}
          className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'charts'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>METRICS</span>
        </button>

        <button
          onClick={() => setActiveTab('cascade')}
          className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'cascade'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          <span>CASCADE DAG</span>
        </button>

        <button
          onClick={() => setActiveTab('evacuation')}
          className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'evacuation'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>EVACUATION</span>
        </button>

        <button
          onClick={() => setActiveTab('logistics')}
          className={`flex-1 py-2 px-1 rounded-xl flex items-center justify-center gap-1 transition ${
            activeTab === 'logistics'
              ? 'bg-white text-blue-600 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          <span>DISPATCH</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-4 overflow-y-auto flex-1">
        {/* TAB 1: EXPLAINABLE AI COPILOT */}
        {activeTab === 'copilot' && (
          <div className="space-y-4 text-xs">
            {/* Executive Copilot Summary */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 text-blue-950">
              <div className="flex items-center gap-2 mb-1.5">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-[11px] uppercase tracking-wider">
                  Explainable Decision Intelligence
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-blue-200 text-blue-800 ml-auto">
                  OFFLINE COGNITIVE ENGINE
                </span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-900/90 font-medium">
                {copilot.executiveSummary}
              </p>
            </div>

            {/* Primary Threat Diagnosis */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  {copilot.primaryThreat.title}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 uppercase">
                  {copilot.primaryThreat.severityLabel}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                {copilot.primaryThreat.description}
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {copilot.primaryThreat.criticalMetrics.map((m, idx) => (
                  <div key={idx} className="p-2 rounded-xl bg-white border border-slate-200/80">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">{m.label}</div>
                    <div className="text-xs font-black text-slate-800 mt-0.5">{m.value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Infrastructure Cascade Diagnosis */}
            <div className="p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  Lifeline Dependency Vulnerability
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                  copilot.infrastructureRisk.status === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {copilot.infrastructureRisk.status}
                </span>
              </div>
              <p className="text-[11px] text-amber-900/80">
                {copilot.infrastructureRisk.summary}
              </p>
              <div className="space-y-1 pt-1">
                {copilot.infrastructureRisk.cascadingChains.map((chain, i) => (
                  <div key={i} className="text-[10px] font-mono p-2 rounded-lg bg-white/90 border border-amber-200/60 text-slate-700 flex items-start gap-1.5">
                    <CornerDownRight className="w-3 h-3 text-amber-600 shrink-0 mt-0.5" />
                    <span>{chain}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ranked Tactical Interventions */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Ranked Tactical Directives
                </span>
                <span className="text-[10px] text-blue-600 font-bold">MODELED BENEFIT</span>
              </div>

              {copilot.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 transition shadow-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-800 text-xs">
                      {rec.title}
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 shrink-0">
                      {rec.priority}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600">
                    {rec.reasoning}
                  </p>

                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/70 text-[10px] space-y-1">
                    <div><strong className="text-slate-700">Trigger Threshold:</strong> {rec.triggerMetrics}</div>
                    <div><strong className="text-slate-700">Underlying Assumptions:</strong> {rec.assumptions.join('; ')}</div>
                    <div className="text-emerald-700 font-semibold"><strong className="text-slate-700">Expected Modeled Impact:</strong> {rec.modeledImpact}</div>
                  </div>

                  <button
                    onClick={() => onDispatchAction(rec.actionType)}
                    className="w-full py-2 px-3 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <SendHorizontal className="w-3.5 h-3.5" />
                    <span>Execute Directive (Averts ~₹{rec.lossAvertedCr} Cr)</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Branch Divergence Commentary */}
            <div className="p-3 rounded-xl bg-slate-100/70 text-slate-600 text-[11px] italic">
              <strong>Why Branches Differ:</strong> {copilot.branchDivergenceNotes}
            </div>
          </div>
        )}

        {/* TAB 2: OVERALL METRICS & TRAJECTORY */}
        {activeTab === 'charts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  People in Hazard Zone
                </div>
                <div className="text-xl font-black text-rose-600 mt-1">
                  {(currentMetrics.people_at_risk ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Modeled exposure estimate</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Population Evacuated
                </div>
                <div className="text-xl font-black text-emerald-600 mt-1">
                  {(currentMetrics.people_evacuated ?? 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Relocated to shelters</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Road Network Blocks
                </div>
                <div className="text-xl font-black text-amber-600 mt-1">
                  {currentMetrics.roads_blocked_count ?? 0} <span className="text-xs font-normal text-slate-400">/ {simulationData.city.roads.length}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Impassable segments</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Direct Economic Loss
                </div>
                <div className="text-xl font-black text-slate-800 mt-1">
                  ₹{currentMetrics.economic_loss_cr ?? 0} Cr
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Asset structural damage</div>
              </div>
            </div>

            {/* Trajectory Evolution Chart */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 uppercase">
                  Residual Risk Trajectory (%)
                </span>
                <span className="text-[10px] font-mono text-blue-600 font-bold">TIMELINE EVOLUTION</span>
              </div>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#94a3b8" fontSize={9} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} domain={[0, 100]} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#e2e8f0',
                        fontSize: '11px',
                        borderRadius: '12px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }} />
                    <Line
                      type="monotone"
                      dataKey="Branch A (No Intervention)"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Branch B (Early Intervention)"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="Branch C (Resource-Constrained)"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: LIFELINE DEPENDENCY CASCADE DAG */}
        {activeTab === 'cascade' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-[11px] text-blue-800">
              <strong>Dependency DAG Rules:</strong> Grid Power → Water Pump Pressure → Hospital ICU Power & Telecom Relays. Secondary failures trigger deterministically when upstream feeds fail.
            </div>

            <div className="space-y-2">
              {simulationData.city.infrastructure.map((asset) => {
                const status = currentMetrics.infrastructure_status[asset.id] || 'operational';
                const isOp = status === 'operational';
                const isDeg = status === 'degraded';

                // Determine upstream explanation
                let upstreamExpl = 'Operating within nominal limits.';
                if (!isOp) {
                  if (asset.depends_on.length > 0) {
                    const failedParents = asset.depends_on.filter(p => currentMetrics.infrastructure_status[p] !== 'operational');
                    if (failedParents.length > 0) {
                      upstreamExpl = `Secondary failure triggered by upstream outage in [${failedParents.join(', ')}].`;
                    } else {
                      upstreamExpl = `Direct hazard incursion reaching asset perimeter.`;
                    }
                  } else {
                    upstreamExpl = `Direct hazard impact causing equipment trip.`;
                  }
                }

                return (
                  <div
                    key={asset.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${
                          isOp ? 'bg-emerald-50 text-emerald-600' : isDeg ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {asset.type === 'power' && <Zap className="w-4 h-4" />}
                          {asset.type === 'water' && <Droplets className="w-4 h-4" />}
                          {asset.type === 'hospital' && <AlertOctagon className="w-4 h-4" />}
                          {asset.type === 'telecom' && <Radio className="w-4 h-4" />}
                          {asset.type === 'shelter' && <Users className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">
                            {asset.type} Node · Priority {asset.priority} · Depends on: {asset.depends_on.join(', ') || 'None'}
                          </div>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                        isOp
                          ? 'bg-emerald-100 text-emerald-800'
                          : isDeg
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {status}
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 pl-11">
                      {upstreamExpl}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: EVACUATION ROUTES & SHELTER CAPACITIES */}
        {activeTab === 'evacuation' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs font-bold text-slate-800">Dynamic Evacuation Corridors</div>
              <div className="text-[11px] text-slate-500">
                NetworkX graph algorithm dynamically routes civilian vehicles to District Shelters away from expanding hazard fronts.
              </div>
            </div>

            {/* Shelter Occupancy Counters */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="text-[10px] font-bold text-emerald-900 uppercase">
                  {simulationData.city.shelters[0]?.name || 'Civic Shelter East'}
                </div>
                <div className="text-base font-black text-emerald-800 mt-1 font-mono">
                  {s1Occupied.toLocaleString()} <span className="text-xs font-normal text-emerald-600">/ {shelter1Cap.toLocaleString()}</span>
                </div>
                <div className="w-full bg-emerald-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (s1Occupied / shelter1Cap) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200">
                <div className="text-[10px] font-bold text-blue-900 uppercase">
                  {simulationData.city.shelters[1]?.name || 'District Shelter South'}
                </div>
                <div className="text-base font-black text-blue-800 mt-1 font-mono">
                  {s2Occupied.toLocaleString()} <span className="text-xs font-normal text-blue-600">/ {shelter2Cap.toLocaleString()}</span>
                </div>
                <div className="w-full bg-blue-200 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (s2Occupied / shelter2Cap) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-emerald-900">High-Ground Boulevard (North Escape)</div>
                  <div className="text-[10px] text-emerald-700">Clear clearance · 4 lanes · Flow: 820 veh/hr</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">OPEN</span>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-amber-900">Central Metro River Bridge</div>
                  <div className="text-[10px] text-amber-700">Moderate bottleneck · Flow: 420 veh/hr</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">CONGESTED</span>
              </div>

              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex justify-between items-center">
                <div>
                  <div className="text-xs font-bold text-rose-900">Low-Ground Embankment Avenue</div>
                  <div className="text-[10px] text-rose-700">Directly intersected by hazard front · Flow: 0</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-900">IMPASSABLE</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: DISPATCH AI & TACTICAL INTERVENTIONS */}
        {activeTab === 'logistics' && (
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
              <strong>Commander Directives:</strong> Dispatch field assets into Branch {activeBranch}. Actions take effect deterministically in the simulation engine.
            </div>

            <div className="space-y-2">
              <button
                onClick={() => onDispatchAction('deploy_flood_barriers')}
                className="w-full p-3 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 text-left transition flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
                    🌊 Deploy Rapid Flood Barriers
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Place modular water deflectors along riverbanks (-15% flood spread)
                  </div>
                </div>
                <SendHorizontal className="w-4 h-4 text-blue-600" />
              </button>

              <button
                onClick={() => onDispatchAction('priority_hospital_evac')}
                className="w-full p-3 rounded-xl bg-white border border-emerald-500 hover:bg-emerald-50/50 text-left transition flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-600">
                    🏥 Priority Hospital Evacuation Convoy
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Escort 24 ambulances & ICU transport to northern ridge shelter
                  </div>
                </div>
                <SendHorizontal className="w-4 h-4 text-emerald-600" />
              </button>

              <button
                onClick={() => onDispatchAction('backup_generators')}
                className="w-full p-3 rounded-xl bg-white border border-amber-500 hover:bg-amber-50/50 text-left transition flex items-center justify-between group shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-600">
                    ⚡ Fire Up Secondary Diesel Generators
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Isolate electrical substation to keep water filtration alive
                  </div>
                </div>
                <SendHorizontal className="w-4 h-4 text-amber-600" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
