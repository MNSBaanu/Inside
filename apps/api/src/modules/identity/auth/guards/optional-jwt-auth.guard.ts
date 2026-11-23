import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { bearerToken, type AuthRequest } from './jwt-auth.guard';

/** Attaches user when Bearer token is present; otherwise continues as anonymous. */
@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const token = bearerToken(request);
    if (token) {
      request.user = await this.authService
        .authenticateToken(token)
        .catch(() => undefined);
    }
    return true;
  }
}
