-- ==============================================================================
-- CURSUS GPS / TÔ PASSANDO - BANCO DE DADOS SUPABASE (POSTGRESQL + POSTGIS)
-- Arquitetura completa com RLS estrita, índices geoespaciais e suporte a Realtime.
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ------------------------------------------------------------------------------
-- 2. Tabela: PROFILES (Perfis dos Usuários)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    avatar_url TEXT,
    preferred_mode TEXT DEFAULT 'car' CHECK (preferred_mode IN ('car', 'motorcycle', 'truck', 'bus', 'van', 'walk', 'multimodal')),
    vehicle_model TEXT DEFAULT 'sedan',
    vehicle_color TEXT DEFAULT 'lime',
    enable_voice_instructions BOOLEAN DEFAULT TRUE,
    enable_wind_effect BOOLEAN DEFAULT TRUE,
    enable_culture_audio BOOLEAN DEFAULT TRUE,
    map_layer_type TEXT DEFAULT 'streets',
    is_3d_mode BOOLEAN DEFAULT FALSE,
    theme_mode TEXT DEFAULT 'dark',
    share_location_community BOOLEAN DEFAULT TRUE,
    save_route_history BOOLEAN DEFAULT TRUE,
    anonymous_reports BOOLEAN DEFAULT FALSE,
    high_contrast BOOLEAN DEFAULT FALSE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    larger_text BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar seu próprio perfil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Inserção automática de perfil no cadastro"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- 3. Tabela: VEHICLES (Perfis Veiculares & Cursus Vehicle)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('car', 'motorcycle', 'truck', 'bus', 'van')),
    brand TEXT NOT NULL,
    model TEXT NOT NULL,
    fuel_type TEXT NOT NULL CHECK (fuel_type IN ('gasolina', 'etanol', 'diesel', 'gnv', 'eletrico', 'flex')),
    consumption_km_l NUMERIC(5, 2) NOT NULL DEFAULT 12.0,
    height_meters NUMERIC(4, 2),
    weight_tons NUMERIC(5, 2),
    length_meters NUMERIC(4, 2),
    license_plate TEXT,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seus próprios veículos"
    ON public.vehicles FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON public.vehicles(user_id);

-- ------------------------------------------------------------------------------
-- 4. Tabela: FAVORITES (Favoritos: Casa, Trabalho e Salvos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('home', 'work', 'saved')),
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    coordinates_lat NUMERIC(10, 7) NOT NULL,
    coordinates_lng NUMERIC(10, 7) NOT NULL,
    coordinates_geom GEOMETRY(Point, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seus próprios favoritos"
    ON public.favorites FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_geom ON public.favorites USING GIST(coordinates_geom);

-- ------------------------------------------------------------------------------
-- 5. Tabela: TRIPS & ROUTES (Histórico de Viagens e Rotas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    origin_name TEXT NOT NULL,
    destination_name TEXT NOT NULL,
    origin_lat NUMERIC(10, 7) NOT NULL,
    origin_lng NUMERIC(10, 7) NOT NULL,
    dest_lat NUMERIC(10, 7) NOT NULL,
    dest_lng NUMERIC(10, 7) NOT NULL,
    distance_meters INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL,
    safety_score NUMERIC(3, 1),
    fuel_used_liters NUMERIC(5, 2),
    total_cost_brl NUMERIC(6, 2),
    route_category TEXT DEFAULT 'fastest',
    transport_mode TEXT DEFAULT 'car',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem gerenciar seu histórico de viagens"
    ON public.trips FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_created_at ON public.trips(created_at DESC);

-- ------------------------------------------------------------------------------
-- 6. Tabela: INCIDENTS (Ocorrências do Mapa Vivo)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN (
        'acidente', 'buraco', 'alagamento', 'obras', 'veiculo_parado',
        'blitz', 'via_interditada', 'via_parcialmente_interditada',
        'objeto_via', 'animal_pista', 'incendio', 'semaforo_defeito',
        'congestionamento', 'ponto_roubo', 'local_perigoso', 'oleo_pista'
    )),
    title TEXT NOT NULL,
    description TEXT,
    location_name TEXT NOT NULL,
    coordinates_lat NUMERIC(10, 7) NOT NULL,
    coordinates_lng NUMERIC(10, 7) NOT NULL,
    coordinates_geom GEOMETRY(Point, 4326),
    source_type TEXT DEFAULT 'community' CHECK (source_type IN ('official', 'community')),
    source_name TEXT DEFAULT 'Condutor Cursus',
    status TEXT DEFAULT 'relatada_comunidade' CHECK (status IN ('planejada', 'em_andamento', 'relatada_comunidade', 'aguardando_confirmacao', 'confirmada_oficial', 'resolvida', 'cancelada', 'expirada')),
    severity TEXT DEFAULT 'media' CHECK (severity IN ('baixa', 'media', 'alta', 'critica')),
    affected_lanes TEXT DEFAULT 'Faixa Principal',
    confirmations_count INTEGER DEFAULT 1,
    resolved_votes_count INTEGER DEFAULT 0,
    denials_count INTEGER DEFAULT 0,
    confidence_score INTEGER DEFAULT 75 CHECK (confidence_score BETWEEN 0 AND 100),
    photo_url TEXT,
    is_ai_validated BOOLEAN DEFAULT FALSE,
    ai_confidence_percent INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Incidents (Leitura pública, inserção/edição autenticada com proteção)
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ocorrências ativas são visíveis publicamente"
    ON public.incidents FOR SELECT
    USING (status != 'cancelada');

CREATE POLICY "Usuários autenticados podem reportar ocorrências"
    ON public.incidents FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Autores ou sistema podem atualizar suas ocorrências"
    ON public.incidents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_incidents_geom ON public.incidents USING GIST(coordinates_geom);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_category ON public.incidents(category);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);

-- ------------------------------------------------------------------------------
-- 7. Tabela: INCIDENT_CONFIRMATIONS (Confirmações Colaborativas)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.incident_confirmations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('confirm_active', 'vote_resolved', 'report_fake')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(incident_id, user_id)
);

ALTER TABLE public.incident_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Qualquer usuário autenticado pode registrar 1 voto por ocorrência"
    ON public.incident_confirmations FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_incident_confirmations_incident ON public.incident_confirmations(incident_id);

-- ------------------------------------------------------------------------------
-- 8. Tabela: NAVIGATION_EVENTS & WEATHER_CACHE (Eventos de Telemetria & Clima)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.navigation_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'route_start', 'off_route_recalculation', 'incident_alert_shown', 'destination_reached'
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.navigation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários inserem apenas seus próprios eventos de telemetria"
    ON public.navigation_events FOR INSERT
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE TABLE IF NOT EXISTS public.weather_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    city_name TEXT NOT NULL,
    state_code TEXT NOT NULL,
    coordinates_lat NUMERIC(10, 7) NOT NULL,
    coordinates_lng NUMERIC(10, 7) NOT NULL,
    current_temp NUMERIC(4, 1),
    feels_like NUMERIC(4, 1),
    rain_probability INTEGER,
    rain_risk TEXT,
    condition_text TEXT,
    forecast_payload JSONB,
    cached_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weather_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura de cache de clima pública" ON public.weather_cache FOR SELECT USING (true);

-- ------------------------------------------------------------------------------
-- 9. Habilitar Realtime nas tabelas de ocorrências
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_confirmations;
