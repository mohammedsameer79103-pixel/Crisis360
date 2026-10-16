import React from 'react';
import type { BranchId, FullSimulationResponse } from '../types/simulation';
import { ShieldAlert, Zap, AlertTriangle, ArrowDownRight, SplitSquareVertical } from 'lucide-react';

interface BranchSelectorProps {
  activeBranch: BranchId;
  onSelectBranch: (branch: BranchId) => void;
  simulationData: FullSimulationResponse;
  currentTick: number;
  splitView: boolean;
  onToggleSplitView: () => void;
}

export const BranchSelector: React.FC<BranchSelectorProps> = ({
  activeBranch,
  onSelectBranch,
  simulationData,
  currentTick,
  splitView,
  onToggleSplitView
}) => {
  const getMetricsAtTick = (branchId: BranchId) => {
    const branch = branchId === 'A' ? simulationData?.branch_A : (branchId === 'B' ? simulationData?.branch_B : simulationData?.branch_C);
    if (!branch?.timeline || branch.timeline.length === 0) return null;
    const idx = Math.min(branch.timeline.length - 1, Math.floor(currentTick / 2));
    return branch.timeline[idx];
  };

  const metricA = getMetricsAtTick('A');
  const metricB = getMetricsAtTick('B');
  const metricC = getMetricsAtTick('C');

  if (!metricA || !metricB || !metricC) {
    return null;
  }

  // Deltas relative to Branch A
  const deltaRiskB = Math.max(0, (metricA.residual_risk_pct || 0) - (metricB.residual_risk_pct || 0));
  const deltaLossB = Math.max(0, (metricA.economic_loss_cr || 0) - (metricB.economic_loss_cr || 0));

  const deltaRiskC = Math.max(0, (metricA.residual_risk_pct || 0) - (metricC.residual_risk_pct || 0));
  const deltaLossC = Math.max(0, (metricA.economic_loss_cr || 0) - (metricC.economic_loss_cr || 0));

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase">
            Three Strategy Futures <span className="text-slate-400 font-normal">| Branch Comparison Matrix</span>
          </h3>
        </div>
        <button
          onClick={onToggleSplitView}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition ${
            splitView
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300 shadow-sm'
          }`}
          title="Toggle Side-by-Side Dual Branch View"
        >
          <SplitSquareVertical className="w-3.5 h-3.5" />
          {splitView ? 'SPLIT SCREEN ACTIVE' : 'SIDE-BY-SIDE VIEW'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Branch A: No Intervention */}
        <div
          onClick={() => onSelectBranch('A')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden bg-white shadow-sm hover:shadow-md ${
            activeBranch === 'A'
              ? 'border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-500/10'
              : 'border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              BRANCH A · BASELINE
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-600" />
          </div>

          <h4 className="text-sm font-bold text-slate-900">
            No Intervention
          </h4>
          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
            Unmitigated natural propagation; zero pre-positioned barrier defense.
          </p>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <div className="text-2xl font-black tracking-tight text-rose-600">
                {metricA.residual_risk_pct}%
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Residual Risk
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">
                ₹{metricA.economic_loss_cr} Cr
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Modeled Loss
              </div>
            </div>
          </div>

          {/* Risk progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-300"
              style={{ width: `${metricA.residual_risk_pct}%` }}
            />
          </div>
        </div>

        {/* Branch B: Early Intervention */}
        <div
          onClick={() => onSelectBranch('B')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden bg-white shadow-sm hover:shadow-md ${
            activeBranch === 'B'
              ? 'border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/10'
              : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              BRANCH B · PROACTIVE
            </span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>

          <h4 className="text-sm font-bold text-slate-900">
            Early Intervention
          </h4>
          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
            Pre-positioned barriers & crews; priority hospital/shelter corridor.
          </p>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <div className="text-2xl font-black tracking-tight text-emerald-600">
                {metricB.residual_risk_pct}%
              </div>
              <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                -{deltaRiskB.toFixed(1)}% vs Baseline
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-emerald-600">
                ₹{metricB.economic_loss_cr} Cr
              </div>
              <div className="text-[10px] font-bold text-emerald-600">
                Saved ₹{deltaLossB.toFixed(1)} Cr
              </div>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${metricB.residual_risk_pct}%` }}
            />
          </div>
        </div>

        {/* Branch C: Resource-Constrained */}
        <div
          onClick={() => onSelectBranch('C')}
          className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden bg-white shadow-sm hover:shadow-md ${
            activeBranch === 'C'
              ? 'border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10'
              : 'border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              BRANCH C · CONSTRAINED
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>

          <h4 className="text-sm font-bold text-slate-900">
            Resource-Constrained
          </h4>
          <p className="text-xs text-slate-500 line-clamp-1 mb-3">
            Triage trade-offs; dispatch latency; congested escape arteries.
          </p>

          <div className="flex items-baseline justify-between mt-1">
            <div>
              <div className="text-2xl font-black tracking-tight text-amber-600">
                {metricC.residual_risk_pct}%
              </div>
              <div className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                -{deltaRiskC.toFixed(1)}% vs Baseline
              </div>
            </div>

            <div className="text-right">
              <div className="text-lg font-bold text-slate-800">
                ₹{metricC.economic_loss_cr} Cr
              </div>
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Modeled Loss
              </div>
            </div>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-300"
              style={{ width: `${metricC.residual_risk_pct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
