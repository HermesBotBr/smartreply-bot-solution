
import { useState, useEffect } from 'react';
import { useAccessToken } from './useAccessToken';

export function useMlToken(sellerId: string | null = null) {
  const [mlToken, setMlToken] = useState<string | null>(null);
  const { accessToken } = useAccessToken(sellerId);

  // Update mlToken when accessToken changes
  useEffect(() => {
    if (accessToken) {
      setMlToken(accessToken);
    } else {
      setMlToken(null);
    }
  }, [accessToken]);

  return mlToken;
}
