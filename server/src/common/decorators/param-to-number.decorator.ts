import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const ParamToNumberDecorator = createParamDecorator(
  (key: string, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();

    return parseInt(request.params[key]);
  },
);
