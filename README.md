# TÔ PASSANDO — GPS INTELIGENTE DO CURSUS
> **Slogan:** *“Você vai. A gente te guia.”*

O **TÔ PASSANDO** é um aplicativo e plataforma de navegação inteligente, multimodal, colaborativa e preventiva desenvolvida para condutores, motociclistas, pedestres e passageiros do transporte público de todo o Brasil (26 estados + Distrito Federal).

---

## 1. Identidade Visual e Experiência do Usuário

- **Cores Oficiais:**
  - **Azul Tecnológico:** `#0066FF` (primária, conectividade e rotas ativas)
  - **Verde-Limão TÔ PASSANDO:** `#CCFF00` (alta visibilidade, dinamismo e segurança)
  - **Azul Escuro / Meia-Noite:** `#0A1128` e `#050B14` (fundo tecnológico de alto contraste)
  - **Branco Puro:** `#FFFFFF` (tipografia nítida e legibilidade)
- **Marcador de Navegação Personalizável ("Carrinho"):**
  - Modelos visuais: Carro Sedan, Carro SUV, Motocicleta Esportiva, Scooter 2 Rodas, Van/Utilitário e Pedestre.
  - Paleta de cores selecionáveis: Verde-Limão, Azul Elétrico, Amarelo Cyber, Vermelho Ruby e Prata Espacial.
  - Animação vetorial suave com rotação orientada pela bússola/direção (`heading`).
  - **Rastro de Vento Opcional:** Partículas sutis e aerodinâmicas que transmitem velocidade e movimento sem poluir a cartografia.
- **Tela Inicial de Impacto (Splash Screen):**
  - Veículo em perspectiva com rastro de vento neon, logotipo luminoso e chamada para ação imediata.

---

## 2. Arquitetura Técnica e Tecnologias

```
                        ┌──────────────────────────────────────────────┐
                        │              TÔ PASSANDO WEB & PWA           │
                        │    React 19 + TypeScript + Tailwind CSS      │
                        │    Leaflet Map + Web Speech API (Voz)        │
                        └──────────────────────┬───────────────────────┘
                                               │ Proxy / API
                                               ▼
                        ┌──────────────────────────────────────────────┐
                        │             BACKEND NODE.JS / API            │
                        │        Express + Geocoding + Normalizer      │
                        └──────┬───────────────┬───────────────┬───────┘
                               │               │               │
                               ▼               ▼               ▼
                      ┌────────────────┐┌─────────────┐┌───────────────┐
                      │   ViaCEP /     ││    OSRM     ││  CURSUS       │
                      │  Nominatim     ││   Routing   ││ Normalização  │
                      │ Geocodificação ││ Turn-by-Turn││ Colaborativa  │
                      └────────────────┘└─────────────┘└───────────────┘
```

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS, Leaflet, Lucide Icons.
- **Backend API:** Node.js, Express, TypeScript (`tsx`), CORS.
- **Cartografia e Geocodificação:**
  - **ViaCEP Oficial:** Resolução instantânea de CEPs brasileiros de 8 dígitos.
  - **Nominatim / OpenStreetMap:** Busca geocodificada de logradouros, bairros e cidades brasileiras.
  - **OSRM (Open Source Routing Machine):** Cálculo de rotas reais, polylines curva a curva, cálculo de distâncias e duração.
  - **Camada Preparada para Google Maps Platform:** Arquitetura desacoplada pronta para injeção de chave `GOOGLE_MAPS_API_KEY` (Maps SDK, Routes API, Places API).
- **Testes Automatizados:** Vitest com suíte cobrindo validações de regras de negócio, algoritmos de normalização e segurança preventiva.

---

## 3. Principais Módulos Funcionais

### 3.1. Modos de Transporte e Multimodalidade
1. **Carro:** Instruções curva a curva, velocidade estimada, indicação de pedágios e rotas alternativas.
2. **Motocicleta:** Roteamento com alertas prioritários para duas rodas (buracos, óleo na pista, chuva/alagamentos) e oficinas especializadas.
3. **Ônibus, Metrô e Trem:** Segmentação de etapas intermodais (caminhada até a estação + linha de transporte + caminhada final ao destino).
4. **Caminhada (A pé):** Percursos a pé com tempo estimado e orientações.
5. **Viagem Combinada:** Visão unificada de deslocamento integrando transporte público e caminhada.

