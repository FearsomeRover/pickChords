import { Controller, Post, Get, Put, Body, UseGuards, Request, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { JwtAuthGuard } from './auth.guard';
import { LogsService } from '../logs/logs.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly logsService: LogsService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.authService.register(registerDto);
    await this.logsService.info('auth.register', `New user registered: ${registerDto.username}`, {
      username: registerDto.username,
      ipAddress: req.ip,
      userAgent,
    });
    return result;
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: any,
    @Headers('user-agent') userAgent?: string,
  ) {
    try {
      const result = await this.authService.login(loginDto);
      await this.logsService.info('auth.login', `User logged in: ${loginDto.username}`, {
        username: loginDto.username,
        ipAddress: req.ip,
        userAgent,
      });
      return result;
    } catch (error) {
      await this.logsService.warn('auth.login_failed', `Failed login attempt for: ${loginDto.username}`, {
        username: loginDto.username,
        ipAddress: req.ip,
        userAgent,
      });
      throw error;
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return req.user;
  }

  @Put('username')
  @UseGuards(JwtAuthGuard)
  async updateUsername(
    @Request() req: any,
    @Body() dto: UpdateUsernameDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    const result = await this.authService.updateUsername(req.user.id, dto);
    await this.logsService.info('auth.username_change', `User changed username: ${req.user.username} -> ${dto.newUsername}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
      metadata: { oldUsername: req.user.username, newUsername: dto.newUsername },
    });
    return result;
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  async updatePassword(
    @Request() req: any,
    @Body() dto: UpdatePasswordDto,
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.authService.updatePassword(req.user.id, dto);
    await this.logsService.info('auth.password_change', `User changed password: ${req.user.username}`, {
      userId: req.user.id,
      username: req.user.username,
      ipAddress: req.ip,
      userAgent,
    });
    return { message: 'Password updated successfully' };
  }
}
