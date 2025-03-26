
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send } from "lucide-react";
import { useToast } from '@/hooks/use-toast';

const TokenRequest = () => {
  const [authCode, setAuthCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authCode.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um código de autorização",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const response = await axios.post(
        'https://projetohermes-dda7e0c8d836.herokuapp.com/getTokens',
        { authorization_code: authCode },
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

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Requisição de Token</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="authCode">Código de Autorização</Label>
              <Input
                id="authCode"
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Insira o código de autorização"
                disabled={isLoading}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  Enviando...
                </span>
              ) : (
                <span className="flex items-center">
                  Enviar <Send className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

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

export default TokenRequest;
