export type RequestStatus = 'Pending' | 'In Work' | 'Accepted' | 'Rejected' | 'Approved' | 'Completed' | 'Closed' | 'Overdue';

export interface RequestDoc {
  _id?: string;
  project: string;
  requester: string;
  site: string;
  requestType: string;
  requestDate: string; // ISO date
  dueDate: string; // ISO date
  status: RequestStatus;
  approvedDate?: string;
  approvedBy?: string;
  acceptedBy?: string;
  delegatedTo?: string;
  delegatedCompleted?: string;
  managerFeedback?: string;
  meta: {
    documentNo?: string;
    creationDate?: string;
    createdBy?: string;
    lastUpdate?: string;
    revNo?: string;
  };
  authority?: { displayLocation?: string; location?: string; }; // Simplified for now
  tasks?: Array<{ assignee: string; task: string; start?: string; end?: string; estHours?: string; remarks?: string; }>
  createdAt?: string;
}
