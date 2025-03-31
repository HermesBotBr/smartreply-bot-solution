
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';

const MercadoLivreCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
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

      // Automatically send the authorization code to the endpoint
      handleSubmit(code);
    } else {
      setError('Código de autorização não encontrado na URL');
      toast({
        title: "Erro",
        description: "Código de autorização não encontrado na URL",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const handleSubmit = async (code: string) => {
    if (!code.trim()) {
      toast({
        title: "Erro",
        description: "Código de autorização inválido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const response = await axios.post(
        'https://2b25e62d2f97.ngrok.app/getTokens',
        { authorization_code: code },
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      setResponse(response.data);
      toast({
        title: "Sucesso",
        description: "Requisição enviada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      
      toast({
        title: "Erro",
        description: axios.isAxiosError(error) 
          ? `Erro: ${error.response?.status || ''} ${error.response?.statusText || error.message}` 
          : 'Erro ao enviar requisição',
        variant: "destructive",
      });
      
      if (axios.isAxiosError(error) && error.response) {
        setResponse(error.response.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copiado",
        description: "Código copiado para área de transferência",
      });
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Autorização Mercado Livre</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="bg-red-50 p-4 rounded-md mb-4 text-red-600">
              <p>{error}</p>
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
                      onClick={() => authCode && copyToClipboard(authCode)}
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              )}
              
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <p>Enviando...</p>
                </div>
              )}
              
              {response && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Resposta:</h3>
                  <div className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(response, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </>
          )}
          
          <div className="mt-6 flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
            >
              Voltar ao início
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MercadoLivreCallback;
