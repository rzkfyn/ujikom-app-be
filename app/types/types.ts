type user = {
  id: number;
  name: string | null;
  username: string;
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

type profileMedia = {
  id: number;
  profile_id: number;
  file_name: string | null;
  file_mime_type: string | null;
  context: 'PROFILE_IMAGE' | 'COVER_IMAGE';
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

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

type hasFollower = {
  id: number;
  followed_user_id: number;
  follower_user_id: number;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type post = {
  id: number;
  user_id: number;
  code: string;
  text: string;
  deleted_at: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type {
  user,
  emailVerificationCode,
  resetPasswordVerificationCode,
  profile,
  profileMedia,
  hasFollower,
  post
};
