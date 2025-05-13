
export interface TransDesc {
  id: number;
  seller_id: string;
  source_id: string;
  descricao: string;
  valor: string;
  date?: string; // Adding date field
}

export interface InventoryItem {
  itemId: string;
  title: string;
  totalQuantity: number;
  purchases: {
    quantity: number;
    unitCost: number;
    totalCost: number;
    sourceId: string;
    date?: string; // Adding date field for purchases
  }[];
}

export interface InventoryData {
  items: InventoryItem[];
  isLoading: boolean;
  error: Error | null;
}
