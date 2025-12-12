import { useEffect, useMemo, useState } from 'react';
import type { Word } from '@/types/word';

interface UseWordsResult {
  words: Word[];
  isLoading: boolean;
  error: string | null;
}

export function useWords(): UseWordsResult {
  const [data, setData] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const res = await fetch('/words.json');
        if (!res.ok) throw new Error('Failed to load words');
        const words = (await res.json()) as Word[];
        if (isMounted) {
          setData(words);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  return useMemo(
    () => ({ words: data, isLoading, error }),
    [data, isLoading, error]
  );
}
