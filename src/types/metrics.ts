
export interface SellerReputation {
  level_id: string;
  power_seller_status: string | null;
  transactions: {
    canceled: number;
    completed: number;
    period: string;
    ratings: {
      negative: number;
      neutral: number;
      positive: number;
    };
    total: number;
  };
  metrics: {
    sales: {
      period: string;
      completed: number;
    };
    claims: {
      period: string;
      rate: number;
      value: number;
    };
    delayed_handling_time: any;
    cancellations: any;
  };
}

export interface ReputationResponse {
  bill_data: {
    accept_credit_note: string;
  };
  seller_reputation: SellerReputation;
}

export interface SalesOrder {
  order_id: number;
  pack_id: string | null;
  date_created: string;
}

export interface SalesItem {
  item: {
    id: string;
    title: string;
    category_id: string;
    variation_id: number;
    seller_custom_field: string | null;
    global_price: string | null;
    net_weight: string | null;
    variation_attributes: Array<{
      name: string;
      id: string;
      value_id: string;
      value_name: string;
    }>;
    warranty: string;
    condition: string;
    seller_sku: string;
  };
  total_sales: number;
  orders: SalesOrder[];
}

export interface SalesResponse {
  sales: SalesItem[];
}

export interface Complaint {
  order_id: number;
  claim_count: number;
  claim_ids: number[];
}

export interface ComplaintsResponse {
  complaints: Complaint[];
}

export interface TagsResponse {
  rows: {
    [key: string]: string | null;
    entry_id: number;
  }[];
}

export interface FilteredTag {
  orderId: string;
  tags: string[];
}
