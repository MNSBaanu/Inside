import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../auth.service';

/** Requires JWT user with role ADMIN (checks user.role, not activeRole). */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Admin only');
    }
    return true;
  }
}
