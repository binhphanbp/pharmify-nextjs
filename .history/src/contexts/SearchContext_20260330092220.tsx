'use client';

import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Product } from '@/types/product';

interface SearchContextType {
  query: string;
  setQuery: (q: string) => void;
  suggestions: Product[];
  showDropdown: boolean;
  setShowDropdown: (v: boolean) => void;
  isSearching: boolean;
  submitSearch: (q?: string) => void;
  clearSearch: () => void;
  searchProducts: (
    query: string,
    page?: number,
    perPage?: number,
  ) => Promise<{ data: Product[]; hasMore: boolean }>;
}

const SearchContext = createContext<SearchContextType | null>(null);

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch must be used within SearchProvider');
  return ctx;
}

export function SearchProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [query, setQueryState] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchProductsFromDB = async (
    searchQuery: string,
    page: number = 1,
    perPage: number = 20,
  ): Promise<{ data: Product[]; hasMore: boolean }> => {
    const supabase = createClient();
    const trimmed = searchQuery.trim();
    if (!trimmed) return { data: [], hasMore: false };

    const from = (page - 1) * perPage;
    const { data, error } = await supabase
      .from('v_product_catalog')
      .select('*')
      .eq('is_active', true)
      .ilike('name', `%${trimmed}%`)
      .order('name', { ascending: true })
      .range(from, from + perPage - 1);

    if (error) {
      console.error('Search error:', error);
      return { data: [], hasMore: false };
    }

    return {
      data: data || [],
      hasMore: (data || []).length === perPage,
    };
  };

  const setQuery = useCallback((q: string) => {
    setQueryState(q);

    // Clear previous debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await searchProductsFromDB(q, 1, 8);
        setSuggestions(data);
        setShowDropdown(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const submitSearch = useCallback(
    (q?: string) => {
      const searchTerm = (q ?? query).trim();
      if (searchTerm.length > 0) {
        setShowDropdown(false);
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
      }
    },
    [query, router],
  );

  const clearSearch = useCallback(() => {
    setQueryState('');
    setSuggestions([]);
    setShowDropdown(false);
    setIsSearching(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const searchProducts = useCallback(
    async (q: string, page: number = 1, perPage: number = 20) => {
      return searchProductsFromDB(q, page, perPage);
    },
    [],
  );

  return (
    <SearchContext.Provider
      value={{
        query,
        setQuery,
        suggestions,
        showDropdown,
        setShowDropdown,
        isSearching,
        submitSearch,
        clearSearch,
        searchProducts,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}
