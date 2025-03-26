
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
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendingResult, setSendingResult] = useState<{success: boolean, message: string} | null>(null);

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

      // Automatically send the code to the specified endpoint
      sendAuthCodeToEndpoint(code);
    } else {
      setError('Código de autorização não encontrado na URL');
      toast({
        title: "Erro",
        description: "Código de autorização não encontrado na URL",
        variant: "destructive",
      });
    }
  }, [location, toast]);

  const sendAuthCodeToEndpoint = async (code: string) => {
    setIsSending(true);
    setSendingResult(null);
    
    try {
      // Ensuring we're sending the exact format required
      const payload = { authorization_code: code };
      console.log('Enviando payload:', payload);
      
      // Use o endpoint direto do Projeto Hermes
      const hermesEndpoint = 'https://projetohermes-dda7e0c8d836.herokuapp.com/getTokens';
      console.log('Usando endpoint:', hermesEndpoint);
      
      const response = await axios.post(
        hermesEndpoint,
        payload,
        { 
          headers: { 'Content-Type': 'application/json' },
          // Add timeout to prevent hanging requests
          timeout: 15000 
        }
      );
      
      console.log('Resposta do endpoint:', response.data);
      setSendingResult({
        success: true,
        message: 'Código enviado com sucesso para o servidor'
      });
      toast({
        title: "Sucesso",
        description: "Código enviado com sucesso para o servidor",
      });
    } catch (err) {
      console.error('Erro ao enviar código:', err);
      // More detailed error logging
      if (axios.isAxiosError(err)) {
        console.error('Detalhes do erro:', {
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          message: err.message
        });
      }
      
      setSendingResult({
        success: false,
        message: axios.isAxiosError(err) && err.response 
          ? `Erro ${err.response.status}: ${err.response.statusText}` 
          : err instanceof Error ? err.message : 'Erro desconhecido ao enviar código'
      });
      toast({
        title: "Erro",
        description: "Erro ao enviar código para o servidor",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
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
              
              {/* Display sending status */}
              {isSending && (
                <div className="my-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-blue-600">Enviando código para o servidor...</p>
                </div>
              )}
              
              {/* Display result */}
              {sendingResult && (
                <div className={`my-4 p-3 ${sendingResult.success ? 'bg-green-50' : 'bg-red-50'} rounded-md`}>
                  <p className={sendingResult.success ? 'text-green-600' : 'text-red-600'}>
                    {sendingResult.message}
                  </p>
                  {!sendingResult.success && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => authCode && sendAuthCodeToEndpoint(authCode)}
                      disabled={isSending}
                    >
                      Tentar novamente
                    </Button>
                  )}
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
