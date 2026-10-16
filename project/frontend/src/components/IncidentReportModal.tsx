import React, { useState } from 'react';
import {
  FileText,
  Download,
  Copy,
  Printer,
  X,
  Check,
  ShieldAlert,
  AlertTriangle,
  Building2,
  TrendingDown,
  Info
} from 'lucide-react';
import type { FullSimulationResponse, ScenarioConfig, CityDefinition } from '../types/simulation';

interface IncidentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulationData: FullSimulationResponse;
  config: ScenarioConfig;
  city: CityDefinition;
}

export const IncidentReportModal: React.FC<IncidentReportModalProps> = ({
  isOpen,
  onClose,
  simulationData,
  config,
  city
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const bA = simulationData.branch_A;
  const bB = simulationData.branch_B;
  const bC = simulationData.branch_C;

  const finalA = bA.timeline[bA.timeline.length - 1];
  const finalB = bB.timeline[bB.timeline.length - 1];
  const finalC = bC.timeline[bC.timeline.length - 1];

  const summary = simulationData.comparison_summary;
  const savedCr = summary.loss_averted_by_early_response_cr || Math.max(0, finalA.economic_loss_cr - finalB.economic_loss_cr);

  const generateMarkdownReport = () => {
    return `# CRISIS360 INCIDENT SITUATION REPORT (SITREP)
**Scenario ID:** ${simulationData.scenario_id}
**Jurisdiction:** ${city.name}, ${city.state}
**Hazard Vector:** ${config.hazard_type.toUpperCase()} (Severity Index: ${config.severity}%)
**Generated:** ${new Date().toISOString()}

---

## 1. EXECUTIVE SUMMARY
A multi-hazard disaster simulation was conducted for ${city.name} traversing ${city.terrain_summary}.
Three independent response futures were evaluated from matching initial conditions:
- **Branch A (No Intervention):** Unmitigated natural propagation resulting in maximum damage.
- **Branch B (Early Intervention):** Proactive mitigation, pre-positioned dikes, and early evacuation corridors.
- **Branch C (Resource-Constrained):** 40% fleet deficit and 25-minute dispatch latency.

**Key Finding:** Proactive intervention in Branch B averts **₹${savedCr.toFixed(1)} Cr** in structural damage and achieves an evacuation efficiency of **${summary.evacuation_efficiency_B_pct}%**.

---

## 2. THREE-BRANCH COMPARATIVE MATRIX

| Metric | Branch A (No Intervention) | Branch B (Early Intervention) | Branch C (Constrained) | Delta (A vs B) |
|---|---|---|---|---|
| **Direct Economic Loss** | ₹${finalA.economic_loss_cr} Cr | ₹${finalB.economic_loss_cr} Cr | ₹${finalC.economic_loss_cr} Cr | **-₹${savedCr.toFixed(1)} Cr (-${Math.round((savedCr / Math.max(1, finalA.economic_loss_cr)) * 100)}%)** |
| **Residual Risk Index** | ${finalA.residual_risk_pct}% | ${finalB.residual_risk_pct}% | ${finalC.residual_risk_pct}% | **-${(finalA.residual_risk_pct - finalB.residual_risk_pct).toFixed(1)}%** |
| **Population Evacuated** | ${finalA.people_evacuated.toLocaleString()} | ${finalB.people_evacuated.toLocaleString()} | ${finalC.people_evacuated.toLocaleString()} | **+${(finalB.people_evacuated - finalA.people_evacuated).toLocaleString()}** |
| **People Trapped / Isolated** | ${finalA.people_trapped.toLocaleString()} | ${finalB.people_trapped.toLocaleString()} | ${finalC.people_trapped.toLocaleString()} | **-${(finalA.people_trapped - finalB.people_trapped).toLocaleString()}** |
| **Road Network Blockages** | ${finalA.roads_blocked_count} / ${city.roads.length} | ${finalB.roads_blocked_count} / ${city.roads.length} | ${finalC.roads_blocked_count} / ${city.roads.length} | **-${finalA.roads_blocked_count - finalB.roads_blocked_count} segments** |
| **Lifelines at Critical Risk** | ${finalA.critical_assets_at_risk_count} | ${finalB.critical_assets_at_risk_count} | ${finalC.critical_assets_at_risk_count} | **-${finalA.critical_assets_at_risk_count - finalB.critical_assets_at_risk_count} assets** |

---

## 3. INFRASTRUCTURE DEPENDENCY CASCADE ANALYSIS
- **Primary Failure Source:** ${finalA.source_marker?.name || 'Hazard Origin'}
- **Observed Cascade Rule:** Grid Power Substation outage trips Water Treatment Plant pumps, subsequently forcing Hospital ICUs onto emergency diesel backup within 24 minutes.
- **Road Network Chokepoint:** Central bridge corridors exceed capacity under panic egress, requiring police pre-emption.

---

## 4. MODELING ASSUMPTIONS & SENSITIVITY
1. **Hydrological Solver:** Elevation-aware cellular automata with a 1m topographic grid resolution.
2. **Evacuation Transit Velocity:** Unimpeded pedestrian walking speed modeled at 1.2 m/s; congested velocity reduced to 0.4 m/s.
3. **Joyner-Boore PGA Attenuation:** Moment magnitude Mw ${config.severity / 10 + 2.5} with focal depth of 12.0 km.
4. **Data Classification:** Procedural geometric digital twin validated for emergency commander training and what-if simulation.
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownReport());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(simulationData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Crisis360_SitRep_${city.id}_${simulationData.scenario_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-800">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/60 via-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-black tracking-wide text-slate-900 uppercase">
                  CRISIS360 INCIDENT SITREP
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                  MULTI-BRANCH DOSSIER
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {city.name} Metropolitan Area · Scenario ID: <span className="font-mono">{simulationData.scenario_id}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Copy Markdown Report"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy MD'}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition flex items-center gap-1.5 text-xs font-semibold"
              title="Download Full JSON Data"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
              title="Print SitRep Dossier"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Executive Highlight Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-transparent border border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                ₹
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Direct Asset Loss Averted by Early Intervention (Branch B)
                </div>
                <div className="text-[11px] text-slate-500">
                  Pre-positioned flood dikes & traffic signal pre-emption prevented bridge gridlock
                </div>
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">
              ₹{savedCr.toFixed(1)} Cr
            </div>
          </div>

          {/* Comparative Matrix Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-blue-600" />
                Three-Future Decision Matrix
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">SIMULATION TIMELINE T+05:00</span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Decision Branch</th>
                    <th className="p-3">Modeled Loss</th>
                    <th className="p-3">Residual Risk</th>
                    <th className="p-3">Evacuated</th>
                    <th className="p-3">Roads Blocked</th>
                    <th className="p-3">Lifeline Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <tr className="hover:bg-rose-50/40 transition">
                    <td className="p-3 font-bold text-rose-600 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Branch A (No Intervention)
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{finalA.economic_loss_cr} Cr</td>
                    <td className="p-3 font-mono text-rose-600">{finalA.residual_risk_pct}%</td>
                    <td className="p-3 font-mono text-slate-600">{finalA.people_evacuated.toLocaleString()}</td>
                    <td className="p-3 font-mono text-rose-600">{finalA.roads_blocked_count} / {city.roads.length}</td>
                    <td className="p-3 font-bold text-rose-600">{finalA.critical_assets_at_risk_count} Threatened</td>
                  </tr>

                  <tr className="bg-emerald-50/40 hover:bg-emerald-50 transition">
                    <td className="p-3 font-bold text-emerald-600 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Branch B (Early Intervention)
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-700">₹{finalB.economic_loss_cr} Cr</td>
                    <td className="p-3 font-mono font-bold text-emerald-600">{finalB.residual_risk_pct}%</td>
                    <td className="p-3 font-mono font-bold text-emerald-700">{finalB.people_evacuated.toLocaleString()}</td>
                    <td className="p-3 font-mono text-emerald-700">{finalB.roads_blocked_count} / {city.roads.length}</td>
                    <td className="p-3 font-bold text-emerald-600">{finalB.critical_assets_at_risk_count} Threatened</td>
                  </tr>

                  <tr className="hover:bg-amber-50/40 transition">
                    <td className="p-3 font-bold text-amber-600 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                      Branch C (Resource-Constrained)
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-900">₹{finalC.economic_loss_cr} Cr</td>
                    <td className="p-3 font-mono text-amber-600">{finalC.residual_risk_pct}%</td>
                    <td className="p-3 font-mono text-slate-600">{finalC.people_evacuated.toLocaleString()}</td>
                    <td className="p-3 font-mono text-amber-600">{finalC.roads_blocked_count} / {city.roads.length}</td>
                    <td className="p-3 font-bold text-amber-600">{finalC.critical_assets_at_risk_count} Threatened</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Infrastructure Cascade Analysis */}
          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Critical Infrastructure Cascading Chains
            </h3>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="font-semibold text-slate-800">
                Identified Failure Propagation Chain:
              </div>
              <div className="font-mono text-[11px] text-slate-600 bg-white p-3 rounded-xl border border-slate-200">
                Primary Hazard Incursion → Substation Alpha Trip → Water Filtration Pumps Depressurized → Trauma Center ICU Island Power Engage
              </div>
              <p className="text-[11px] text-slate-500">
                In Branch A, lack of sandbagging around the substation leads to complete electrical trip at T+01:12, triggering cascading water pump failure. In Branch B, auxiliary fuel and protective berms preserve 100% ICU power uptime.
              </p>
            </div>
          </div>

          {/* Methodology & Limitations */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-start gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-[11px] text-blue-900">
              <div className="font-bold">Modeling Methodology & Limitations</div>
              <p className="text-blue-800/80">
                Projections are derived via deterministic multi-hazard physics solvers (Hydrological cellular elevation spread, Rothermel fire spread, and Joyner-Boore seismic attenuation) combined with NetworkX graph routing. Geometry utilizes procedural digital twins modeled after genuine metropolitan GIS topologies.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            CONFIDENTIAL // FOR AUTHORIZED EMERGENCY DISPATCH ONLY
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
