type user = {
  id: number;
  name: string;
  username: string | null;
  email: string;
  password: string;
  refresh_token: string | null;
  email_verified_at: Date;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

enum gender { 
  MAN,
  WOMAN
}

type profile = {
  id: number;
  user_id: number;
  profile_picture: string | null;
  gender: gender;
  date_of_birth: Date;
  age: number;
  bio: string | null;
  location: string | null;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type emailVerificationCode = {
  id: number;
  user_id: number;
  code: string;
  expired_at: Date;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type resetPasswordVerificationCode = {
  id: number;
  user_id: number;
  code: string;
  expired_at: Date;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export {
  user,
  emailVerificationCode,
  resetPasswordVerificationCode,
  profile
};
