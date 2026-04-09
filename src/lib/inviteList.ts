import { supabase } from './supabase'

// ── Tabela de convidados no Supabase ──────────────────────────────────────
// Crie via SQL Editor no Supabase:
//
//   create table invited_users (
//     id uuid primary key default gen_random_uuid(),
//     email text unique not null,
//     invited_by uuid references auth.users,
//     invited_at timestamptz default now(),
//     used boolean default false
//   );
//
//   -- Apenas usuários autenticados podem ler sua própria entrada
//   alter table invited_users enable row level security;
//   create policy "can read own invite"
//     on invited_users for select
//     using (email = auth.jwt() ->> 'email');
//
//   -- Apenas você (owner) insere convites — faça pelo painel do Supabase
//   -- ou crie uma policy restrita ao seu user_id.

export async function checkInvite(email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('invited_users')
    .select('email')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle()

  if (error) return false
  return !!data
}

export async function markInviteUsed(email: string): Promise<void> {
  await supabase
    .from('invited_users')
    .update({ used: true })
    .eq('email', email.toLowerCase().trim())
}
