
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

const MercadoLivreCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract the authorization code from URL parameters
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    
    if (code) {
      setAuthCode(code);
      toast({
        title: "Código encontrado",
        description: "Código de autorização foi extraído com sucesso da URL",
      });
    } else {
      setError('Código de autorização não encontrado na URL');
      toast({
        title: "Erro",
        description: "Código de autorização não encontrado na URL",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado",
        description: `${type} copiado para área de transferência`,
      });
    });
  };

  const goToHome = () => {
    navigate('/');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Autorização Mercado Livre</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="bg-red-50 p-4 rounded-md mb-4">
              <p className="text-red-600">{error}</p>
              <Button onClick={goToHome} className="mt-4">Voltar ao início</Button>
            </div>
          ) : (
            <>
              {authCode && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Código de autorização:</h3>
                  <div className="flex">
                    <div className="flex-1 bg-gray-100 p-3 rounded-l-md overflow-x-auto">
                      <code className="text-sm">{authCode}</code>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-l-none" 
                      onClick={() => copyToClipboard(authCode, 'Código de autorização')}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Este é o código de autorização que você pode usar para obter o refresh token e o access token manualmente.
                  </p>
                </div>
              )}
              
              <div className="mt-6 flex justify-center">
                <Button onClick={goToHome}>Voltar ao início</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoLivreCallback;