### 3.2. Central de Locais e Estabelecimentos
- Categorias cobertas:
  - **Saúde:** Hospitais de emergência, UPAs 24h, clínicas e farmácias.
  - **Comércio e Serviços:** Postos de combustível 24h com calibrador, oficinas mecânicas, motopeças e bancos.
  - **Transporte:** Terminais rodoviários, estações de metrô/trem e aeroportos.
  - **Lazer e Cultura:** Parques urbanos, museus e pontos turísticos.
- Ações diretas: Traçar Rota até o Local, Telefonar (`tel:`) e Abrir Website.

### 3.3. Acontecendo na Via (Colaborativo & Normalização)
- Registro transparente de incidentes (obras, buracos, alagamentos, semáforos quebrados, óleo na pista).
- Distinção transparente entre **Confirmada Oficialmente** e **Relato Comunitário**.
- **Algoritmo de Normalização Automática do CURSUS:**
  - Quando os condutores confirmam que a pista foi liberada (`vote_resolved >= 3`), o sistema altera o estado da ocorrência para `resolvida` e exibe o selo oficial:
  > *“Atualização do Cursus: a ocorrência foi marcada como resolvida. Via normalizada, conforme confirmação recebida.”*
- **Mensagens na Via:** Canal de comunicação anônimo e contextual por trecho de via para condutores compartilharem desvios e condições em tempo real, com avisos de segurança para não digitar ao volante.

### 3.4. Partida Segura (Checklist Preventivo Pré-Viagem)
- Checklist interativo e obrigatório antes de iniciar navegação motorizada:
  - **Para Carro:** Cinto de segurança, calibração dos pneus, retrovisores, nível de óleo, líquido de arrefecimento (**com aviso térmico destacado contra queimaduras**), iluminação/freios e documentos digitais (CNH/CRLV).
  - **Para Moto:** Capacete com viseira afivelado, pneus, retrovisores, óleo, arrefecimento (**aviso térmico**), freios/faróis/setas, corrente e transmissão, documentos.
- Trava de conscientização com barra de progresso antes de liberar a rota.

### 3.5. História e Cultura dos Lugares
- Informações sobre patrimônio histórico e curiosidades urbanas de cidades e bairros brasileiros (ex.: MASP, Copan, Plano Piloto de Brasília, Pelourinho) com narração em áudio via Web Speech API.

---

## 4. Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js versão 18 ou superior (Node.js 24 recomendado).
- npm 10+.

### Instalação
```bash
# Clone ou acerte o diretório do projeto
cd to-passando-gps

# Instale as dependências
npm install
```

### Execução dos Testes Automatizados
```bash
npm test
```

### Inicialização em Desenvolvimento
Abra dois terminais (ou execute via script integrado):

**Terminal 1 (Backend API - Porta 3001):**
```bash
npm run server
```

**Terminal 2 (Frontend Vite - Porta 5173):**
```bash
npm run dev
```

Acesse no navegador: `http://localhost:5173`.

---

## 5. Matriz de Integrações e Serviços

| Recurso | Status Atual | Provedor / Tecnologia | Observação |
| :--- | :--- | :--- | :--- |
| **Pesquisa de CEP** | 🟢 **100% Funcional** | ViaCEP Brasil Oficial | Gratuito, em tempo real |
| **Busca de Endereços** | 🟢 **100% Funcional** | Nominatim / OSM | Cobertura nacional |
| **Cálculo de Rotas** | 🟢 **100% Funcional** | OSRM Project | Distâncias, ETA, curvas reais |
| **Normalização CURSUS** | 🟢 **100% Funcional** | Engine Colaborativa Cursus | Validação comunitária |
| **Partida Segura** | 🟢 **100% Funcional** | Módulo Nativo Cursus | Checklists Carro e Moto |
| **Google Maps Platform**| 🟡 **Arquitetura Pronta** | Google Cloud / Maps API | Requer `GOOGLE_MAPS_API_KEY` |
| **Feeds GTFS Realtime** | 🟡 **Demonstração Estruturada**| Operadoras de Transporte | Requer credenciais municipais |

---

## 6. Privacidade e LGPD

- Localização geográfica obtida apenas sob permissão explícita do navegador.
- Opção para condutores limparem o histórico de viagens e destinos a qualquer momento.
- Relatos comunitários anonimizados para proteger a integridade dos motoristas.
