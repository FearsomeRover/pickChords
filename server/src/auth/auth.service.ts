import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UpdateUsernameDto } from './dto/update-username.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

export interface User {
  id: number;
  username: string;
  is_admin: boolean;
  created_at: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  is_admin: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private toUser(dbUser: any): User {
    return {
      id: dbUser.id,
      username: dbUser.username,
      is_admin: dbUser.isAdmin || false,
      created_at: dbUser.createdAt.toISOString(),
    };
  }

  async register(registerDto: RegisterDto): Promise<{ user: User; token: string }> {
    const { username, password } = registerDto;

    // Check if username already exists
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const dbUser = await this.prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    const user = this.toUser(dbUser);
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const { username, password } = loginDto;

    const dbUser = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!dbUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, dbUser.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = this.toUser(dbUser);
    const token = this.generateToken(user);

    return { user, token };
  }

  async findById(id: number): Promise<User | null> {
    const dbUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!dbUser) return null;

    return this.toUser(dbUser);
  }

  async updateUsername(userId: number, dto: UpdateUsernameDto): Promise<{ user: User; token: string }> {
    const { newUsername } = dto;

    // Check if new username already exists (by another user)
    const existing = await this.prisma.user.findFirst({
      where: {
        username: newUsername,
        NOT: { id: userId },
      },
    });

    if (existing) {
      throw new ConflictException('Username already taken');
    }

    // Update username
    try {
      const dbUser = await this.prisma.user.update({
        where: { id: userId },
        data: { username: newUsername },
      });

      const user = this.toUser(dbUser);
      const token = this.generateToken(user);

      return { user, token };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new BadRequestException('User not found');
      }
      throw error;
    }
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = dto;

    // Get current password hash
    const dbUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });
  }

  private generateToken(user: User): string {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      is_admin: user.is_admin,
    };
    return this.jwtService.sign(payload);
  }
}
