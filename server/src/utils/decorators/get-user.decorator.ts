import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { jwtPayload } from '../../auth/types/jwtPayload.type';

export const GetUserDecorator = createParamDecorator(
  (data: keyof jwtPayload | undefined, context: ExecutionContext): object => {
    const request = context.switchToHttp().getRequest();

    if (!data) {
      return request.user[data];
    }

    return request.user;
  },
);
