
import { useState, useEffect } from 'react';
import axios from 'axios';
import { ProductListing, TransactionDescription, ProductInventory, ProductStock } from '@/types/Inventory';

export function useInventoryData(sellerId: string | null) {
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sellerId) return;
    
    const fetchInventoryData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch products listings
        const productsResponse = await axios.get<{items: ProductListing[]}>(
          `https://projetohermes-dda7e0c8d836.herokuapp.com/anuncios?seller_id=${sellerId}`
        );
        
        // Fetch transaction descriptions
        const transactionsResponse = await axios.get<TransactionDescription[]>(
          `https://projetohermes-dda7e0c8d836.herokuapp.com/trans_desc?seller_id=${sellerId}`
        );
        
        // Process the data to build inventory
        const inventoryData = processInventoryData(productsResponse.data.items, transactionsResponse.data);
        
        setInventory(inventoryData);
      } catch (err) {
        console.error('Error fetching inventory data:', err);
        setError('Falha ao carregar dados de estoque');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInventoryData();
  }, [sellerId]);

  // Process the product listings and transaction descriptions to calculate inventory
  const processInventoryData = (products: ProductListing[], transactions: TransactionDescription[]): ProductInventory[] => {
    // Create a map to store product inventory info
    const inventoryMap = new Map<string, ProductInventory>();
    
    // Initialize inventory map with products
    products.forEach(product => {
      inventoryMap.set(product.mlb, {
        product,
        stockBatches: [],
        totalQuantity: 0,
        averageCost: 0,
        totalValue: 0
      });
    });
    
    // Process transaction descriptions to find product purchases
    transactions.forEach(transaction => {
      const { descricao, valor } = transaction;
      
      // Check if this is a product purchase transaction
      if (descricao.startsWith('Compra de mercadoria:')) {
        // Extract quantity and MLB from the description
        // Format: "Compra de mercadoria: {quantity}x Product Title (MLB123456789)"
        const match = descricao.match(/Compra de mercadoria: (\d+)x .+\(MLB\d+\)/);
        const mlbMatch = descricao.match(/\(([^)]+)\)/);
        
        if (match && mlbMatch) {
          const quantity = parseInt(match[1], 10);
          const mlb = mlbMatch[1];
          const totalCost = parseFloat(valor);
          const unitCost = totalCost / quantity;
          
          // Update the inventory if the product exists
          if (inventoryMap.has(mlb)) {
            const productInventory = inventoryMap.get(mlb)!;
            
            // Add a new stock batch
            productInventory.stockBatches.push({
              quantity,
              unitCost,
              totalCost
            });
            
            // Update totals
            productInventory.totalQuantity += quantity;
            productInventory.totalValue += totalCost;
            
            // Recalculate average cost
            if (productInventory.totalQuantity > 0) {
              productInventory.averageCost = productInventory.totalValue / productInventory.totalQuantity;
            }
            
            inventoryMap.set(mlb, productInventory);
          }
        }
      }
    });
    
    // Convert the map values to an array and sort by product title
    return Array.from(inventoryMap.values())
      .sort((a, b) => a.product.title.localeCompare(b.product.title));
  };

  return { inventory, isLoading, error };
}
