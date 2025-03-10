
import { useState, useEffect } from 'react';

export function useMlToken() {
  const [mlToken, setMlToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch('https://b4c027be31fe.ngrok.app/mercadoLivreApiKey.txt');
        const tokenText = await response.text();
        setMlToken(tokenText.trim());
      } catch (error) {
        console.error("Erro ao buscar token:", error);
      }
    };
    fetchToken();
  }, []);

  return mlToken;
}
