interface LoginDto {
  email: string;
  password: string;
}

interface SignupDto extends LoginDto {
  userName?: string;
}

export { LoginDto, SignupDto };
