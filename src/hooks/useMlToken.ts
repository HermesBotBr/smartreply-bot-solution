
import { useState, useEffect } from 'react';
import { useAccessToken } from './useAccessToken';

// Update the MlTokenType to include all possible shapes
export type MlTokenType = string | { seller_id: string } | { id: string } | null;

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
