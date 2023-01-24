type user = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  password: string;
  refresh_token: string | null;
  email_verified_at: Date;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

type emailVerificationCode = {
  id: number;
  user_id: number;
  code: string;
  expired_at: Date;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export {
  user,
  emailVerificationCode
};
