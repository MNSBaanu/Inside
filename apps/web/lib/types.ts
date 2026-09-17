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

export type Rating = { average: number | null; count: number };

export type DesignerPreview = {
  id: string;
  title: string;
  style: string | null;
  imageUrl: string | null;
};

export type DesignerSummary = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  portfolioCount: number;
  previews: DesignerPreview[];
  rating: Rating;
};

export type DesignerProfile = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  isVerified: boolean;
  isAvailable: boolean;
  createdAt: string;
  rating: Rating;
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
  moodboardId: string | null;
  styles: string[];
  rooms: string[];
  budgetRange: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PartySummary = Pick<User, 'id' | 'name' | 'avatarUrl'> & {
  isVerified?: boolean;
  location?: string | null;
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
  client?: PartySummary;
  designer?: PartySummary | null;
};

export type StageFee = { name: StageName; fee: number };

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
  designer?: PartySummary;
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
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  client?: PartySummary;
  designer?: PartySummary;
};

export type ProjectStage = {
  id: string;
  projectId: string;
  stageOrder: number;
  name: StageName;
  status: StageStatus;
  fee: number | null;
  dueDate: string | null;
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
  content: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  readAt: string | null;
  createdAt: string;
  sender?: PartySummary;
};

export type Deliverable = {
  id: string;
  stageId: string;
  fileUrl: string;
  fileName: string | null;
  notes: string | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
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
