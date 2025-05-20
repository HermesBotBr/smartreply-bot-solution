
export interface ReleaseOperation {
  orderId?: string;
  sourceId?: string;
  itemId?: string;
  title?: string;
  description?: string;
  amount: number;
  date?: string;
  group?: string; // Added group property
}
