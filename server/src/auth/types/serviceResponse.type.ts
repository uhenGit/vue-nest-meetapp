import { Tokens } from './tokens.type';

export type ServiceResponse = {
  tokens: Tokens;
  userId: string;
  userEmail: string;
};
