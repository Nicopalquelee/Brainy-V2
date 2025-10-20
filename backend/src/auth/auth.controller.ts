import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    try {
      // simple email domain check
      if (!dto.email.endsWith('@correo.uss.cl')) {
        return { error: 'Debe usar correo institucional (@correo.uss.cl)' };
      }
      const user = await this.usersService.create(dto);
      return { id: (user as any).id, email: (user as any).email };
    } catch (e: any) {
      // Surface a friendly error to the frontend instead of 500
      const msg = e?.message || 'No se pudo registrar el usuario';
      return { error: msg };
    }
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) return { error: 'Credenciales inválidas' };
      return this.authService.login(user);
    } catch (e: any) {
      const msg = e?.message || 'Error al iniciar sesión';
      return { error: msg };
    }
  }

  // Diagnostic endpoint to check Supabase admin connectivity (development only)
  @Get('diagnostics/supabase')
  async supabaseDiagnostics() {
    try {
      const res = await this.usersService["__diagListUsersOnce"]?.();
      // eslint-disable-next-line no-console
      console.log(`[diagnostics] supabase admin check OK: ${res}`);
      return { ok: true, detail: res ?? 'ok' };
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[diagnostics] supabase admin check ERROR:', e?.message || e);
      return { ok: false, error: e?.message || 'unknown error' };
    }
  }

  // Diagnostic endpoint to check JWT secret presence
  @Get('diagnostics/jwt')
  async jwtDiagnostics() {
    const hasJwt = !!process.env.JWT_SECRET;
    return { hasJwt, sample: hasJwt ? (process.env.JWT_SECRET || '').slice(0, 4) + '***' : null };
  }
}
