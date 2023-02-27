interface User {
  id: number;
  name: string | null;
  username: string;
  email: string;
  password: string;
  refresh_token: string | null;
  email_verified_at: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Profile {
  id: number;
  user_id: number;
  profile_picture: string | null;
  gender: 'MAN' | 'WOMAN';
  date_of_birth: Date;
  age: number;
  bio: string | null;
  location: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ProfileMedia {
  id: number;
  profile_id: number;
  file_name: string | null;
  file_mime_type: string | null;
  context: 'PROFILE_IMAGE' | 'COVER_IMAGE';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface EmailVerificationCode {
  id: number;
  user_id: number;
  code: string;
  expired_at: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ResetPasswordVerificationCode {
  id: number;
  user_id: number;
  code: string;
  expired_at: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface HasFollower {
  id: number;
  followed_user_id: number;
  follower_user_id: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface Post {
  id: number;
  user_id: number;
  code: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface postMedia {
  id: number;
  user_id: number;
  file_mime_type: string;
  file_name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface ProfileWithMedia extends Profile {
  profile_media: ProfileMedia[]
}

interface AccountSetting {
  id: number;
  account_visibility: 'PUBLIC' | 'PRIVATE';
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

interface UserDetail extends User {
  profile: ProfileWithMedia;
  followers: User[];
  following: User[];
  account_setting: AccountSetting;
}

export {
  User,
  EmailVerificationCode,
  ResetPasswordVerificationCode,
  Profile,
  ProfileMedia,
  HasFollower,
  Post,
  postMedia,
  UserDetail
};

