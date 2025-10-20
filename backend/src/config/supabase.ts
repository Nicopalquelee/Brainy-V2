import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Asegurar que las variables de entorno estén cargadas
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variables de Supabase faltantes:');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Configurada' : 'Faltante');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Configurada' : 'Faltante');
  console.error('SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Configurada' : 'Faltante');
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Admin client (bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Public/anon client for user auth flows (does not mutate admin session)
export const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Database types matching Supabase schema
export interface Profile {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  role: 'student' | 'teacher' | 'admin';
  bio?: string;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  subject?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  rating?: number;
  author_id: string;
  file_url?: string;
  thumbnail_url?: string;
  downloads: number;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  content: string;
  note_id: string;
  author_id: string;
  parent_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  note_id: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}