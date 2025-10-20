import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos TypeScript para las tablas de la base de datos
export interface Profile {
  id: string
  email: string
  username?: string
  full_name?: string
  avatar_url?: string
  role: 'student' | 'teacher' | 'admin'
  bio?: string
  created_at: string
  updated_at: string
}

export interface Note {
  id: string
  title: string
  content: string
  subject?: string
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  rating?: number
  author_id: string
  file_url?: string
  thumbnail_url?: string
  downloads: number
  views: number
  created_at: string
  updated_at: string
  // Relaciones
  profiles?: Profile
  categories?: Category[]
}

export interface Comment {
  id: string
  content: string
  note_id: string
  author_id: string
  parent_id?: string
  created_at: string
  updated_at: string
  // Relaciones
  profiles?: Profile
  replies?: Comment[]
}

export interface Favorite {
  id: string
  user_id: string
  note_id: string
  created_at: string
  // Relaciones
  notes?: Note
}

export interface Category {
  id: string
  name: string
  description?: string
  color: string
  icon?: string
  created_at: string
}

export interface Conversation {
  id: string
  user_id: string
  title?: string
  created_at: string
  updated_at: string
  // Relaciones
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  content: string
  role: 'user' | 'assistant'
  created_at: string
}

// Funciones de utilidad para autenticación
export const auth = {
  // Obtener usuario actual
  getCurrentUser: () => supabase.auth.getUser(),
  
  // Registrarse con verificación por email
  signUp: async (
    email: string,
    password: string,
    userData?: { username?: string; full_name?: string },
    emailRedirectTo?: string
  ) => {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
        emailRedirectTo
      }
    })
  },
  
  // Iniciar sesión
  signIn: async (email: string, password: string) => {
    return supabase.auth.signInWithPassword({ email, password })
  },
  
  // Cerrar sesión
  signOut: () => supabase.auth.signOut(),
  
  // Escuchar cambios de autenticación
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Funciones de utilidad para notas
export const notes = {
  // Obtener notas publicadas
  getPublishedNotes: async () => {
    return supabase
      .from('notes')
      .select(`
        *,
        profiles:author_id(username, full_name, avatar_url),
        categories:note_categories(categories(*))
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
  },
  
  // Obtener notas del usuario
  getUserNotes: async (userId: string) => {
    return supabase
      .from('notes')
      .select('*')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
  },
  
  // Crear nota
  createNote: async (note: Omit<Note, 'id' | 'created_at' | 'updated_at' | 'downloads' | 'views'>) => {
    return supabase.from('notes').insert(note)
  },
  
  // Actualizar nota
  updateNote: async (id: string, updates: Partial<Note>) => {
    return supabase.from('notes').update(updates).eq('id', id)
  },
  
  // Eliminar nota
  deleteNote: async (id: string) => {
    return supabase.from('notes').delete().eq('id', id)
  }
}

// Funciones de utilidad para favoritos
export const favorites = {
  // Obtener favoritos del usuario
  getUserFavorites: async (userId: string) => {
    return supabase
      .from('favorites')
      .select(`
        *,
        notes(*)
      `)
      .eq('user_id', userId)
  },
  
  // Agregar a favoritos
  addToFavorites: async (userId: string, noteId: string) => {
    return supabase.from('favorites').insert({ user_id: userId, note_id: noteId })
  },
  
  // Remover de favoritos
  removeFromFavorites: async (userId: string, noteId: string) => {
    return supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('note_id', noteId)
  }
}

// Funciones de utilidad para categorías
export const categories = {
  // Obtener todas las categorías
  getAll: async () => {
    return supabase.from('categories').select('*').order('name')
  }
}

// Funciones de utilidad para chat
export const chat = {
  // Obtener conversaciones del usuario
  getUserConversations: async (userId: string) => {
    return supabase
      .from('conversations')
      .select(`
        *,
        messages(*)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
  },
  
  // Crear conversación
  createConversation: async (userId: string, title?: string) => {
    return supabase.from('conversations').insert({ user_id: userId, title })
  },
  
  // Agregar mensaje
  addMessage: async (conversationId: string, content: string, role: 'user' | 'assistant') => {
    return supabase.from('messages').insert({
      conversation_id: conversationId,
      content,
      role
    })
  }
}