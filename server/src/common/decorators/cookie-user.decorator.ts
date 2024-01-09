import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

const configService = new ConfigService();
const jwt = new JwtService();

export const CookieUserDecorator = createParamDecorator(
  (key: string | undefined, context: ExecutionContext): string | object => {
    const request = context.switchToHttp().getRequest();
    const cookieToken = request.cookies['refreshToken'];

    if (!cookieToken) {
      return null;
    }

    const decodedToken = jwt.verify(cookieToken, {
      secret: configService.get('REFRESH_TOKEN_SECRET'),
    });

    if (!key) {
      return decodedToken;
    }

    return decodedToken[key];
  },
);
