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

export type PortfolioDesigner = {
  id: string;
  name: string;
  avatarUrl: string | null;
  location: string | null;
  isVerified: boolean;
};

export type PortfolioImage = {
  id: string;
  portfolioId: string;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
  createdAt: string;
};

export type Portfolio = {
  id: string;
  designerId: string;
  title: string;
  description: string | null;
  style: string;
  roomType: string;
  budget: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  designer: PortfolioDesigner;
  images: PortfolioImage[];
};

export type PortfolioListPage = {
  items: Portfolio[];
  page: number;
  pageSize: number;
  total: number;
};

export type FavouriteDesigner = {
  id: string;
  name: string;
  avatarUrl: string | null;
  location: string | null;
  bio: string | null;
  isVerified: boolean;
  isAvailable: boolean;
};

export type Favourite = {
  id: string;
  clientId: string;
  designerId: string;
  createdAt: string;
  designer: FavouriteDesigner;
};

export type MoodboardItem = {
  imageUrl: string;
  note?: string;
  portfolioId?: string;
};

export type Moodboard = {
  id: string;
  clientId: string;
  name: string;
  savedItems: MoodboardItem[];
  createdAt: string;
  updatedAt: string;
  briefCount?: number;
};

export type Brief = {
  id: string;
  clientId: string;
  moodboardId: string | null;
  styles: string[];
  rooms: string[];
  budgetRange: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  moodboard: { id: string; name: string } | null;
};

export type MatchResult = {
  designer: {
    id: string;
    name: string;
    avatarUrl: string | null;
    location: string | null;
    isVerified: boolean;
    isAvailable: boolean;
    bio: string | null;
  };
  score: number;
  breakdown: { style: number; room: number; budget: number };
  matchedPortfolios: {
    id: string;
    title: string;
    style: string;
    roomType: string;
  }[];
};
