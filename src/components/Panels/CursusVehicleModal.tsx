import React, { useState } from 'react';
import { Truck, Car, Fuel, DollarSign, XCircle, Check, AlertCircle, Shield, Scale, ArrowUpCircle } from 'lucide-react';
import type { UserProfile } from '../../types';
import type { VehicleProfileSpec } from '../../services/intelligenceEngine';

interface CursusVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  vehicleSpec: VehicleProfileSpec;
  onSaveVehicleSpec: (spec: VehicleProfileSpec) => void;
}

export const CursusVehicleModal: React.FC<CursusVehicleModalProps> = ({
  isOpen,
  onClose,
  user,
  vehicleSpec,
  onSaveVehicleSpec,
}) => {
  const [form, setForm] = useState<VehicleProfileSpec>({ ...vehicleSpec });

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveVehicleSpec(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-slate-950 shadow-md font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                CURSUS VEHICLE
              </h2>
              <p className="text-xs text-slate-400">
                Perfil do veículo para cálculo de consumo, custos e restrições
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-slate-200">
          {/* Vehicle Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase tracking-wider">
              Tipo de Veículo
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {[
                { type: 'car', label: 'Carro', icon: '🚗' },
                { type: 'motorcycle', label: 'Moto', icon: '🏍️' },
                { type: 'van', label: 'Van / Utilitário', icon: '🚐' },
                { type: 'truck', label: 'Caminhão', icon: '🚚' },
                { type: 'bus', label: 'Ônibus', icon: '🚌' },
              ].map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setForm({ ...form, type: item.type as any })}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                    form.type === item.type
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[11px] text-center">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Marca</label>
              <input
                type="text"
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
                placeholder="Ex: Toyota, Honda, Scania"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Modelo</label>
              <input
                type="text"
                value={form.model}
                onChange={e => setForm({ ...form, model: e.target.value })}
                placeholder="Ex: Corolla, CB 500, R450"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Fuel Type & Average Consumption */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Combustível</label>
              <select
                value={form.fuelType}
                onChange={e => setForm({ ...form, fuelType: e.target.value as any })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="gasolina">Gasolina Comum</option>
                <option value="etanol">Etanol (Álcool)</option>
                <option value="diesel">Diesel S10</option>
                <option value="gnv">GNV (Gás Natural)</option>
                <option value="eletrico">Elétrico (EV)</option>
                <option value="flex">Flex (Gasolina/Etanol)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Consumo Médio (km/L)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="60"
                value={form.consumptionKmL}
                onChange={e => setForm({ ...form, consumptionKmL: parseFloat(e.target.value) || 12 })}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Dimensions & Restrictions (Crucial for Trucks / Vans) */}
          {(form.type === 'truck' || form.type === 'bus' || form.type === 'van') && (
            <div className="p-3.5 bg-slate-800/80 border border-slate-700 rounded-xl space-y-3">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Restrições Físicas & Rodoviárias
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Altura (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Ex: 4.2"
                    value={form.heightMeters || ''}
                    onChange={e => setForm({ ...form, heightMeters: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Peso (Ton)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 24"
                    value={form.weightTons || ''}
                    onChange={e => setForm({ ...form, weightTons: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Comp. (m)</label>
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Ex: 18.5"
                    value={form.lengthMeters || ''}
                    onChange={e => setForm({ ...form, lengthMeters: parseFloat(e.target.value) || undefined })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/95 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Salvar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};
