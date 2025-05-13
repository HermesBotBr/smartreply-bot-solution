
export interface ProductListing {
  mlb: string;
  title: string;
  image: string;
  active: boolean;
}

export interface TransactionDescription {
  id: number;
  seller_id: string;
  source_id: string;
  descricao: string;
  valor: string;
}

export interface ProductStock {
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface ProductInventory {
  product: ProductListing;
  stockBatches: ProductStock[];
  totalQuantity: number;
  averageCost: number;
  totalValue: number;
}
