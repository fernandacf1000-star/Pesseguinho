import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import type { Session, User } from '@supabase/supabase-js'

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: User; session: Session }

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setAuthState({ status: 'authenticated', user: session.user, session })
      } else {
        setAuthState({ status: 'unauthenticated' })
      }
    })

    // Listener para mudanças de sessão
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthState({ status: 'authenticated', user: session.user, session })
      } else {
        setAuthState({ status: 'unauthenticated' })
      }
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
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return { authState, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut }
}
