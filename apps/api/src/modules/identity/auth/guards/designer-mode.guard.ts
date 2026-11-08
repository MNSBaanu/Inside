import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role } from '@inside/database';
import type { AuthUser } from '../auth.service';

/** Requires JWT user with role DESIGNER and activeRole DESIGNER. */
@Injectable()
export class DesignerModeGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user || user.role !== Role.DESIGNER) {
      throw new ForbiddenException('Designer account required');
    }
    if (user.activeRole !== Role.DESIGNER) {
      throw new ForbiddenException(
        'Switch to designer mode (PATCH /users/me/active-role)',
      );
    }
    return true;
  }
}
