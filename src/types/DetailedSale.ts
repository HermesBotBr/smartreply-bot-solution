

export interface DetailedSale {
  orderId: string;
  itemId: string;
  title?: string;
  quantity: number;
  dateCreated: string;
  totalCost?: number;  // Added missing property
  profit?: number;     // Added missing property
}

