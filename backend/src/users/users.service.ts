import { Injectable } from '@nestjs/common';
import { supabaseAdmin, Profile } from '../config/supabase';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  async create(dto: CreateUserDto): Promise<Profile> {
    // Creamos el usuario marcando el email como confirmado para permitir login inmediato
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
      user_metadata: {
        username: dto.username,
        full_name: dto.name,
        role: dto.role || 'student'
      }
    });

    if (error) {
      // Log full error for server diagnostics
      // eslint-disable-next-line no-console
      console.error('❌ Supabase createUser error:', {
        status: (error as any)?.status,
        message: error.message,
        name: error.name
      });
      // Friendly messages for common cases
      const msg = error.message?.toLowerCase() || '';
      if (msg.includes('user already registered') || msg.includes('duplicate') || msg.includes('already exists')) {
        throw new Error('El correo ya está registrado.');
      }
      if (msg.includes('password')) {
        throw new Error('La contraseña no cumple la política de seguridad.');
      }
      if (msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('email rate limit exceeded')) {
        throw new Error('Límite de envío de correos excedido. Por favor, configura SMTP personalizado en Supabase o intenta más tarde. Consulta la documentación para más información.');
      }
      throw new Error(`No se pudo crear el usuario: ${error.message}`);
    }

    // eslint-disable-next-line no-console
    console.log('✅ Usuario creado con login inmediato:', dto.email);
    return data.user as unknown as Profile;
  }

  async findAll(): Promise<Profile[]> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }

    return data || [];
  }

  async findOne(id: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Error fetching user: ${error.message}`);
    }

    return data || null;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Error fetching user by email: ${error.message}`);
    }

    return data || null;
  }

  async update(id: string, payload: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    // Eliminar usuario de Auth también
  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      throw new Error(`Error deleting user from auth: ${authError.message}`);
    }

    // El perfil se eliminará automáticamente por CASCADE
  }

  // Diagnostic: attempt a harmless admin call to validate service_role key
  async __diagListUsersOnce(): Promise<string> {
    try {
      // This call requires service_role; using a tiny limit to avoid noise
  const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) throw new Error(error.message);
      const count = data?.users?.length ?? 0;
      return `admin ok, users fetched: ${count}`;
    } catch (e: any) {
      throw new Error(`supabase admin error: ${e?.message || 'unknown'}`);
    }
  }
}
