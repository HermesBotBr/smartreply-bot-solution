
export interface ReleaseOperation {
  orderId?: string;
  itemId?: string;
  title?: string;
  amount: number;
  description?: string;
  sourceId?: string; // Added sourceId for grouping operations
  date?: string;     // Added date field
  group?: string;    // Added group field for categorization
}
