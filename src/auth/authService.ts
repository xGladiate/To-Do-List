import { isAuthApiError, type User } from '@supabase/supabase-js'
import { supabase } from '../supabase/supabaseClient.ts'

export type AccountState = {
  configured: boolean
  user: User | null
  anonymous: boolean
  email: string | null
  googleLinked: boolean
}

export async function getAccountState(): Promise<AccountState> {
  if (supabase === null) {
    return { configured: false, user: null, anonymous: true, email: null, googleLinked: false }
  }

  const { data } = await supabase.auth.getSession()
  const user = data.session?.user ?? null

  return {
    configured: true,
    user,
    anonymous: user?.is_anonymous ?? true,
    email: user?.email ?? null,
    googleLinked: user?.identities?.some((identity) => identity.provider === 'google') ?? false,
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  if (supabase === null) throw new Error('Supabase is not configured.')
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error !== null) throw error
}

export async function createEmailAccount(email: string, password: string): Promise<string> {
  if (supabase === null) throw new Error('Supabase is not configured.')
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: window.location.origin },
  })
  if (error !== null) throw error

  return data.session === null
    ? 'Check your email to confirm the account, then sign in.'
    : 'Your account is ready.'
}

export async function continueWithGoogle(linkToCurrentUser: boolean): Promise<void> {
  if (supabase === null) throw new Error('Supabase is not configured.')

  const credentials = {
    provider: 'google' as const,
    options: {
      redirectTo: window.location.origin,
      scopes: 'openid email profile',
    },
  }

  const { error } = linkToCurrentUser
    ? await supabase.auth.linkIdentity(credentials)
    : await supabase.auth.signInWithOAuth(credentials)

  if (error !== null) throw error
}

export async function signOut(): Promise<void> {
  if (supabase === null) return
  const { error } = await supabase.auth.signOut()
  if (error !== null) throw error
}

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (isAuthApiError(error)) {
    if (error.code === 'over_email_send_rate_limit') {
      return 'The Supabase test-email limit was reached. Wait before trying again, or configure custom SMTP for higher limits.'
    }

    if (error.code === 'over_request_rate_limit' || error.status === 429) {
      return 'Too many authentication attempts were made. Wait a few minutes before trying again.'
    }

    if (error.code === 'invalid_credentials') {
      return 'The email or password is incorrect.'
    }

    if (error.code === 'email_not_confirmed') {
      return 'Confirm your email address before signing in.'
    }

    if (error.code === 'manual_linking_disabled') {
      return 'Enable manual identity linking in Supabase Authentication settings before linking Google to this account.'
    }
  }

  return error instanceof Error ? error.message : fallback
}
