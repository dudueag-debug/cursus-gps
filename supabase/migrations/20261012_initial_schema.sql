-- ====================================================================
-- CURSUS GPS / TÔ PASSANDO — Migration Inicial de Banco de Dados
-- PostgreSQL / PostGIS Spatial Database Schema
-- ====================================================================

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Perfis de Usuários (LGPD-compliant)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  name VARCHAR(120) NOT NULL,
  username VARCHAR(60) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(30),
  preferred_mode VARCHAR(30) DEFAULT 'car',
  vehicle_model VARCHAR(50) DEFAULT 'sport',
  vehicle_color VARCHAR(30) DEFAULT 'lime',
  save_route_history BOOLEAN DEFAULT TRUE,
  anonymous_reports BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Ocorrências Colaborativas ("Acontecendo na Via")
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category VARCHAR(60) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  location_name VARCHAR(255),
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  source_type VARCHAR(30) DEFAULT 'community',
  source_name VARCHAR(120) DEFAULT 'Comunidade Cursus',
  status VARCHAR(40) DEFAULT 'relatada_comunidade',
  severity VARCHAR(20) DEFAULT 'media',
  affected_lanes VARCHAR(100) DEFAULT 'Faixa Principal',
  confirmations_count INTEGER DEFAULT 1,
  resolved_votes_count INTEGER DEFAULT 0,
  denials_count INTEGER DEFAULT 0,
  confidence_score INTEGER DEFAULT 75,
  is_normalized BOOLEAN DEFAULT FALSE,
  data_origin VARCHAR(30) DEFAULT 'reported',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices espaciais e temporais para consultas ultrarrápidas
CREATE INDEX IF NOT EXISTS idx_incidents_lat_lng ON public.incidents (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents (created_at DESC);

-- 4. Tabela de Histórico de Rotas Privado
CREATE TABLE IF NOT EXISTS public.route_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  origin_name VARCHAR(255) NOT NULL,
  destination_name VARCHAR(255) NOT NULL,
  distance_meters INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_histories_user_id ON public.route_histories (user_id);

-- 5. Row Level Security (RLS) — Proteção de Dados e Privacidade
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

-- Incidentes são públicos para leitura por condutores na via
CREATE POLICY "Leitura pública de ocorrências" ON public.incidents
  FOR SELECT USING (true);

-- Usuários só podem acessar seu próprio histórico de rotas
CREATE POLICY "Acesso apenas ao próprio histórico" ON public.route_histories
  FOR ALL USING (auth.uid() = user_id);
