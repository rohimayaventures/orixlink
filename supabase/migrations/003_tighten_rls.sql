-- ═══════════════════════════════════════════════════════════════════════════
-- RLS tightening (idempotent): anonymous clients must NOT insert into
-- sessions or messages. All inserts go through the API with the service role.
-- If you already applied 003_assess_usage_rls.sql, these statements are no-ops.
-- ═══════════════════════════════════════════════════════════════════════════

drop policy if exists "Anon users can create sessions" on public.sessions;
drop policy if exists "Anon users can insert messages" on public.messages;
