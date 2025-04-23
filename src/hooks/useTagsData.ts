
import { useState, useEffect } from 'react';
import axios from 'axios';
import { TagsResponse, FilteredTag } from '@/types/metrics';
import { NGROK_BASE_URL } from '@/config/api';

export function useTagsData(sellerId: string | null) {
  const [tagsData, setTagsData] = useState<TagsResponse | null>(null);
  const [filteredTags, setFilteredTags] = useState<FilteredTag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sellerId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get(`${NGROK_BASE_URL}/api/db/rows/all_tags`);
        setTagsData(response.data);
        
        // Process tags data to filter by seller ID and extract tags
        if (response.data?.rows) {
          const processed = response.data.rows
            .filter((row: any) => row[sellerId] !== null && row[sellerId] !== undefined)
            .map((row: any) => {
              const value = row[sellerId] as string;
              if (!value) return null;
              
              const parts = value.split(',');
              if (parts.length === 0) return null;
              
              const orderId = parts[0].trim();
              const tags = parts.slice(1).map(tag => tag.trim()).filter(tag => tag);
              
              return { orderId, tags };
            })
            .filter((item): item is FilteredTag => item !== null);
          
          setFilteredTags(processed);
        }
      } catch (err) {
        console.error('Error fetching tags data:', err);
        setError('Falha ao carregar dados de tags');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [sellerId]);

  return { tagsData, filteredTags, isLoading, error };
}
