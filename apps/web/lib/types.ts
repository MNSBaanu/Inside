export type Role = 'CLIENT' | 'DESIGNER' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED';
export type RequestType = 'DIRECT' | 'OPEN';
export type RequestStatus =
  | 'OPEN'
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED';
export type ProposalStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';
export type ProjectStatus =
  | 'ACTIVE'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';
export type StageName =
  | 'PROPOSAL'
  | 'CONCEPT'
  | 'DESIGN'
  | 'REVISION'
  | 'COMPLETION';
export type StageStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'REJECTED';
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'RELEASED'
  | 'FAILED'
  | 'REFUNDED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  activeRole: Role;
  isVerified: boolean;
  status: AccountStatus;
  bio: string | null;
  avatarUrl: string | null;
  phone: string | null;
  location: string | null;
  isAvailable: boolean;
  createdAt: string;
};

export type AuthPayload = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type PortfolioImage = {
  id: string;
  portfolioId: string;
  imageUrl: string;
  caption: string | null;
  displayOrder: number;
  createdAt: string;
};

export type PortfolioDesigner = Pick<
  User,
  'id' | 'name' | 'avatarUrl' | 'location' | 'isVerified'
>;

export type Portfolio = {
  id: string;
  designerId: string;
  title: string;
  description: string | null;
  style: string | null;
  roomType: string | null;
  budget: number | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  designer: PortfolioDesigner;
  images: PortfolioImage[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

export type Brief = {
  id: string;
  clientId: string;
  title: string;
  description: string | null;
  roomType: string | null;
  style: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  timeline: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DesignRequest = {
  id: string;
  clientId: string;
  designerId: string | null;
  briefId: string | null;
  type: RequestType;
  status: RequestStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Proposal = {
  id: string;
  requestId: string;
  designerId: string;
  status: ProposalStatus;
  coverLetter: string | null;
  price: number | null;
  timelineWeeks: number | null;
  createdAt: string;
  updatedAt: string;
};

export type Project = {
  id: string;
  clientId: string;
  designerId: string;
  proposalId: string | null;
  title: string;
  status: ProjectStatus;
  budget: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Stage = {
  id: string;
  projectId: string;
  name: StageName;
  status: StageStatus;
  order: number;
  amount: number | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

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

export type Message = {
  id: string;
  projectId: string;
  senderId: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  readAt: string | null;
  createdAt: string;
};
