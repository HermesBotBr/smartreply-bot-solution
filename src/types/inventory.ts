
export interface TransDesc {
  id: number;
  seller_id: string;
  source_id: string;
  descricao: string;
  valor: string;
}

export interface InventoryItem {
  itemId: string;
  title: string;
  totalQuantity: number;
  averagePurchasePrice?: number;  // Added missing property
  purchases: {
    quantity: number;
    unitCost: number;
    totalCost: number;
    sourceId: string;
    date?: string;  // Added date field for each purchase
  }[];
}

export interface InventoryData {
  items: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
}
