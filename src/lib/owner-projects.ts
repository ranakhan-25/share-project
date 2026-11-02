export type OwnerProjectStatus =
  | "draft"
  | "pending"
  | "approved"
  | "rejected"
  | "published";

export type SubmissionHistoryItem = {
  status: OwnerProjectStatus;
  note: string;
  date: string;
};

export type OwnerProject = {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  thumbnail: string;
  gallery: string[];
  documents: string[];
  totalInvestmentAmount: number;
  totalShares: number;
  pricePerShare: number;
  minimumInvestment: number;
  expectedAnnualReturn: number;
  startDate: string;
  endDate: string;
  status: OwnerProjectStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  submissionHistory: SubmissionHistoryItem[];
};

export function statusLabel(status: OwnerProjectStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
