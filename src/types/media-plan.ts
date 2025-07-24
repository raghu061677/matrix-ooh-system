
export type MediaPlan = {
  id: string;
  planId?: string;
  displayName: string;
  customer?: string;
  status: 'Draft' | 'Confirmed' | 'Cancelled' | 'Live' | 'Completed';
  startDate: string;
  endDate: string;
  // Add other fields from your description as needed
  // e.g., employeeId, sqft, displayCost, etc.
};
