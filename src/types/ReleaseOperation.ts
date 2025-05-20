
export interface ReleaseOperation {
  orderId?: string;
  itemId?: string;
  title?: string;
  amount: number;
  description?: string;
  sourceId?: string;
  date?: string;
  group?: string;  // Added group property for categorization
}
