
import { useState, useEffect } from 'react';
import { useAccessToken } from './useAccessToken';

export type MlTokenType = string | { seller_id: string } | null;

export function useMlToken(sellerId: string | null = null): MlTokenType {
  const [mlToken, setMlToken] = useState<MlTokenType>(null);
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
