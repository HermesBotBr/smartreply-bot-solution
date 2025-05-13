
import { useState, useEffect } from 'react';
import axios from 'axios';
import { NGROK_BASE_URL } from '@/config/api';

export interface ProductItem {
  id: string;
  title: string;
  permalink: string;
  thumbnail: string;
  price: number;
  available_quantity: number;
  sold_quantity: number;
  listing_type_id: string;
  stop_time: string;
  condition: string;
  inventory?: InventoryInfo;
}

export interface PurchaseTransaction {
  id: number;
  seller_id: string;
  source_id: string;
  descricao: string;
  valor: string;
  parsed?: {
    quantity: number;
    productId: string;
    unitCost: number;
  };
}

export interface InventoryInfo {
  totalQuantity: number;
  purchases: Array<{
    quantity: number;
    unitCost: number;
    totalCost: number;
    date?: string;
  }>;
  averageCost: number;
  totalValue: number;
}

export interface InventorySummary {
  totalProducts: number;
  totalUnits: number;
  totalValue: number;
}

export function useInventoryData(
  sellerId: string | null,
  startDate?: Date,
  endDate?: Date
) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [transactions, setTransactions] = useState<PurchaseTransaction[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<InventorySummary>({
    totalProducts: 0,
    totalUnits: 0,
    totalValue: 0,
  });

  // Função para extrair ID do produto da descrição
  const extractProductInfo = (description: string): { quantity: number; productId: string } | null => {
    // Padrão: "Compra de mercadoria: 400x Produto Name (MLB123456789)"
    const regex = /Compra de mercadoria: (\d+)x .+\((MLB\d+)\)/;
    const match = description.match(regex);
    
    if (match && match.length >= 3) {
      return {
        quantity: parseInt(match[1], 10),
        productId: match[2]
      };
    }
    return null;
  };

  // Buscar produtos
  const fetchProducts = async () => {
    if (!sellerId) return;
    
    try {
      setIsLoadingProducts(true);
      setError(null);
      
      const response = await axios.get(`${NGROK_BASE_URL}/anuncios`, {
        params: { seller_id: sellerId }
      });
      
      setProducts(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Falha ao carregar dados de produtos');
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Buscar transações
  const fetchTransactions = async () => {
    if (!sellerId) return;
    
    try {
      setIsLoadingTransactions(true);
      setError(null);
      
      const response = await axios.get(`${NGROK_BASE_URL}/trans_desc`, {
        params: { seller_id: sellerId }
      });
      
      // Processar transações para extrair informações de compra
      const processedTransactions = Array.isArray(response.data) 
        ? response.data.map((transaction: PurchaseTransaction) => {
            if (transaction.descricao.startsWith('Compra de mercadoria:')) {
              const extractedInfo = extractProductInfo(transaction.descricao);
              if (extractedInfo) {
                const unitCost = parseFloat(transaction.valor) / extractedInfo.quantity;
                return {
                  ...transaction,
                  parsed: {
                    ...extractedInfo,
                    unitCost: parseFloat(unitCost.toFixed(2))
                  }
                };
              }
            }
            return transaction;
          })
        : [];
      
      setTransactions(processedTransactions);
    } catch (err) {
      console.error('Erro ao buscar transações:', err);
      setError('Falha ao carregar dados de transações');
      setTransactions([]);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Calcular informações de estoque quando os produtos e transações estiverem disponíveis
  useEffect(() => {
    if (!Array.isArray(products) || !Array.isArray(transactions) || products.length === 0 || transactions.length === 0) {
      setSummary({
        totalProducts: 0,
        totalUnits: 0,
        totalValue: 0
      });
      return;
    }

    const productMap = new Map<string, ProductItem>();
    let totalUnits = 0;
    let totalValue = 0;
    
    // Inicializar mapa de produtos
    products.forEach(product => {
      productMap.set(product.id, {
        ...product,
        inventory: {
          totalQuantity: 0,
          purchases: [],
          averageCost: 0,
          totalValue: 0
        }
      });
    });
    
    // Processar transações para atualizar o estoque
    const purchaseTransactions = transactions.filter(t => t.parsed);
    purchaseTransactions.forEach(transaction => {
      if (!transaction.parsed) return;
      
      const { productId, quantity, unitCost } = transaction.parsed;
      const product = productMap.get(productId);
      
      if (product && product.inventory) {
        const totalCost = quantity * unitCost;
        
        product.inventory.totalQuantity += quantity;
        product.inventory.purchases.push({
          quantity,
          unitCost,
          totalCost
        });
        
        // Recalcular custo médio
        const totalPurchases = product.inventory.purchases.reduce(
          (sum, p) => sum + p.totalCost, 0
        );
        
        product.inventory.averageCost = parseFloat(
          (totalPurchases / product.inventory.totalQuantity).toFixed(2)
        );
        
        product.inventory.totalValue = parseFloat(
          (product.inventory.totalQuantity * product.inventory.averageCost).toFixed(2)
        );
      }
    });
    
    // Atualizar os produtos com os dados de estoque
    const updatedProducts = Array.from(productMap.values());
    setProducts(updatedProducts);
    
    // Calcular resumo
    const productsWithInventory = updatedProducts.filter(p => p.inventory && p.inventory.totalQuantity > 0);
    const productCount = productsWithInventory.length;
    totalUnits = productsWithInventory.reduce((sum, p) => sum + (p.inventory?.totalQuantity || 0), 0);
    totalValue = productsWithInventory.reduce((sum, p) => sum + (p.inventory?.totalValue || 0), 0);
    
    setSummary({
      totalProducts: productCount,
      totalUnits,
      totalValue: parseFloat(totalValue.toFixed(2))
    });
    
  }, [products, transactions]);

  // Carregar dados quando o sellerId estiver disponível
  useEffect(() => {
    if (sellerId) {
      fetchProducts();
      fetchTransactions();
    }
  }, [sellerId]);

  return {
    products: Array.isArray(products) 
      ? products.filter(p => p.inventory && p.inventory.totalQuantity > 0) 
      : [],
    transactions: Array.isArray(transactions) ? transactions : [],
    isLoading: isLoadingProducts || isLoadingTransactions,
    error,
    summary,
    refetch: () => {
      fetchProducts();
      fetchTransactions();
    }
  };
}
