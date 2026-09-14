-- =============================================================
-- CORREÇÃO DE SEGURANÇA: RLS de perfis, fornecedores e motivos_rejeicao
-- Execute este SQL inteiro no Supabase SQL Editor do projeto.
--
-- Problema corrigido:
--   1) A tabela `perfis` permitia que QUALQUER usuário autenticado
--      alterasse a própria coluna `role` (ou a de outro usuário) e
--      excluísse perfis, bastando chamar a API do Supabase
--      diretamente (o app só escondia esses botões na tela, não
--      impedia a chamada). Isso permitia auto-promoção a Admin.
--   2) `fornecedores` e `motivos_rejeicao` tinham INSERT/UPDATE/DELETE
--      liberados para "true" (qualquer autenticado, inclusive papel
--      Cliente), ignorando a regra da interface de que só
--      Admin/Inspetor podem gerenciar esses cadastros.
--
-- Este script é seguro para rodar mais de uma vez (idempotente).
-- =============================================================

-- ── PASSO 0 (opcional, recomendado): veja o estado atual antes de aplicar ──
-- Rode esta consulta primeiro se quiser conferir todas as políticas
-- já existentes no banco antes da correção (não altera nada):
--
-- SELECT schemaname, tablename, policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;


-- ── PASSO 1: função auxiliar para checar o papel do usuário logado ──
-- SECURITY DEFINER evita o problema de "recursão" que aconteceria se
-- a política da própria tabela `perfis` tentasse consultar `perfis`.
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role FROM perfis WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;


-- ── PASSO 2: travar a tabela `perfis` ──
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Leitura: mantém como está hoje (todo autenticado pode ver a lista de
-- perfis — necessário para nomes de inspetor, notificações, etc.)
DROP POLICY IF EXISTS "perfis_select_authenticated" ON perfis;
CREATE POLICY "perfis_select_authenticated" ON perfis
  FOR SELECT TO authenticated
  USING (true);

-- Inserção: só Admin pode criar novos perfis pela API do app
-- (o trigger de signup, se existir, roda como SECURITY DEFINER e
-- não é afetado por esta política).
DROP POLICY IF EXISTS "perfis_insert_admin_only" ON perfis;
CREATE POLICY "perfis_insert_admin_only" ON perfis
  FOR INSERT TO authenticated
  WITH CHECK (public.my_role() = 'Admin');

-- Atualização: Admin pode atualizar qualquer perfil; qualquer usuário
-- pode atualizar APENAS o próprio perfil (ex: avatar, nome).
DROP POLICY IF EXISTS "perfis_update" ON perfis;
CREATE POLICY "perfis_update" ON perfis
  FOR UPDATE TO authenticated
  USING (public.my_role() = 'Admin' OR auth.uid() = id)
  WITH CHECK (public.my_role() = 'Admin' OR auth.uid() = id);

-- Exclusão: só Admin pode excluir perfis.
DROP POLICY IF EXISTS "perfis_delete_admin_only" ON perfis;
CREATE POLICY "perfis_delete_admin_only" ON perfis
  FOR DELETE TO authenticated
  USING (public.my_role() = 'Admin');

-- Trava extra: mesmo no PRÓPRIO perfil, ninguém além de Admin pode
-- mudar `role` ou `setor` (fecha a brecha de auto-promoção).
CREATE OR REPLACE FUNCTION public.prevent_self_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.my_role() IS DISTINCT FROM 'Admin' THEN
    IF NEW.role IS DISTINCT FROM OLD.role OR NEW.setor IS DISTINCT FROM OLD.setor THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar cargo (role) ou setor.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_change ON perfis;
CREATE TRIGGER trg_prevent_self_role_change
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_role_change();


-- ── PASSO 3: travar `fornecedores` e `motivos_rejeicao` ──
-- Regra: Admin e Inspetor podem gerenciar; Cliente só pode ler
-- (igual à regra que já existe na tela, agora aplicada no banco).

DROP POLICY IF EXISTS "insert_fornecedores" ON fornecedores;
CREATE POLICY "insert_fornecedores" ON fornecedores
  FOR INSERT TO authenticated
  WITH CHECK (public.my_role() IN ('Admin', 'Inspetor'));

DROP POLICY IF EXISTS "update_fornecedores" ON fornecedores;
CREATE POLICY "update_fornecedores" ON fornecedores
  FOR UPDATE TO authenticated
  USING (public.my_role() IN ('Admin', 'Inspetor'));

DROP POLICY IF EXISTS "delete_fornecedores" ON fornecedores;
CREATE POLICY "delete_fornecedores" ON fornecedores
  FOR DELETE TO authenticated
  USING (public.my_role() IN ('Admin', 'Inspetor'));
-- "select_fornecedores" continua liberado pra todo autenticado (sem alteração).

DROP POLICY IF EXISTS "insert_motivos" ON motivos_rejeicao;
CREATE POLICY "insert_motivos" ON motivos_rejeicao
  FOR INSERT TO authenticated
  WITH CHECK (public.my_role() IN ('Admin', 'Inspetor'));

DROP POLICY IF EXISTS "update_motivos" ON motivos_rejeicao;
CREATE POLICY "update_motivos" ON motivos_rejeicao
  FOR UPDATE TO authenticated
  USING (public.my_role() IN ('Admin', 'Inspetor'));

