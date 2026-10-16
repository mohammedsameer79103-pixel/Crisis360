import React, { useState } from 'react';
import {
  HandHeart,
  Droplets,
  Home,
  Package,
  HeartPulse,
  Users,
  PlusCircle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  Filter,
  AlertCircle
} from 'lucide-react';
import { useCrisis } from '../context/CrisisContext';
import type { ReliefCategory, ReliefWorkflowStatus } from '../types/crisis';

export const ReliefAssistancePage: React.FC = () => {
  const {
    selectedCityId,
    reliefRequests,
    volunteers,
    createReliefRequest,
    updateReliefWorkflow
  } = useCrisis();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New relief request form state
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState<ReliefCategory>('food_water');
  const [newQuantity, setNewQuantity] = useState(100);
  const [newUnit, setNewUnit] = useState('meals');
  const [newLocation, setNewLocation] = useState('');
  const [newPriority, setNewPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');

  const cityRelief = reliefRequests.filter(r => r.city_id === selectedCityId);
  const filteredRelief = cityRelief.filter(r => {
    if (activeCategory !== 'all' && r.category !== activeCategory) return false;
    return true;
  });

  const categories = [
    { id: 'all', label: 'All Categories', icon: Package },
    { id: 'food_water', label: 'Food & Clean Water', icon: Droplets },
    { id: 'temporary_shelter', label: 'Temporary Shelter', icon: Home },
    { id: 'essential_supplies', label: 'Essential Supplies', icon: Package },
    { id: 'medical_relief', label: 'Medical Relief Kits', icon: HeartPulse },
    { id: 'special_assistance', label: 'Special Care & Elderly', icon: HandHeart }
  ];

  const workflowSteps: ReliefWorkflowStatus[] = [
    'Requested',
    'Verified',
    'Approved',
    'Assigned',
    'In Progress',
    'Delivered',
    'Completed'
  ];

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim() || !newLocation.trim()) return;

    await createReliefRequest({
      city_id: selectedCityId,
      category: newCategory,
      item_name: newItem.trim(),
      quantity_requested: Number(newQuantity),
      unit: newUnit,
      priority: newPriority,
      location_name: newLocation.trim()
    });

    setIsModalOpen(false);
    setNewItem('');
    setNewLocation('');
    setNewQuantity(100);
  };

  const handleAdvanceWorkflow = async (reqId: string, currentStatus: ReliefWorkflowStatus) => {
    const currentIdx = workflowSteps.indexOf(currentStatus);
    if (currentIdx < workflowSteps.length - 1) {
      const nextStatus = workflowSteps[currentIdx + 1];
      const targetReq = cityRelief.find(r => r.id === reqId);
      const updates: any = {};
      if (nextStatus === 'Delivered' && targetReq) {
        updates.quantity_delivered = targetReq.quantity_requested;
      }
      await updateReliefWorkflow(reqId, nextStatus, updates);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-slate-100 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <HandHeart className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-black text-white">Humanitarian Relief & Supplies Logistics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end relief pipeline tracking: food and drinking water, temporary tents, hygiene packs, and special care delivery.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>REQUEST RELIEF CONVOY</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          const count = cat.id === 'all' ? cityRelief.length : cityRelief.filter(r => r.category === cat.id).length;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/20'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${isActive ? 'bg-blue-700' : 'bg-slate-800'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Relief Requests List */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
          Active Relief Convoys & Requests ({filteredRelief.length})
        </div>

        <div className="space-y-3">
          {filteredRelief.map(req => {
            const currentStepIdx = workflowSteps.indexOf(req.status);
            const isCompleted = req.status === 'Completed';

            return (
              <div key={req.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono text-emerald-400 font-bold">{req.id}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-400 font-mono text-[11px] capitalize">{req.category.replace('_', ' ')}</span>
                      <span className="text-slate-600">•</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          req.priority === 'Critical'
                            ? 'bg-rose-500/20 text-rose-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {req.priority}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-0.5">{req.item_name}</h3>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">DELIVERED / REQUESTED</div>
                    <div className="text-sm font-black text-white font-mono">
                      {req.quantity_delivered} / {req.quantity_requested} {req.unit}
                    </div>
                  </div>
                </div>

                {/* 7-Step Workflow Progression Visualizer */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>WORKFLOW PROGRESS: {req.status}</span>
                    <span>Step {Math.max(1, currentStepIdx + 1)} of 7</span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {workflowSteps.map((step, idx) => {
                      const isPassed = currentStepIdx >= idx;
                      const isCurrent = currentStepIdx === idx;

                      return (
                        <div
                          key={step}
                          className={`h-2 rounded-full transition-all ${
                            isCurrent
                              ? 'bg-emerald-500 ring-2 ring-emerald-500/30'
                              : isPassed
                              ? 'bg-emerald-700'
                              : 'bg-slate-800'
                          }`}
                          title={step}
                        />
                      );
                    })}
                  </div>

                  <div className="hidden md:grid grid-cols-7 text-[9px] font-mono text-center pt-1 text-slate-400">
                    {workflowSteps.map(step => (
                      <span key={step} className={req.status === step ? 'text-emerald-400 font-bold' : ''}>
                        {step}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Location and Dispatch Team */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4 text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-white font-medium">{req.location_name}</span>
                    </span>
                    {req.assigned_team && (
                      <span>Team: <strong className="text-slate-300">{req.assigned_team}</strong></span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCompleted ? (
                      <button
                        onClick={() => handleAdvanceWorkflow(req.id, req.status)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                      >
                        <span>Advance to Next Step</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-xs flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Consignment Completed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRelief.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
              No relief consignments in this category.
            </div>
          )}
        </div>
      </div>

      {/* Modal: New Relief Request */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              <span>Log Humanitarian Relief Request</span>
            </h2>

            <form onSubmit={handleCreateRequest} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-semibold block mb-1">Relief Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ReliefCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="food_water">Food & Potable Drinking Water</option>
                  <option value="temporary_shelter">Temporary Shelter / Tents</option>
                  <option value="essential_supplies">Essential Supplies (Blankets, Hygiene)</option>
                  <option value="medical_relief">Medical Relief (First Aid Kits, ORS)</option>
                  <option value="special_assistance">Special Assistance (Elderly, Infants)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Item Description</label>
                <input
                  type="text"
                  required
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="e.g. 20L Potable Water Cans, Dry Rations, Tarpaulins"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-semibold block mb-1">Unit of Measure</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="cans, meals, kits, tents"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Destination Relief Location</label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Gachibowli Stadium Camp Hub"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-semibold block mb-1">Priority</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none"
                >
                  <option value="Critical">Critical (Immediate lifeline need)</option>
                  <option value="High">High (Needed within 6 hours)</option>
                  <option value="Medium">Medium (Replenishment stock)</option>
                  <option value="Low">Low (Buffer stock)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition"
                >
                  Submit Relief Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
