
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProductItem, InventoryInfo } from "@/hooks/useInventoryData";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ChevronDown, ChevronUp, Package } from "lucide-react";

interface InventoryItemCardProps {
  product: ProductItem;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ product }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const inventory = product.inventory as InventoryInfo;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex items-center">
          <div className="w-16 h-16 mr-4 overflow-hidden rounded-md border">
            <AspectRatio ratio={1/1}>
              {product.thumbnail ? (
                <img 
                  src={product.thumbnail} 
                  alt={product.title} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <Package className="text-gray-400" />
                </div>
              )}
            </AspectRatio>
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{product.title}</CardTitle>
            <CardDescription className="text-sm">
              ID: {product.id}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Quantidade em estoque</p>
            <p className="text-lg font-semibold">{inventory.totalQuantity}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Custo médio</p>
            <p className="text-lg font-semibold">{formatCurrency(inventory.averageCost)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Valor total</p>
            <p className="text-lg font-semibold">{formatCurrency(inventory.totalValue)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Preço de venda</p>
            <p className="text-lg font-semibold">{formatCurrency(product.price || 0)}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full flex items-center justify-center"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              <span>Ocultar detalhes</span>
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              <span>Ver detalhes de compras</span>
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="mt-4 border-t pt-4">
            <h4 className="font-semibold mb-2">Histórico de compras</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantidade</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo unitário</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Custo total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {inventory.purchases.map((purchase, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{purchase.quantity} unidades</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{formatCurrency(purchase.unitCost)}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm">{formatCurrency(purchase.totalCost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
