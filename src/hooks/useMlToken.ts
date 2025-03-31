
import { useState, useEffect } from 'react';
import { useAccessToken } from './useAccessToken';

export function useMlToken(sellerId: string | null = null) {
  const [mlToken, setMlToken] = useState<string | null>(null);
  const { accessToken } = useAccessToken(sellerId);

  // Quando o accessToken mudar, atualize o mlToken
  useEffect(() => {
    if (accessToken) {
      setMlToken(accessToken);
    } else {
      setMlToken(null);
    }
  }, [accessToken]);

  return mlToken;
}
