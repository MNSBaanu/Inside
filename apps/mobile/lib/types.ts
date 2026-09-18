// Subset of the API response shapes used by the mobile app (see apps/web/lib/types.ts).
export type Role = 'CLIENT' | 'DESIGNER' | 'ADMIN';

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

export type ProjectStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'RELEASED'
  | 'FAILED'
  | 'REFUNDED';

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  activeRole: Role;
  isVerified: boolean;
  emailVerified: boolean;
  avatarUrl: string | null;
};

export type AuthPayload = {
  user: User;
  accessToken: string;
  refreshToken: string;
};

export type PartySummary = { id: string; name: string; avatarUrl: string | null };

export type Project = {
  id: string;
  clientId: string;
  designerId: string;
  title: string;
  currentStage: StageName;
  status: ProjectStatus;
  startedAt: string | null;
  completedAt: string | null;
  client?: PartySummary;
  designer?: PartySummary;
};

export type ProjectListItem = Project & {
  unreadCount: number;
  lastMessage: { senderId: string; content: string; sentAt: string } | null;
};

export type ProjectStage = {
  id: string;
  projectId: string;
  stageOrder: number;
  name: StageName;
  status: StageStatus;
  fee: number | null;
  dueDate: string | null;
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
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  attachmentUrl: string | null;
  attachmentType: string | null;
  isRead: boolean;
  sentAt: string;
};

export type MilestonePayment = {
  id: string;
  stageId: string;
  amount: number | null;
  status: PaymentStatus;
  paidAt: string | null;
  releasedAt: string | null;
};

export type Notification = {
  id: string;
  title: string;
  message: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ActivityEntry = {
  id: string;
  action: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user: { id: string; name: string } | null;
};
