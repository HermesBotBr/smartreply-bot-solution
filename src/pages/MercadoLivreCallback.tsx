
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { getNgrokUrl } from '@/config/api';

const MercadoLivreCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [authCode, setAuthCode] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Extract the authorization code from URL parameters
    const params = new URLSearchParams(location.search);
    const code = params.get('code');
    
    if (code) {
      setAuthCode(code);
      exchangeCodeForToken(code);
    } else {
      setError('Código de autorização não encontrado na URL');
    }
  }, [location]);

  const exchangeCodeForToken = async (code: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Exchange the authorization code for tokens
      // Using a proxy endpoint to avoid exposing client_secret in frontend
      const response = await fetch(getNgrokUrl('/exchange-token'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          redirect_uri: window.location.origin + '/ml-callback' // Should match the redirect_uri in the authorization request
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Erro ao trocar código por token');
      }

      const data = await response.json();
      setRefreshToken(data.refresh_token);
      setAccessToken(data.access_token);
      
      toast({
        title: "Sucesso",
        description: "Autorização concluída com sucesso",
      });
    } catch (error) {
      console.error("Erro ao trocar código por token:", error);
      setError(error instanceof Error ? error.message : 'Erro ao trocar código por token');
      
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao trocar código por token",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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
          {loading ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
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
                </div>
              )}
              
              {refreshToken && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Refresh Token:</h3>
                  <div className="flex">
                    <div className="flex-1 bg-gray-100 p-3 rounded-l-md overflow-x-auto">
                      <code className="text-sm">{refreshToken}</code>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-l-none" 
                      onClick={() => copyToClipboard(refreshToken, 'Refresh Token')}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Guarde este refresh token em um local seguro. Ele permite que sua aplicação solicite novos access tokens.
                  </p>
                </div>
              )}
              
              {accessToken && (
                <div className="mb-6">
                  <h3 className="font-medium mb-2">Access Token:</h3>
                  <div className="flex">
                    <div className="flex-1 bg-gray-100 p-3 rounded-l-md overflow-x-auto">
                      <code className="text-sm">{accessToken}</code>
                    </div>
                    <Button 
                      variant="outline" 
                      className="rounded-l-none" 
                      onClick={() => copyToClipboard(accessToken, 'Access Token')}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Este token expira em algumas horas. Use o refresh token para obter um novo quando necessário.
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
