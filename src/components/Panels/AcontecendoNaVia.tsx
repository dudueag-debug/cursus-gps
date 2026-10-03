import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  PlusCircle, 
  ShieldCheck, 
  Clock, 
  MapPin, 
  Send, 
  ThumbsUp, 
  Check, 
  X,
  HelpCircle
} from 'lucide-react';
import { Occurrence, OccurrenceCategory, OccurrenceMessage, Coordinates } from '../../types';
import { api } from '../../services/api';

interface AcontecendoNaViaProps {
  currentLocation: Coordinates;
  onSelectOccurrenceOnMap: (occ: Occurrence) => void;
  onRefreshMap: () => void;
}

export const AcontecendoNaVia: React.FC<AcontecendoNaViaProps> = ({
  currentLocation,
  onSelectOccurrenceOnMap,
  onRefreshMap,
}) => {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccForChat, setSelectedOccForChat] = useState<Occurrence | null>(null);
  const [chatMessages, setChatMessages] = useState<OccurrenceMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [isReportingModalOpen, setIsReportingModalOpen] = useState(false);

  // New report form state
  const [newCategory, setNewCategory] = useState<OccurrenceCategory>('buraco');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newLocationName, setNewLocationName] = useState('Próximo à minha localização atual');
  const [newSeverity, setNewSeverity] = useState<'baixa' | 'media' | 'alta' | 'critica'>('media');
  const [newAffectedLanes, setNewAffectedLanes] = useState('Faixa central');

  const loadOccurrences = async () => {
    try {
      const data = await api.getOccurrences();
      setOccurrences(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOccurrences();
  }, []);

  const handleConfirmAction = async (id: string, action: 'confirm_active' | 'vote_resolved' | 'report_fake') => {
    try {
      await api.confirmOccurrence(id, action);
      await loadOccurrences();
      onRefreshMap();
    } catch (e) {
      console.error(e);
      alert('Erro ao processar validação comunitária.');
    }
  };

  const handleOpenChat = async (occ: Occurrence) => {
    setSelectedOccForChat(occ);
    try {
      const msgs = await api.getOccurrenceMessages(occ.id);
      setChatMessages(msgs);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOccForChat || !newMessageText.trim()) return;

    try {
      const sent = await api.postOccurrenceMessage(selectedOccForChat.id, 'Condutor Cursus', newMessageText);
      setChatMessages(prev => [...prev, sent]);
      setNewMessageText('');
      loadOccurrences();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('Informe um título para a ocorrência.');
      return;
    }

    try {
      await api.reportOccurrence({
        category: newCategory,
        title: newTitle,
        description: newDescription,
        locationName: newLocationName,
        coordinates: currentLocation,
        severity: newSeverity,
        affectedLanes: newAffectedLanes,
      });

      setIsReportingModalOpen(false);
      setNewTitle('');
      setNewDescription('');
      await loadOccurrences();
      onRefreshMap();
      alert('Ocorrência registrada com sucesso na rede colaborativa Cursus!');
    } catch (e) {
      console.error(e);
      alert('Falha ao registrar ocorrência.');
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-2xl flex flex-col gap-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <h2 className="text-lg font-black tracking-tight text-white">Acontecendo na Via</h2>
          </div>
          <p className="text-xs text-slate-400">
            Alertas em tempo real: obras, acidentes, buracos, alagamentos e condições de tráfego validadas.
          </p>
        </div>

        <button
          onClick={() => setIsReportingModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Relatar Ocorrência</span>
        </button>
      </div>

      {/* Normalization & Transparency Banner */}
      <div className="bg-blue-950/40 border border-blue-800/60 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-300">
        <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-white">Algoritmo de Normalização Automática do CURSUS</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            Diferenciamos com transparência dados de órgãos oficiais de relatos comunitários. Quando os condutores confirmam que a pista foi liberada, o sistema normaliza a via automaticamente.
          </p>
        </div>
      </div>

      {/* List of occurrences */}
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
            Carregando ocorrências e condições das vias...
          </div>
        ) : occurrences.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            Nenhuma ocorrência ativa no momento nas suas proximidades.
          </div>
        ) : (
          occurrences.map(occ => {
            const isOfficial = occ.sourceType === 'official';
            const isResolved = occ.isNormalized || occ.status === 'resolvida';

            return (
              <div
                key={occ.id}
                className={`border rounded-xl p-3.5 flex flex-col gap-3 transition-all ${
                  isResolved
                    ? 'bg-emerald-950/20 border-emerald-800/60'
                    : occ.severity === 'critica'
                    ? 'bg-red-950/20 border-red-800/60'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header item */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isOfficial ? 'bg-blue-900/60 text-blue-300 border border-blue-700' : 'bg-purple-900/60 text-purple-300 border border-purple-700'
                      }`}>
                        {isOfficial ? 'Oficial • ' + occ.sourceName : 'Comunidade • ' + occ.sourceName}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isResolved ? 'bg-emerald-900/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'
                      }`}>
                        {isResolved ? 'Via Normalizada / Resolvida' : occ.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-slate-100 mt-1">{occ.title}</h3>
                  </div>

                  <button
                    onClick={() => onSelectOccurrenceOnMap(occ)}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                    title="Ver no mapa"
                  >
                    <MapPin className="w-4 h-4 text-lime-400" />
                  </button>
                </div>

                <p className="text-xs text-slate-300">{occ.description}</p>

                {/* Normalization Message if resolved */}
                {occ.isNormalized && occ.normalizationMessage && (
                  <div className="bg-emerald-950/50 border border-emerald-700/60 rounded-lg p-2.5 text-xs text-emerald-200 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{occ.normalizationMessage}</span>
                  </div>
                )}

                {/* Road details */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{occ.locationName}</span>
                  </div>

                  {occ.affectedLanes && (
                    <div>
                      <span className="text-slate-500">Faixa:</span> {occ.affectedLanes}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Atualizado há pouco</span>
                  </div>
                </div>

                {/* Community Interaction Bar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    {/* Confirm still active */}
                    <button
                      onClick={() => handleConfirmAction(occ.id, 'confirm_active')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
                      title="Confirmar que ainda está lá"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-blue-400" />
                      <span>Ainda está ({occ.confirmationsCount})</span>
                    </button>

                    {/* Vote resolved / normalized */}
                    <button
                      onClick={() => handleConfirmAction(occ.id, 'vote_resolved')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 rounded-lg text-xs transition-colors"
                      title="Informar que a pista foi liberada"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Liberou / Resolvido ({occ.resolvedVotesCount})</span>
                    </button>
                  </div>

                  {/* Chat comments */}
                  <button
                    onClick={() => handleOpenChat(occ)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/30 hover:bg-blue-900/50 text-blue-300 border border-blue-700/40 rounded-lg text-xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Mensagens na Via ({occ.messagesCount})</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Discussion modal for the incident */}
      {selectedOccForChat && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-4 shadow-2xl flex flex-col gap-3 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h3 className="font-bold text-sm text-white">Mensagens na Mesma Via</h3>
                <p className="text-[11px] text-slate-400 truncate max-w-xs">{selectedOccForChat.title}</p>
              </div>
              <button
                onClick={() => setSelectedOccForChat(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Safety banner */}
            <div className="bg-amber-950/40 border border-amber-800/60 rounded-lg p-2 text-[10px] text-amber-200">
              Aviso de Segurança: Nunca digite enquanto estiver conduzindo. Mensagens devem ser trocadas em paradas seguras.
            </div>

            {/* Chat message list */}
            <div className="flex flex-col gap-2 overflow-y-auto max-h-60 p-1">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Nenhuma mensagem neste trecho ainda.</p>
              ) : (
                chatMessages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl text-xs flex flex-col gap-0.5 ${
                      msg.isOfficial ? 'bg-blue-950 border border-blue-700 text-blue-100' : 'bg-slate-950 border border-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-bold text-lime-400">{msg.userName}</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p>{msg.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Form to send message */}
            <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <input
                type="text"
                value={newMessageText}
                onChange={e => setNewMessageText(e.target.value)}
                placeholder="Compartilhar aviso sobre a pista..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Relatar Nova Ocorrência */}
      {isReportingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                Relatar Ocorrência na Via
              </h3>
              <button onClick={() => setIsReportingModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-300 block mb-1">Categoria:</label>
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as OccurrenceCategory)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                >
                  <option value="buraco">Buraco / Pavimento Danificado (Risco a motos)</option>
                  <option value="acidente">Acidente na Pista</option>
                  <option value="obras">Obras / Fresagem / Recapeamento</option>
                  <option value="alagamento">Ponto de Alagamento</option>
                  <option value="oleo_pista">Óleo na Pista / Pista Escorregadia</option>
                  <option value="semaforo_defeito">Semáforo com Defeito</option>
                  <option value="congestionamento">Congestionamento Intenso</option>
                  <option value="arvore_caida">Árvore ou Obstáculo na Via</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Título resumido:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ex: Buraco fundo na faixa da direita"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-300 block mb-1">Detalhes e referências:</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Descreva o que viu para orientar os demais condutores..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Gravidade:</label>
                  <select
                    value={newSeverity}
                    onChange={e => setNewSeverity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica (Interdição)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Faixa afetada:</label>
                  <input
                    type="text"
                    value={newAffectedLanes}
                    onChange={e => setNewAffectedLanes(e.target.value)}
                    placeholder="Ex: Direita, acostamento"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportingModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Publicar Relato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
