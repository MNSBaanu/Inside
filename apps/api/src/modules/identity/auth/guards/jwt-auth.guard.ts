import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService, type RequestUser } from '../auth.service';

export type AuthRequest = {
  headers: { authorization?: string };
  user?: RequestUser;
};

export function bearerToken(request: AuthRequest): string | null {
  const [scheme, token] = request.headers.authorization?.split(' ') ?? [];
  return scheme === 'Bearer' && token ? token : null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = bearerToken(request);
    if (!token) throw new UnauthorizedException();
    request.user = await this.authService.authenticateToken(token);
    return true;
  }
}
