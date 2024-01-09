import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CookieTokenDecorator = createParamDecorator(
  (_: undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();

    return request.cookies['refreshToken'];
  }
)