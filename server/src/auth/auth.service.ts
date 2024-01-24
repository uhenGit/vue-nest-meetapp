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
import { Tokens, ServiceResponse } from './types';

@Injectable({})
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async signUp(dto: SignupDto): Promise<ServiceResponse> {
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

      return { tokens, userId: user.id, userEmail: user.email };
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

  async signIn(dto: LoginDto): Promise<ServiceResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new NotFoundException('Incorrect credentials');
    }

    const isHashMatches = await argon.verify(user.hash, dto.password);

    if (!isHashMatches) {
      throw new ForbiddenException('Incorrect credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.handleRefreshToken(user.id, tokens.refreshToken);

    return { tokens, userId: user.id, userEmail: user.email };
  }

  // If the userId is undefined, prisma handles all the entries
  // It should be null to prevent changes or string to find matches
  async logout(userId: string | null): Promise<void> {
    console.log('ID: ', userId);
    if (!userId) {
      return;
    }

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

  async refreshTokens(
    refreshToken: string,
    userId: string,
  ): Promise<ServiceResponse> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user || !user.hashedRT) {
      throw new ForbiddenException('Access denied');
    }

    const isHashMatches = await argon.verify(user.hashedRT, refreshToken);

    if (!isHashMatches) {
      throw new ForbiddenException('Access denied');
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await this.generateTokens(userId, user.email);
    await this.handleRefreshToken(userId, newRefreshToken);
    const tokens = {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };

    return { tokens, userId: user.id, userEmail: user.email };
  }

  private async handleRefreshToken(userId: string, refreshToken: string) {
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

  private async generateHash(source: string): Promise<string> {
    return argon.hash(source);
  }

  private async generateTokens(userId: string, email: string): Promise<Tokens> {
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
