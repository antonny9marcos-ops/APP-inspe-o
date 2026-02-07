-- =============================================
-- MIGRAÇÃO: Tabelas de Fornecedores e Motivos
-- Execute este SQL no Supabase SQL Editor
-- =============================================

-- ============ TABELA FORNECEDORES ============
CREATE TABLE IF NOT EXISTS fornecedores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj TEXT,
  contato TEXT,
  email TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir fornecedores iniciais
INSERT INTO fornecedores (nome, status) VALUES
  ('SUPERIOR INDUSTRIES DO BRASIL LTDA.', 'ativo'),
  ('SOMMA INDUSTRIA E COMERCIO DE EQUIPAMENTOS LTDA.', 'ativo'),
  ('PROK BRASIL INDUSTRIA DE COMPONENTES LTDA.', 'ativo'),
  ('IMEPEL - INDUSTRIA MECANICA LTDA.', 'ativo'),
  ('Artur Küpper GmbH & Co. KG.', 'ativo'),
  ('RULMECA ROLLERS S.R.L.', 'ativo'),
  ('MARTIN SPROCKET & GEAR INC.', 'ativo'),
  ('SKF DO BRASIL LTDA.', 'ativo'),
  ('NSK BRASIL LTDA.', 'ativo'),
  ('TIMKEN DO BRASIL LTDA.', 'ativo');

-- Enable RLS
ALTER TABLE fornecedores ENABLE ROW LEVEL SECURITY;

-- Policies para fornecedores
CREATE POLICY "select_fornecedores" ON fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_fornecedores" ON fornecedores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_fornecedores" ON fornecedores FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_fornecedores" ON fornecedores FOR DELETE TO authenticated USING (true);


-- ============ TABELA MOTIVOS DE REJEIÇÃO ============
CREATE TABLE IF NOT EXISTS motivos_rejeicao (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir motivos iniciais
INSERT INTO motivos_rejeicao (descricao, status) VALUES
  ('Nenhum / Conforme', 'ativo'),
  ('Excentricidade acima de 0,6', 'ativo'),
  ('Defeito de Superfície / Pintura', 'ativo'),
  ('Dimensional fora de especificação', 'ativo'),
  ('Solda com defeito', 'ativo'),
  ('Material oxidado/corroído', 'ativo'),
  ('Embalagem danificada', 'ativo'),
  ('Documentação incompleta', 'ativo'),
  ('Quantidade divergente', 'ativo'),
  ('Componente faltante', 'ativo');

-- Enable RLS
ALTER TABLE motivos_rejeicao ENABLE ROW LEVEL SECURITY;

-- Policies para motivos_rejeicao
CREATE POLICY "select_motivos" ON motivos_rejeicao FOR SELECT TO authenticated USING (true);
CREATE POLICY "insert_motivos" ON motivos_rejeicao FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_motivos" ON motivos_rejeicao FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_motivos" ON motivos_rejeicao FOR DELETE TO authenticated USING (true);
