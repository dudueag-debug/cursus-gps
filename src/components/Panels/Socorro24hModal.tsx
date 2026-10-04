import React, { useState } from 'react';
import { 
  Truck, 
  BatteryCharging, 
  Disc, 
  Fuel, 
  MapPin, 
  Phone, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  ShieldCheck, 
  Navigation,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import type { Coordinates, UserProfile } from '../../types';

interface Socorro24hModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: Coordinates;
  detectedLocationName?: string;
  user: UserProfile;
}

export const Socorro24hModal: React.FC<Socorro24hModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  detectedLocationName = 'Minha Localização Atual',
  user,
}) => {
  const [serviceType, setServiceType] = useState<'reboque' | 'bateria' | 'pneu' | 'combustivel'>('reboque');
  const [vehicleModelInput, setVehicleModelInput] = useState<string>(String(user.vehicleModel || 'Carro de Passeio'));
  const [contactPhone, setContactPhone] = useState(user.phone || '');

  const [notes, setNotes] = useState('');
  const [requestDispatched, setRequestDispatched] = useState(false);

  if (!isOpen) return null;

  const getWhatsappLink = () => {
    const serviceTitles = {
      reboque: '🛻 SOLICITAÇÃO DE REBOQUE / GUINCHO 24H (SEM SEGURO)',
      bateria: '🔋 SOCORRO DE BATERIA / MOTO-PARTIDA RÁPIDA 24H',
      pneu: '🛞 SOCORRO DE BORRACHEIRO / TROCA DE PNEU',
      combustivel: '⛽ SOCORRO PANE SECA / COMBUSTÍVEL DE EMERGÊNCIA',
    };

    const text = encodeURIComponent(
      `*${serviceTitles[serviceType]}*\n\n` +
      `👤 *Motorista:* ${user.name}\n` +
      `📱 *Telefone de Contato:* ${contactPhone || 'No chat'}\n` +
      `🚗 *Veículo:* ${vehicleModelInput}\n` +
      `📍 *Endereço / Referência:* ${detectedLocationName}\n` +
      `🌐 *Coordenadas GPS:* ${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}\n` +
      `🗺️ *Link no Maps:* https://www.google.com/maps?q=${currentLocation.lat},${currentLocation.lng}\n` +
      (notes ? `💬 *Observações:* ${notes}\n\n` : '\n') +
      `_Enviado pelo App TÔ PASSANDO - GPS do CURSUS_`
    );

    // Default partner dispatch central or dynamic local partner
    return `https://api.whatsapp.com/send?phone=5511991234567&text=${text}`;
  };

  const handleCallCentral = () => {
    window.location.href = 'tel:08007289001';
  };

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestDispatched(true);
    // Open WhatsApp after short delay
    setTimeout(() => {
      window.open(getWhatsappLink(), '_blank');
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-slate-950 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-white">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-indigo-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-black text-base text-white tracking-tight">Socorro & Reboque 24h</h2>
                <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-amber-500 text-slate-950">
                  Sem Seguro
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Guinchos autônomos e moto-socorro parceiros próximos de você
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[70vh] flex flex-col gap-4">
          {/* GPS Location Pin info */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="w-4 h-4 text-lime-400 shrink-0" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Sua Localização GPS Atual:</span>
                <span className="font-semibold text-slate-200 line-clamp-1">{detectedLocationName}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono text-cyan-300 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
              {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
            </span>
          </div>

          {/* Service Selector (4 main buttons) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Qual socorro você precisa agora?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {/* Reboque */}
              <button
                type="button"
                onClick={() => setServiceType('reboque')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all active:scale-95 ${
                  serviceType === 'reboque'
                    ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-md shadow-blue-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Truck className="w-4 h-4" />
                  </div>
                  {serviceType === 'reboque' && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
                </div>
                <div>
                  <h4 className="font-black text-xs text-white">Pedir Reboque / Guincho</h4>
                  <p className="text-[10px] text-slate-400">Plataforma 24h estilo Uber</p>
                </div>
              </button>

              {/* Bateria */}
              <button
                type="button"
                onClick={() => setServiceType('bateria')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all active:scale-95 ${
                  serviceType === 'bateria'
                    ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center">
                    <BatteryCharging className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  {serviceType === 'bateria' && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
                </div>
                <div>
                  <h4 className="font-black text-xs text-white">Bateria / Partida na Moto</h4>
                  <p className="text-[10px] text-slate-400">Booster rápido ou bateria nova</p>
                </div>
              </button>

              {/* Pneu */}
              <button
                type="button"
                onClick={() => setServiceType('pneu')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all active:scale-95 ${
                  serviceType === 'pneu'
                    ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-md shadow-emerald-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
                    <Disc className="w-4 h-4" />
                  </div>
                  {serviceType === 'pneu' && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
                </div>
                <div>
                  <h4 className="font-black text-xs text-white">Troca de Pneu / Borracharia</h4>
                  <p className="text-[10px] text-slate-400">Socorro no local para furo/estepe</p>
                </div>
              </button>

              {/* Pane Seca */}
              <button
                type="button"
                onClick={() => setServiceType('combustivel')}
                className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all active:scale-95 ${
                  serviceType === 'combustivel'
                    ? 'bg-purple-950/80 border-purple-500 ring-2 ring-purple-500/30 shadow-md shadow-purple-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                    <Fuel className="w-4 h-4" />
                  </div>
                  {serviceType === 'combustivel' && <CheckCircle2 className="w-4 h-4 text-lime-400" />}
                </div>
                <div>
                  <h4 className="font-black text-xs text-white">Pane Seca / Combustível</h4>
                  <p className="text-[10px] text-slate-400">Galão com gasolina ou diesel</p>
                </div>
              </button>
            </div>
          </div>

          {/* Form details */}
          <form onSubmit={handleDispatch} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Modelo do seu Veículo:
                </label>
                <input
                  type="text"
                  value={vehicleModelInput}
                  onChange={(e) => setVehicleModelInput(e.target.value)}
                  placeholder="Ex: Onix, Gol, CB 300, Renegade..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Seu WhatsApp / Telefone:
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="DDD + Número"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Ponto de Referência ou Detalhes:
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Estou parado em frente ao posto BR, carro não liga de jeito nenhum."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-lime-400"
              />
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 hover:brightness-110 text-white font-black text-xs tracking-wide shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>CHAMAR REBOQUE / SOCORRO VIA WHATSAPP (COM GPS)</span>
              </button>

              <button
                type="button"
                onClick={handleCallCentral}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Phone className="w-3.5 h-3.5 text-lime-400" />
                <span>Ligar para Central Telefônica de Socorro 24h</span>
              </button>
            </div>
          </form>

          {/* Guarantee badge */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />
            <span>
              Rede credenciada com guinchos de plataforma e socorristas móveis terceirizados em todo o território nacional.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
