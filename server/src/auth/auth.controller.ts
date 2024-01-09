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
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto } from './auth.dto';
import { Tokens } from './types';
import { CookieUserDecorator, CookieTokenDecorator } from '../common/decorators/';
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
    const tokens: Tokens = await this.authService.signUp(dto);
    this.setTokensDestination(tokens, res);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() dto: LoginDto, @Res() res: Response): Promise<void> {
    const tokens: Tokens = await this.authService.signIn(dto);
    this.setTokensDestination(tokens, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CookieUserDecorator('sub') userId: string,
    @Res() res: Response,
  ): Promise<boolean> {
    const isLoggedOut = await this.authService.logout(userId);
    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: true,
      expires: new Date(),
    });
    res.sendStatus(HttpStatus.OK);

    return isLoggedOut;
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @CookieUserDecorator('sub') userId: string,
    @CookieTokenDecorator() token: string,
    @Res() res: Response,
  ) {
    const tokens= await this.authService.refreshTokens(token, userId);
    this.setTokensDestination(tokens, res);
  }

  private setTokensDestination(tokens: Tokens, res: Response): void {
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
    res.status(HttpStatus.CREATED).json({ accessToken: tokens.accessToken });
  }
}
