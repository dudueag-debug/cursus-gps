import { useState, useEffect, useRef } from 'react';

// Web Speech API interface declaration for TypeScript
interface SpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface VoiceCommanderProps {
  onSearchDestination: (query: string) => void;
  onStartNavigation: () => void;
  onStopNavigation: () => void;
  onOpenPanel: (panel: 'map' | 'places' | 'occurrences' | 'safety' | 'culture') => void;
  onRecenterMap?: () => void;
  onSpeakResponse: (text: string) => void;
}

export function useVoiceCommander({
  onSearchDestination,
  onStartNavigation,
  onStopNavigation,
  onOpenPanel,
  onRecenterMap,
  onSpeakResponse,
}: VoiceCommanderProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastActionMessage, setLastActionMessage] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setIsSupported(false);
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('Ouvindo... Fale agora.');
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        try {
          const current = event.results[0][0].transcript;
          setTranscript(current);
        } catch {}
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.warn('SpeechRecognition notice:', event?.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } catch (err) {
      console.warn('SpeechRecognition não suportado ou bloqueado neste dispositivo:', err);
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  const processCommand = (phrase: string) => {
    const text = phrase.toLowerCase().trim();
    if (!text) return;

    // 1. Iniciar Navegação
    if (text.includes('iniciar navega') || text.includes('começar navega') || text.includes('vamos') || text.includes('iniciar rota')) {
      setLastActionMessage('Iniciando navegação GPS...');
      onSpeakResponse('Iniciando navegação. Você vai. A gente te guia.');
      onStartNavigation();
      return;
    }

    // 2. Parar / Cancelar Navegação
    if (text.includes('parar navega') || text.includes('cancelar rota') || text.includes('encerrar') || text.includes('parar')) {
      setLastActionMessage('Encerrando navegação');
      onSpeakResponse('Navegação pausada.');
      onStopNavigation();
      return;
    }

    // 3. Central de Locais / Buscar Serviços
    if (text.includes('hospital') || text.includes('upa') || text.includes('posto de sa')) {
      setLastActionMessage('Abrindo serviços de saúde');
      onSpeakResponse('Abrindo hospitais e pronto atendimento na Central de Locais.');
      onOpenPanel('places');
      return;
    }

    if (text.includes('posto de gasolina') || text.includes('combustível') || text.includes('abastecer') || text.includes('oficina')) {
      setLastActionMessage('Abrindo postos e oficinas');
      onSpeakResponse('Localizando postos de combustível e oficinas na Central de Locais.');
      onOpenPanel('places');
      return;
    }

    // 4. Ocorrências na via
    if (text.includes('ocorrência') || text.includes('acidente') || text.includes('buraco') || text.includes('trânsito') || text.includes('na via')) {
      setLastActionMessage('Abrindo alertas da via');
      onSpeakResponse('Consultando ocorrências e condições das vias em tempo real.');
      onOpenPanel('occurrences');
      return;
    }

    // 5. Partida Segura
    if (text.includes('partida segura') || text.includes('checklist') || text.includes('segurança')) {
      setLastActionMessage('Abrindo checklist de segurança');
      onSpeakResponse('Abrindo checklist preventivo Partida Segura.');
      onOpenPanel('safety');
      return;
    }

    // 6. Cultura e História
    if (text.includes('história') || text.includes('cultura') || text.includes('monumento') || text.includes('patrimônio')) {
      setLastActionMessage('Abrindo fatos históricos');
      onSpeakResponse('Abrindo história e patrimônio cultural dos lugares.');
      onOpenPanel('culture');
      return;
    }

    // 7. Centralizar mapa
    if (text.includes('centralizar') || text.includes('minha posição') || text.includes('onde eu estou')) {
      setLastActionMessage('Centralizando no veículo');
      onSpeakResponse('Centralizando mapa na sua posição atual.');
      if (onRecenterMap) onRecenterMap();
      return;
    }

    // 8. Destino / Navegar até...
    let cleanDest = text
      .replace(/^ir para\s+/i, '')
      .replace(/^navegar para\s+/i, '')
      .replace(/^navegar até\s+/i, '')
      .replace(/^levar para\s+/i, '')
      .replace(/^quero ir para\s+/i, '')
      .replace(/^rota para\s+/i, '')
      .replace(/^buscar\s+/i, '');

    if (cleanDest.length > 2) {
      setLastActionMessage(`Buscando destino: ${cleanDest}`);
      onSpeakResponse(`Buscando rota para ${cleanDest}`);
      onSearchDestination(cleanDest);
      onOpenPanel('map');
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Seu navegador não possui suporte ao microfone Web Speech. Recomendamos o Google Chrome.');
      return;
    }

    try {
      setTranscript('');
      setLastActionMessage('');
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Recognition already started or error:', e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        if (transcript && transcript !== 'Ouvindo... Fale agora.') {
          processCommand(transcript);
        }
      } catch (e) {
        console.warn('Error stopping recognition:', e);
      }
    }
  };

  return {
    isListening,
    transcript,
    lastActionMessage,
    isSupported,
    startListening,
    stopListening,
    processCommand,
  };
}
