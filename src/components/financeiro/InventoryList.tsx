
import React, { useState } from 'react';
import { ProductItem, InventorySummary } from "@/hooks/useInventoryData";
import { InventoryItemCard } from "./InventoryItemCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InventoryListProps {
  products: ProductItem[];
  isLoading: boolean;
  summary: InventorySummary;
}

export const InventoryList: React.FC<InventoryListProps> = ({ products, isLoading, summary }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    product.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando dados do estoque...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground">
              Produtos em estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalProducts}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground">
              Total de unidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.totalUnits}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm text-muted-foreground">
              Valor total do estoque
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Pesquisar produtos por nome ou ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="space-y-4">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-8">
            {searchTerm ? "Nenhum produto encontrado para esta pesquisa." : "Nenhum produto em estoque."}
          </div>
        ) : (
          filteredProducts.map(product => (
            <InventoryItemCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};
