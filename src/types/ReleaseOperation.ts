
export interface ReleaseOperation {
  orderId?: string;
  itemId?: string;
  title?: string;
  amount: number;
  description?: string;
  sourceId?: string; // For grouping operations
  date?: string;     // Date field for filtering
}
