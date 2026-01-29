import { Controller, Post, Get, Body, UseGuards, Request, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
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
}
