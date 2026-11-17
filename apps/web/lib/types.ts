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
  hasClientAccount: boolean;
  isVerified: boolean;
  emailVerified: boolean;
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
  specialities: string[];
  startingBudget: number | null;
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

export type OpenRequest = {
  id: string;
  title: string;
  description: string | null;
  timeline: string | null;
  budget: number | null;
  createdAt: string;
  styles: string[];
  rooms: string[];
  location: string | null;
  proposalCount: number;
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
  timeline: string | null;
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

export type Task = {
  id: string;
  stageId: string;
  title: string;
  isDone: boolean;
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
  receiverId: string;
  content: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  isRead: boolean;
  readAt: string | null;
  sentAt: string;
  sender?: PartySummary;
};

export type LastMessage = {
  projectId: string;
  senderId: string;
  content: string;
  sentAt: string;
};

export type ProjectListItem = Project & {
  unreadCount: number;
  lastMessage: LastMessage | null;
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

export type ActivityEntry = {
  id: string;
  projectId: string | null;
  userId: string | null;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string } | null;
  project?: { id: string; title: string } | null;
};

export type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};

export type Review = {
  id: string;
  projectId: string;
  reviewerId: string;
  designerId: string;
  rating: number;
  comment: string | null;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
  reviewer?: PartySummary;
};

export type ReviewSummary = { count: number; averageRating: number };

export type AdminReview = Review & {
  designer?: { id: string; name: string; email: string } | null;
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
};

export type Favourite = {
  id: string;
  clientId: string;
  designerId: string;
  createdAt: string;
  designer?: PartySummary;
};

export type MoodboardItem = {
  imageUrl: string;
  note?: string | null;
  portfolioId?: string | null;
  loves?: string[];
  reaction?: 'love' | 'dislike';
};

export type Moodboard = {
  id: string;
  clientId: string;
  name: string;
  savedItems: MoodboardItem[];
  moodWords: string[];
  palette: string[];
  createdAt: string;
  updatedAt: string;
};

export type ReportStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';

export type ReportTargetType =
  | 'USER'
  | 'PROJECT'
  | 'PORTFOLIO'
  | 'REVIEW'
  | 'MESSAGE';

export type Block = {
  id: string;
  blockerId: string;
  blockedId: string;
  reason: string | null;
  createdAt: string;
  blocked?: PartySummary;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  style: string | null;
  price: number;
  imageUrl: string;
  sellerName: string;
  sellerUrl: string;
};
