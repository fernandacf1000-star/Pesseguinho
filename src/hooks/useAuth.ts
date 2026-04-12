import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { checkInvite } from '../lib/inviteList'
import type { Session, User } from '@supabase/supabase-js'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated'; accessDenied?: boolean }
  | { status: 'authenticated'; user: User; session: Session }

async function validateAndSetSession(
  session: Session | null,
  setState: (s: AuthState) => void
) {
  if (!session?.user) {
    setState({ status: 'unauthenticated' })
    return
  }

  const email = session.user.email ?? ''
  const invited = await checkInvite(email)

  if (!invited) {
    await supabase.auth.signOut()
    setState({ status: 'unauthenticated', accessDenied: true })
    return
  }

  setState({ status: 'authenticated', user: session.user, session })
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      validateAndSetSession(session, setAuthState)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      validateAndSetSession(session, setAuthState)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  async function signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return { authState, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }
}
