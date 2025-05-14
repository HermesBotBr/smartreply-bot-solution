
import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { getNgrokUrl } from '@/config/api';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { toast } from '@/hooks/use-toast';

interface Product {
  mlb: string;
  title: string;
  image: string;
  active: boolean;
}

interface ProductListingPopupProps {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  onSelectProduct: (product: Product, quantity: number) => void;
}

export const ProductListingPopup: React.FC<ProductListingPopupProps> = ({
  open,
  onClose,
  sellerId,
  onSelectProduct
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  
  useEffect(() => {
    if (open) {
      fetchProducts();
    } else {
      // Reset state when popup closes
      setSelectedProduct(null);
      setQuantity(1);
      setSearchTerm('');
    }
  }, [open, sellerId]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${getNgrokUrl('/anuncios')}`, {
        params: {
          seller_id: sellerId
        }
      });
      
      if (response.data && response.data.items) {
        setProducts(response.data.items);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os anúncios.",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  const handleSelectProduct = () => {
    if (!selectedProduct) return;
    
    onSelectProduct(selectedProduct, quantity);
    onClose();
  };

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Selecionar Produto</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Input
            placeholder="Buscar por nome do produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.mlb}
                    className={`border rounded-md p-3 cursor-pointer transition-all ${
                      selectedProduct?.mlb === product.mlb 
                        ? 'border-primary bg-primary/10' 
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="mb-2 w-full">
                      <AspectRatio ratio={1/1} className="bg-muted">
                        <img 
                          src={product.image} 
                          alt={product.title} 
                          className="object-cover w-full h-full rounded-md"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      </AspectRatio>
                    </div>
                    <h3 className="text-sm font-medium line-clamp-2 h-10">{product.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.mlb}
                      {product.active === false && (
                        <span className="ml-2 text-amber-600">(Inativo)</span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado.
                </p>
              )}

              {selectedProduct && (
                <div className="border rounded-md p-4 mt-4 bg-muted/30">
                  <h4 className="font-medium mb-2">Produto selecionado: {selectedProduct.title}</h4>
                  <div className="flex items-center">
                    <label className="mr-2 text-sm">Quantidade:</label>
                    <Input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      className="w-24"
                    />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogClose>
          <Button 
            disabled={!selectedProduct || isLoading} 
            onClick={handleSelectProduct}
          >
            Selecionar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
