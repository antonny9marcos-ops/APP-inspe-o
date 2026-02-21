-- =============================================
-- MIGRAÇÃO: Sistema de Notificações
-- =============================================

-- ============ TABELA NOTIFICAÇÕES ============
CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  tipo TEXT DEFAULT 'sistema' CHECK (tipo IN ('rejeicao', 'update', 'sistema', 'aviso')),
  lida BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Realtime para esta tabela
-- Nota: Isso geralmente é feito no dashboard, mas pode ser feito via SQL em alguns contextos
-- ALTER PUBLICATION supabase_realtime ADD TABLE notificacoes;

-- Enable RLS
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;

-- Policies para notificacoes
DO $$ 
BEGIN
    -- Usuários podem ver apenas suas próprias notificações
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_view_own_notifications') THEN
        CREATE POLICY "users_view_own_notifications" ON notificacoes FOR SELECT TO authenticated USING (auth.uid() = user_id);
    END IF;

    -- Usuários podem marcar suas notificações como lidas (update)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'users_update_own_notifications') THEN
        CREATE POLICY "users_update_own_notifications" ON notificacoes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
    END IF;

    -- Sistema/Admins podem inserir notificações para usuários
    -- No Supabase, se quisermos que o 'perfil' (Admin) insira para outros, precisamos de uma política específica
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'admins_insert_notifications') THEN
        CREATE POLICY "admins_insert_notifications" ON notificacoes FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
END $$;
