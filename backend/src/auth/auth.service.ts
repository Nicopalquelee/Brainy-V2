import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as jwt from 'jsonwebtoken';
import { supabaseAnon, supabaseAdmin } from '../config/supabase';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(email: string, pass: string) {
    // Validate credentials against Supabase Auth
    const { data, error } = await supabaseAnon.auth.signInWithPassword({
      email,
      password: pass
    });

    if (error || !data?.user) {
      return null;
    }

    // Try to fetch profile to get role and other info
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile && !profileError) {
      return profile as { id: string; email: string; role: string };
    }

    // Fallback: build from Supabase user when profile row doesn't exist yet (e.g., trigger pending)
    const roleFromMeta = (data.user.user_metadata as any)?.role || 'student';
    return { id: data.user.id, email: data.user.email || email, role: roleFromMeta };
  }

  async login(user: { id: string | number; email: string; role: string }) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'changeme', {
      expiresIn: '8h'
    });
    return { accessToken: token };
  }
}
