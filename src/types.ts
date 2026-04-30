export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  thumbnail: string;
  durationDays: number;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: { title: string; content: string; videoUrl?: string; day?: number }[];
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
  dateEnrolled: string;
  dateCompleted?: string;
  currentDay: number;
}

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  issueDate: string;
  certificateNumber: string;
}

export interface SavingsTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'deposit' | 'withdrawal' | 'loan_repayment';
  timestamp: string;
  description: string;
}

export interface LoanRequest {
  id: string;
  userId: string;
  amount: number;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  certificateId?: string;
  phoneNumber: string;
  idFrontImageUrl: string;
  idBackImageUrl: string;
  securityDetails?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'student' | 'admin';
  savingsBalance: number;
  phoneNumber?: string;
  idVerified?: boolean;
  createdAt: string;
}
