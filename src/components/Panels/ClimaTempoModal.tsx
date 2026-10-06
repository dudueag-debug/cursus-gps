import React, { useState } from 'react';
import { 
  CloudRain, 
  Sun, 
  Cloud, 
  Wind, 
  Droplets, 
  Compass, 
  Calendar, 
  AlertTriangle, 
  ShieldAlert, 
  Car, 
  Bike, 
  X, 
  ChevronRight, 
  Sparkles, 
  Info, 
  Umbrella,
  Zap,
  Gauge
} from 'lucide-react';
import type { WeatherData, WeatherDayForecast, TransportMode } from '../../types';

interface ClimaTempoModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData | null;
  preferredMode?: TransportMode;
}

export const ClimaTempoModal: React.FC<ClimaTempoModalProps> = ({
  isOpen,
  onClose,
  weatherData,
  preferredMode = 'car',
}) => {
  const [activeTab, setActiveTab] = useState<'week' | 'month' | 'safety'>('week');
  const [vehicleTab, setVehicleTab] = useState<'car' | 'motorcycle'>(
    preferredMode === 'motorcycle' ? 'motorcycle' : 'car'
  );
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  if (!isOpen || !weatherData) return null;

  const selectedDay: WeatherDayForecast = weatherData.weeklyForecast[selectedDayIndex] || weatherData.weeklyForecast[0];
  const isHighRainRisk = weatherData.isRaining || weatherData.rainProbability >= 40 || selectedDay?.riskLevel !== 'nenhum';

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 border-b border-slate-800 p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-2xl">
                {weatherData.icon || '🌦️'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white uppercase">
                  Clima & Tempo da Rota
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-600/40 border border-blue-400/40 text-blue-300">
                  Radar Brasil
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {weatherData.city} • {weatherData.state} • Previsão Semanal e Mensal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rain Alert Notice (If rain / risk detected) */}
        {isHighRainRisk && (
          <div className="bg-gradient-to-r from-amber-950/80 via-red-950/60 to-slate-900 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 animate-pulse">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/50 shrink-0">
                <CloudRain className="w-5 h-5" />
              </div>
              <div className="text-left">
                <h4 className="text-xs font-black text-amber-300 uppercase tracking-wide">
                  {weatherData.alertTitle || 'Alerta de Chuva Prevista na Via'}
                </h4>
                <p className="text-[11px] text-slate-300">
                  {weatherData.alertMessage || 'Pista com risco de aquaplanagem e baixa aderência. Cuidado redobrado.'}
                </p>
              </div>
            </div>

            <span className="px-2 py-1 rounded-lg bg-red-600 text-white font-black text-[10px] uppercase shrink-0">
              {weatherData.rainProbability}% Chuva
            </span>
          </div>
        )}

        {/* Live Current Conditions Card */}
        <div className="p-4 sm:p-5 bg-slate-950/60 border-b border-slate-800/80 shrink-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Temperature */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Temperatura</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-white">{weatherData.currentTemp}°</span>
                <span className="text-xs text-slate-400 font-medium">C</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Mín {weatherData.tempMin}°</span>
                <span>Máx {weatherData.tempMax}°</span>
              </div>
            </div>

            {/* Rain Prob */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Droplets className="w-3 h-3 text-cyan-400" />
                <span>Prob. Chuva</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-3xl font-black ${weatherData.rainProbability > 40 ? 'text-cyan-300' : 'text-slate-200'}`}>
                  {weatherData.rainProbability}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full rounded-full ${weatherData.rainProbability > 50 ? 'bg-cyan-400' : 'bg-blue-500'}`}
                  style={{ width: `${weatherData.rainProbability}%` }}
                />
              </div>
            </div>

            {/* Wind */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Wind className="w-3 h-3 text-lime-400" />
                <span>Vento</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-white">{weatherData.windSpeedKmh}</span>
                <span className="text-xs text-slate-400 font-medium">km/h</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {weatherData.windSpeedKmh > 30 ? '💨 Vento Forte Lateral' : 'Vento Moderado'}
              </span>
            </div>

            {/* Humidity */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between shadow-sm">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Gauge className="w-3 h-3 text-indigo-400" />
                <span>Umidade</span>
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-white">{weatherData.humidity}%</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {weatherData.humidity > 80 ? 'Alta umidade / Neblina' : 'Condição Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs (Semana / Mês / Dicas de Chuva) */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-4 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('week')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'week'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Previsão da Semana (7 Dias)</span>
          </button>

          <button
            onClick={() => setActiveTab('month')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'month'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Previsão do Mês ({weatherData.monthlySummary.monthName})</span>
          </button>

          <button
            onClick={() => setActiveTab('safety')}
            className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'safety'
                ? 'border-lime-400 text-lime-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Guia de Chuva na Pista</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: PREVISÃO DA SEMANA */}
          {activeTab === 'week' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Selecione um dia da semana para ver detalhes:
                </h3>
                <span className="text-[11px] text-cyan-400 font-bold">
                  {weatherData.weeklyForecast.length} dias monitorados
                </span>
              </div>

              {/* 7-Day Carousel Horizontal Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {weatherData.weeklyForecast.map((day, idx) => {
                  const isSelected = selectedDayIndex === idx;
                  const hasRain = day.rainProbability >= 40 || day.riskLevel !== 'nenhum';

                  return (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDayIndex(idx)}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-between gap-1.5 transition-all relative ${
                        isSelected
                          ? 'bg-blue-600/30 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'bg-slate-950/80 hover:bg-slate-800 border-slate-800 text-slate-300'
                      }`}
                    >
                      {hasRain && (
                        <span className="absolute -top-1.5 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                        </span>
                      )}

                      <span className="text-xs font-black text-white">{day.dayName}</span>
                      <span className="text-[10px] text-slate-400">{day.dayMonth}</span>

                      <span className="text-2xl my-1">{day.icon}</span>

                      <div className="text-xs font-bold text-slate-200">
                        <span>{day.tempMax}°</span>
                        <span className="text-[10px] text-slate-400 font-normal ml-1">{day.tempMin}°</span>
                      </div>

                      <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-300">
                        <Droplets className="w-2.5 h-2.5" />
                        <span>{day.rainProbability}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Day Full Card Breakdown */}
              {selectedDay && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{selectedDay.icon}</span>
                      <div>
                        <h4 className="text-sm font-black text-white">
                          {selectedDay.dayName} ({selectedDay.dayMonth}) • {selectedDay.condition}
                        </h4>
                        <p className="text-xs text-slate-400">
                          Precipitação estimada: <b>{selectedDay.precipitationMm} mm</b> • Risco de pista: <b className="uppercase text-amber-400">{selectedDay.riskLevel}</b>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xl font-black text-white">{selectedDay.tempMax}° / {selectedDay.tempMin}°</span>
                    </div>
                  </div>

                  {/* Mode-Specific Warning for this day */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Car / Truck Alert */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-cyan-300 font-black text-xs">
                        <Car className="w-4 h-4" />
                        <span>Alerta para Motoristas (Carro / Caminhão)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {selectedDay.carAlert || 'Condições favoráveis de tráfego. Mantenha velocidade regulamentar e atenção padrão.'}
                      </p>
                    </div>

                    {/* Motorcycle Alert */}
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-lime-400 font-black text-xs">
                        <Bike className="w-4 h-4" />
                        <span>Alerta para Motociclistas & Pilotos</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {selectedDay.motorcycleAlert || 'Pistas secas e boa tração. Use sempre capacete afivelado e retrovisores alinhados.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PREVISÃO DO MÊS */}
          {activeTab === 'month' && (
            <div className="space-y-4">
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-base font-black text-white">
                      Panorama Climático de {weatherData.monthlySummary.monthName} / {weatherData.monthlySummary.year}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Médias históricas consolidadas e tendências para o motorista no Brasil
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl bg-blue-600/30 border border-blue-400/30 text-blue-300 font-black text-xs">
                    Mês Atual
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {weatherData.monthlySummary.summary}
                </p>

                {/* Monthly Key Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Média Máxima</span>
                    <div className="text-xl font-black text-amber-400 mt-0.5">{weatherData.monthlySummary.avgTempMax}°C</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Média Mínima</span>
                    <div className="text-xl font-black text-blue-400 mt-0.5">{weatherData.monthlySummary.avgTempMin}°C</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Dias com Chuva</span>
                    <div className="text-xl font-black text-cyan-400 mt-0.5">~{weatherData.monthlySummary.rainyDaysCount} dias</div>
                  </div>
                  <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-center">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Volume Total</span>
                    <div className="text-xl font-black text-indigo-300 mt-0.5">{weatherData.monthlySummary.totalPrecipitationMm} mm</div>
                  </div>
                </div>

                {/* Weekly Distribution throughout month */}
                <div className="pt-2">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                    Tendências por Semana do Mês:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {weatherData.monthlySummary.criticalWeeks.map((weekText, wIdx) => (
                      <div key={wIdx} className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-2.5 flex items-start gap-2">
                        <span className="w-5 h-5 rounded-lg bg-blue-900/60 text-cyan-300 flex items-center justify-center font-black text-[10px] shrink-0">
                          {wIdx + 1}
                        </span>
                        <span className="text-[11px] text-slate-300">{weekText}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Monthly Vehicle Guidance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-cyan-300 mb-1">
                      <Car className="w-4 h-4" />
                      <span>Recomendação Mensal (Carros)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {weatherData.monthlySummary.carAdvice}
                    </p>
                  </div>

                  <div className="bg-lime-950/30 border border-lime-500/30 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-xs font-black text-lime-400 mb-1">
                      <Bike className="w-4 h-4" />
                      <span>Recomendação Mensal (Motos)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      {weatherData.monthlySummary.motorcycleAdvice}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GUIA DE CHUVA NA PISTA (SAFETY DRIVER / PILOT) */}
          {activeTab === 'safety' && (
            <div className="space-y-4">
              {/* Vehicle Mode Switcher */}
              <div className="flex items-center justify-center gap-2 bg-slate-950 p-1 rounded-2xl border border-slate-800 max-w-sm mx-auto">
                <button
                  onClick={() => setVehicleTab('car')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                    vehicleTab === 'car'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Car className="w-4 h-4" />
                  <span>Motorista (Carro)</span>
                </button>

                <button
                  onClick={() => setVehicleTab('motorcycle')}
                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                    vehicleTab === 'motorcycle'
                      ? 'bg-lime-400 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>Piloto (Motociclista)</span>
                </button>
              </div>

              {/* Tips Cards */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">
                    {vehicleTab === 'car' 
                      ? 'Protocolo de Segurança na Chuva para Automóveis' 
                      : 'Protocolo de Sobrevivência na Chuva para Motociclistas'}
                  </h4>
                </div>

                <div className="space-y-2 pt-1">
                  {(vehicleTab === 'car' ? weatherData.driverAdvice.car : weatherData.driverAdvice.motorcycle).map((tip, tIdx) => (
                    <div 
                      key={tIdx}
                      className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-start gap-3 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 text-cyan-400 flex items-center justify-center font-black text-xs shrink-0 mt-0.5">
                        {tIdx + 1}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {tip}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-950 border-t border-slate-800 p-3 sm:p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Umbrella className="w-3.5 h-3.5 text-cyan-400" />
            <span>TÔ PASSANDO • Dados Meteorológicos de Alta Precisão</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black active:scale-95 transition-all shadow-md"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
