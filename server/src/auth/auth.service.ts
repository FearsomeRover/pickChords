import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';
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
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{ user: User; token: string }> {
    const { username, password } = registerDto;

    // Check if username already exists
    const existing = await this.db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      throw new ConflictException('Username already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const result = await this.db.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username, is_admin, created_at',
      [username, passwordHash]
    );

    const user: User = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      is_admin: result.rows[0].is_admin || false,
      created_at: result.rows[0].created_at,
    };
    const token = this.generateToken(user);

    return { user, token };
  }

  async login(loginDto: LoginDto): Promise<{ user: User; token: string }> {
    const { username, password } = loginDto;

    const result = await this.db.query(
      'SELECT id, username, password_hash, is_admin, created_at FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const userRow = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, userRow.password_hash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user: User = {
      id: userRow.id,
      username: userRow.username,
      is_admin: userRow.is_admin || false,
      created_at: userRow.created_at,
    };

    const token = this.generateToken(user);

    return { user, token };
  }

  async findById(id: number): Promise<User | null> {
    const result = await this.db.query(
      'SELECT id, username, is_admin, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;

    return {
      id: result.rows[0].id,
      username: result.rows[0].username,
      is_admin: result.rows[0].is_admin || false,
      created_at: result.rows[0].created_at,
    };
  }

  async updateUsername(userId: number, dto: UpdateUsernameDto): Promise<{ user: User; token: string }> {
    const { newUsername } = dto;

    // Check if new username already exists (by another user)
    const existing = await this.db.query(
      'SELECT id FROM users WHERE username = $1 AND id != $2',
      [newUsername, userId]
    );

    if (existing.rows.length > 0) {
      throw new ConflictException('Username already taken');
    }

    // Update username
    const result = await this.db.query(
      'UPDATE users SET username = $1 WHERE id = $2 RETURNING id, username, is_admin, created_at',
      [newUsername, userId]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('User not found');
    }

    const user: User = {
      id: result.rows[0].id,
      username: result.rows[0].username,
      is_admin: result.rows[0].is_admin || false,
      created_at: result.rows[0].created_at,
    };

    // Generate new token with updated username
    const token = this.generateToken(user);

    return { user, token };
  }

  async updatePassword(userId: number, dto: UpdatePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = dto;

    // Get current password hash
    const result = await this.db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );
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
