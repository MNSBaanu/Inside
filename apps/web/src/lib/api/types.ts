export type Role = 'CLIENT' | 'DESIGNER' | 'ADMIN';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  activeRole: Role;
  isVerified: boolean;
  status: string;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  location: string | null;
  isAvailable: boolean;
  createdAt: string;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
};

export type ApiFailure = {
  success: false;
  error: {
    statusCode: number;
    message: string | string[];
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};
