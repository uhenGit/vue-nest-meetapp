import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';
import { Prisma } from '@prisma/client';
import { LoginDto, SignupDto } from './auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Tokens } from './types';

@Injectable({})
export class AuthService {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: SignupDto): Promise<Tokens> {
    const hash = await this.generateHash(dto.password);
    try {
      const user = await this.prismaService.user.create({
        data: {
          email: dto.email,
          hash,
          userName: dto.userName || '',
        },
      });
      const tokens = await this.generateTokens(user.id, user.email);
      await this.handleRefreshToken(user.id, tokens.refreshToken);

      return tokens;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ForbiddenException('User already exists');
      }

      throw err;
    }
  }

  async signIn(dto: LoginDto): Promise<Tokens> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Incorrect credentials');
    }

    const hashMatches = await argon.verify(user.hash, dto.password);

    if (!hashMatches) {
      throw new ForbiddenException('Incorrect credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.handleRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.prismaService.user.updateMany({
      where: {
        id: userId,
        hashedRT: {
          not: null,
        },
      },
      data: {
        hashedRT: null,
      },
    });
  }

  async refreshToken(token: string) {}

  async handleRefreshToken(userId: string, refreshToken: string) {
    const hash = await this.generateHash(refreshToken);
    try {
      await this.prismaService.user.update({
        where: {
          id: userId,
        },
        data: {
          hashedRT: hash,
        },
      });
    } catch (err) {
      throw err;
    }
  }

  async generateHash(source: string): Promise<string> {
    return argon.hash(source);
  }

  async generateTokens(userId: string, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get('ACCESS_TOKEN_SECRET'),
          expiresIn: 60 * 15, // 15 minutes
        },
      ),
      this.jwt.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get('REFRESH_TOKEN_SECRET'),
          expiresIn: 60 * 60 * 24 * 7, // a week
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }
}
