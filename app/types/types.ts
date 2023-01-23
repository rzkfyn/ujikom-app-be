type emailVerificationCode = {
  user_id: number;
  code: string;
  expired_at: Date;
  deleted_at: Date | null;
};

export {
  emailVerificationCode
};
