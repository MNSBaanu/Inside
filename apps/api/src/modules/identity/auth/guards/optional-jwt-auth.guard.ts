import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Attaches user when Bearer token is present; otherwise continues as anonymous. */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
    }>();
    if (!request.headers.authorization) {
      return true;
    }
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | undefined {
    if (err || !user) {
      return undefined;
    }
    return user;
  }
}
