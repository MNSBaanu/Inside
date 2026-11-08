import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthUser } from './auth.service';

const AUTH_THROTTLE = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Register a client or designer' })
  @ApiCreatedResponse({ description: 'User created and tokens issued' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({ description: 'Access and refresh tokens' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    });
  }

  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  @ApiOkResponse({ description: 'New token pair' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh session' })
  @ApiOkResponse({ description: 'Session revoked' })
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current authenticated user' })
  @ApiOkResponse({ description: 'User profile' })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.id);
  }

  @Post('forgot-password')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Create a password-reset token (email later)' })
  @ApiOkResponse({ description: 'Generic success message' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Reset password with AuthToken' })
  @ApiOkResponse({ description: 'Password updated' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  @Post('verify-email')
  @Throttle(AUTH_THROTTLE)
  @ApiOperation({ summary: 'Verify email with AuthToken' })
  @ApiOkResponse({ description: 'Email marked verified' })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.token);
  }
}
