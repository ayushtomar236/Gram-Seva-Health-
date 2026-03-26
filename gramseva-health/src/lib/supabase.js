/**
 * Supabase Client — GramSeva Health
 * Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if Supabase is configured
export const isSupabaseConfigured = SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 10;

// Create a real or dummy client
export const supabase = isSupabaseConfigured
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : {
        auth: {
            getSession: async () => ({ data: { session: null } }),
            getUser: async () => ({ data: { user: null } }),
            signUp: async () => ({ error: { message: 'Supabase not configured. Add keys to .env' } }),
            signInWithPassword: async () => ({ error: { message: 'Supabase not configured. Add keys to .env' } }),
            signOut: async () => ({}),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
        },
        from: () => ({
            select: () => ({ eq: () => ({ single: async () => ({ data: null }), order: () => ({ limit: async () => ({ data: [] }) }) }), order: () => ({ limit: async () => ({ data: [] }) }), data: [], count: 0 }),
            insert: () => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'Supabase not configured' } }) }) }),
            update: () => ({ eq: async () => ({}) }),
        }),
    };
