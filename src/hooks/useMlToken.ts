
import { useState, useEffect } from 'react';
import { getNgrokUrl } from '@/config/api';

export function useMlToken() {
  const [mlToken, setMlToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(getNgrokUrl('mercadoLivreApiKey.txt'));
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
