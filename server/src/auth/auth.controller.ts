import {
  Controller,
  Post,
  HttpCode,
  Body,
  HttpStatus,
  UseGuards,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { RefreshTokenGuard } from './guards';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './auth.dto';
import { ServiceResponse } from './types';
import {
  CookieUserDecorator,
  CookieTokenDecorator,
} from '../common/decorators/';
import { todayPlusOneWeek } from '../utils';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() dto: SignupDto, @Res() res: Response): Promise<void> {
    const serviceResponse: ServiceResponse = await this.authService.signUp(dto);
    this.setResponseDestination(serviceResponse, res);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: LoginDto, @Res() res: Response): Promise<void> {
    const serviceResponse: ServiceResponse = await this.authService.signIn(dto);
    this.setResponseDestination(serviceResponse, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CookieUserDecorator('sub') userId: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.logout(userId);
    res.cookie('refreshToken', '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      expires: new Date(),
    });
    res.sendStatus(HttpStatus.OK);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @CookieUserDecorator('sub') userId: string,
    @CookieTokenDecorator() token: string,
    @Res() res: Response,
  ): Promise<void> {
    const serviceResponse: ServiceResponse =
      await this.authService.refreshTokens(token, userId);
    this.setResponseDestination(serviceResponse, res);
  }

  private setResponseDestination(
    serviceResponse: ServiceResponse,
    res: Response,
  ): void {
    const { tokens, userId, userEmail } = serviceResponse;
    if (!tokens) {
      throw new UnauthorizedException();
    }

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      expires: todayPlusOneWeek(),
      secure:
        this.configService.get('NODE_ENV', 'development') === 'production',
      path: '/',
    });
    res.status(HttpStatus.CREATED).json({
      accessToken: tokens.accessToken,
      user: { userId, userEmail },
    });
  }
}
