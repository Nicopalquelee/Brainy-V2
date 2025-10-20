import { Injectable } from '@nestjs/common';
import { supabaseAdmin as supabase, Note } from '../config/supabase';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  async create(dto: CreateDocumentDto & { author_id?: string }): Promise<Note> {
    // Prefer 4.5 for PDF, but if DB column is integer, decimals will fail.
    // Use integer fallback (4) to avoid insert errors. See README note for enabling decimals.
    const isPdf = (dto as any)?.fileType && String((dto as any).fileType).toLowerCase().includes('pdf');
    const initialRatingInt = isPdf ? 3 : 0;

    const { data, error } = await supabase
      .from('notes')
      .insert({
        title: dto.title,
        content: dto.description || '',
        subject: dto.subject,
        file_url: dto.contentUrl,
        author_id: dto.author_id,
        status: 'published',
        downloads: 0,
        views: 0,
        // Nota: Si quieres 4.5, migra la columna rating a numeric(3,1) y cambia este valor a 4.5
        rating: initialRatingInt
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating document: ${error.message}`);
    }

    return data;
  }

  async list(page = 1, pageSize = 12) {
    const start = (page - 1) * pageSize;
    
    const { data: items, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:author_id(username, full_name)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) {
      throw new Error(`Error fetching documents: ${error.message}`);
    }

    const { count } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const total = count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return { items: items || [], total, page, pageSize, totalPages };
  }

  async find(id: string): Promise<Note | null> {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:author_id(username, full_name, avatar_url)
      `)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching document: ${error.message}`);
    }

    return data || null;
  }

  async rate(id: string, score: number): Promise<Note | null> {
    const note = await this.find(id);
    if (!note) return null;

    // Calcular nuevo rating (promedio simple por ahora)
    const newRating = score; // Aquí podrías implementar lógica más compleja

    const { data, error } = await supabase
      .from('notes')
      .update({ rating: newRating })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error rating document: ${error.message}`);
    }

    return data;
  }

  async search(q: string): Promise<Note[]> {
    if (!q || q.trim() === '') {
      const result = await this.list(1, 50);
      return result.items || [];
    }

    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:author_id(username, full_name)
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${q}%, content.ilike.%${q}%, subject.ilike.%${q}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error searching documents: ${error.message}`);
    }

    return data || [];
  }

  async incrementViews(id: string): Promise<void> {
    // Primero obtenemos el valor actual
    const current = await this.find(id);
    if (!current) return;

    const { error } = await supabase
      .from('notes')
      .update({ 
        views: (current.views || 0) + 1
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error incrementing views: ${error.message}`);
    }
  }

  async incrementDownloads(id: string): Promise<void> {
    // Primero obtenemos el valor actual
    const current = await this.find(id);
    if (!current) return;

    const { error } = await supabase
      .from('notes')
      .update({ 
        downloads: (current.downloads || 0) + 1
      })
      .eq('id', id);

    if (error) {
      throw new Error(`Error incrementing downloads: ${error.message}`);
    }
  }

  async getByAuthor(authorId: string): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('author_id', authorId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching documents by author: ${error.message}`);
    }

    return data || [];
  }

  async update(id: string, updates: Partial<Note>): Promise<Note> {
    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating document: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error deleting document: ${error.message}`);
    }
  }

  async getPopular(limit = 10): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:author_id(username, full_name)
      `)
      .eq('status', 'published')
      .order('views', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching popular documents: ${error.message}`);
    }

    return data || [];
  }

  async getRecent(limit = 10): Promise<Note[]> {
    const { data, error } = await supabase
      .from('notes')
      .select(`
        *,
        profiles:author_id(username, full_name)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Error fetching recent documents: ${error.message}`);
    }

    return data || [];
  }

  async getStats(): Promise<{ total: number; published: number; drafts: number; archived: number; avgRating?: number }>{
    // Count totals by status using head+count queries
    const countExact = async (status?: string) => {
      let q = supabase.from('notes').select('*', { count: 'exact', head: true });
      if (status) q = q.eq('status', status as any);
      const { count, error } = await q;
      if (error) {
        // eslint-disable-next-line no-console
        console.error('[documents.stats] count error:', error.message);
        return 0;
      }
      return count || 0;
    };

    const [total, published, drafts, archived] = await Promise.all([
      countExact(),
      countExact('published'),
      countExact('draft'),
      countExact('archived')
    ]);

    // Average rating over published notes (consider only ratings > 0)
    let avgRating: number | undefined = undefined;
    try {
      const { data: rows, error: rateErr } = await supabase
        .from('notes')
        .select('rating')
        .eq('status', 'published')
        .gt('rating', 0);
      if (!rateErr && Array.isArray(rows)) {
        const vals = rows
          .map((r: any) => Number(r?.rating))
          .filter((n) => Number.isFinite(n) && n > 0);
        if (vals.length > 0) {
          const sum = vals.reduce((a, b) => a + b, 0);
          const avg = sum / vals.length;
          avgRating = Math.round(avg * 10) / 10;
        } else {
          avgRating = 0;
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[documents.stats] avgRating error:', (e as any)?.message || e);
    }

    return { total, published, drafts, archived, avgRating };
  }
}