DROP POLICY IF EXISTS "delete_motivos" ON motivos_rejeicao;
CREATE POLICY "delete_motivos" ON motivos_rejeicao
  FOR DELETE TO authenticated
  USING (public.my_role() IN ('Admin', 'Inspetor'));
-- "select_motivos" continua liberado pra todo autenticado (sem alteração).


-- =============================================================
-- PASSO 4: REMOVER ACESSO ANÔNIMO (o achado mais grave)
-- Rodando o diagnóstico do Passo 0 depois da primeira aplicação
-- deste script, apareceram políticas antigas — provavelmente
-- criadas pelo assistente de setup do Supabase ou por testes
-- anteriores — liberando o papel `public` (que inclui `anon`,
-- ou seja, QUALQUER pessoa sem login) para SELECT/INSERT/UPDATE/
-- DELETE em `fornecedores`, `motivos_rejeicao`, `materiais` e,
-- mais grave ainda, em `inspecoes` (os registros reais de
-- inspeção). Como políticas RLS se somam, isso ignorava
-- completamente todas as regras acima. Removendo agora:
-- =============================================================

DROP POLICY IF EXISTS "Allow anon all" ON fornecedores;
DROP POLICY IF EXISTS "Allow anon all" ON motivos_rejeicao;

DROP POLICY IF EXISTS "Allow anonymous delete access" ON inspecoes;
DROP POLICY IF EXISTS "Allow anonymous insert access" ON inspecoes;
DROP POLICY IF EXISTS "Allow anonymous select access" ON inspecoes;
DROP POLICY IF EXISTS "Allow anonymous update access" ON inspecoes;

DROP POLICY IF EXISTS "Allow anon delete" ON materiais;
DROP POLICY IF EXISTS "Allow anon insert" ON materiais;
DROP POLICY IF EXISTS "Allow anonymous read access" ON materiais;
DROP POLICY IF EXISTS "Allow anon update" ON materiais;

-- Garante que `inspecoes` e `materiais` também só liberam
-- Admin/Inspetor para escrever (Cliente só lê), igual ao padrão
-- já aplicado em fornecedores/motivos_rejeicao. As políticas
-- "Admin e Inspetor gerenciam inspeções" e "Admin gerencia
-- materiais" que já existiam continuam valendo — isto só
-- garante que não faltou nenhum comando coberto.
DROP POLICY IF EXISTS "inspecoes_write_admin_inspetor" ON inspecoes;
CREATE POLICY "inspecoes_write_admin_inspetor" ON inspecoes
  FOR ALL TO authenticated
  USING (public.my_role() IN ('Admin', 'Inspetor'))
  WITH CHECK (public.my_role() IN ('Admin', 'Inspetor'));

DROP POLICY IF EXISTS "materiais_write_admin_inspetor" ON materiais;
CREATE POLICY "materiais_write_admin_inspetor" ON materiais
  FOR ALL TO authenticated
  USING (public.my_role() IN ('Admin', 'Inspetor'))
  WITH CHECK (public.my_role() IN ('Admin', 'Inspetor'));


-- =============================================================
-- PASSO 5: corrigir bug em `admins_insert_notifications`
-- O nome sugere "só admin", mas a política estava com
-- WITH CHECK (true) — ou seja, qualquer autenticado podia criar
-- notificação em nome de qualquer usuário. Regra corrigida:
-- qualquer usuário pode criar notificação PARA SI MESMO (ex: "seu
-- plano de ação da IA ficou pronto"), e só Admin pode criar
-- notificação em nome de outra pessoa.
-- =============================================================
DROP POLICY IF EXISTS "admins_insert_notifications" ON notificacoes;
CREATE POLICY "admins_insert_notifications" ON notificacoes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.my_role() = 'Admin');


-- =============================================================
-- PASSO 6 (opcional — só organização, sem risco de segurança):
-- limpar políticas antigas duplicadas em `perfis`. A proteção
-- contra auto-promoção já está garantida pelo gatilho criado no
-- Passo 2 (ele roda em qualquer UPDATE, não importa qual política
-- liberou); isto só remove duplicatas confusas.
-- =============================================================
DROP POLICY IF EXISTS "Admins possuem controle total" ON perfis;
DROP POLICY IF EXISTS "Admin controle total" ON perfis;
DROP POLICY IF EXISTS "Perfis visíveis para todos" ON perfis;
DROP POLICY IF EXISTS "Leitura pública para autenticados" ON perfis;
DROP POLICY IF EXISTS "Edição do próprio perfil" ON perfis;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios perfis" ON perfis;


-- ── PASSO 7: confira o resultado final ──
-- Rode a consulta do Passo 0 de novo. Depois deste script, cada
-- tabela deve mostrar só políticas com roles = {authenticated} e
-- nenhuma com qual/with_check = true sem checar my_role() (exceto
-- as de SELECT, que continuam abertas a todo autenticado de
-- propósito) — e nenhuma linha com roles = {public} deveria
-- sobrar, exceto "Users can delete their own notifications" em
-- notificacoes (essa é segura mesmo com {public}, porque exige
-- auth.uid() = user_id, que nunca é verdadeiro pra quem não fez
-- login).
