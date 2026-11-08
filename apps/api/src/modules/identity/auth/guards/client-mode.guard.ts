import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../auth.service';

/** Requires JWT user in CLIENT activeRole (clients or designers acting as clients). */
@Injectable()
export class ClientModeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user || user.role === Role.ADMIN) {
      throw new ForbiddenException('Client mode required');
    }
    if (user.activeRole !== Role.CLIENT) {
      throw new ForbiddenException(
        'Switch to client mode (PATCH /users/me/active-role)',
      );
    }
    return true;
  }
}
