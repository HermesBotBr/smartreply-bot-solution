
import { useState, useEffect } from 'react';

const GPT_URL = 'https://b4c027be31fe.ngrok.app/all_gpt.txt';

export function useGptIds() {
  const [gptIds, setGptIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchGptIds = async () => {
      try {
        const response = await fetch(GPT_URL);
        const text = await response.text();
        const ids = text.split('\n').map(line => line.trim()).filter(line => line);
        setGptIds(ids);
      } catch (error) {
        console.error("Erro ao buscar GPT IDs:", error);
      }
    };
    fetchGptIds();
    const interval = setInterval(fetchGptIds, 10000);
    return () => clearInterval(interval);
  }, []);

  return gptIds;
}
