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

export type RequestType = 'DIRECT' | 'OPEN';

export type RequestStatus =
  | 'OPEN'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED';

export type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';

export type StageName =
  | 'PROPOSAL'
  | 'CONCEPT'
  | 'DESIGN'
  | 'REVISION'
  | 'COMPLETION';

export type RequestParty = {
  id: string;
  name: string;
  avatarUrl: string | null;
  isVerified?: boolean;
  isAvailable?: boolean;
};

export type ProjectRequest = {
  id: string;
  clientId: string;
  designerId: string | null;
  briefId: string | null;
  title: string;
  description: string | null;
  type: RequestType;
  status: RequestStatus;
  budget: number | null;
  createdAt: string;
  updatedAt: string;
  brief: { id: string; styles: string[]; rooms: string[] } | null;
  designer: RequestParty | null;
  client: RequestParty | null;
  proposalCount: number;
};

export type StageFee = {
  name: StageName;
  fee: number;
};

export type Proposal = {
  id: string;
  requestId: string;
  designerId: string;
  scope: string;
  timeline: string;
  stageFees: StageFee[];
  totalAmount: number | null;
  status: ProposalStatus;
  submittedAt: string;
  updatedAt: string;
  designer: RequestParty | null;
};

export type StageStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type ProjectStage = {
  id: string;
  projectId?: string;
  stageOrder: number;
  name: StageName;
  status: StageStatus;
  fee: number | null;
  dueDate: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
};

export type Project = {
  id: string;
  proposalId: string;
  clientId: string;
  designerId: string;
  title: string;
  currentStage: StageName;
  status: ProjectStatus;
  startedAt: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  stages: ProjectStage[];
  client?: RequestParty | null;
  designer?: RequestParty | null;
};

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'RELEASED'
  | 'FAILED'
  | 'REFUNDED';

export type MilestonePayment = {
  id: string;
  projectId: string;
  stageId: string;
  amount: number | null;
  status: PaymentStatus;
  stripeIntentId: string | null;
  paidAt: string | null;
  releasedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Deliverable = {
  id: string;
  stageId: string;
  version: number;
  fileUrl: string;
  fileName: string | null;
  notes: string | null;
  feedback: string | null;
  uploadedAt: string;
  updatedAt: string;
};

export type AccountStatus = 'ACTIVE' | 'SUSPENDED';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type ReportTargetType =
  | 'USER'
  | 'PROJECT'
  | 'PORTFOLIO'
  | 'REVIEW'
  | 'MESSAGE';

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  activeRole: Role;
  isVerified: boolean;
  status: AccountStatus;
  createdAt: string;
};

export type Verification = {
  id: string;
  designerId: string;
  status: VerificationStatus;
  evidenceUrl: string;
  notes: string | null;
  reviewedById: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  designer: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    isVerified: boolean;
  } | null;
};

export type ReportPerson = {
  id: string;
  name: string;
  email: string;
};

export type Report = {
  id: string;
  reporterId: string;
  reportedUserId: string | null;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolvedById: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  reporter: ReportPerson | null;
  reportedUser: ReportPerson | null;
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
