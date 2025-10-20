import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers?.authorization as string | undefined;
    if (!auth) throw new UnauthorizedException('No authorization header');
    const [type, token] = auth.split(' ');
    if (type !== 'Bearer' || !token) throw new UnauthorizedException('Invalid token');
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
      req.user = payload;
      return true;
      } catch {
      throw new UnauthorizedException('Token invalid or expired');
    }
  }
}
