import { useState, useEffect, useCallback } from 'react';
import { AxiosError } from 'axios';

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface UsePaginatedApiState<T> {
  data: T[] | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
}

interface UsePaginatedApiReturn<T> extends UsePaginatedApiState<T> {
  fetchData: (params?: any) => Promise<void>;
  setPage: (page: number) => void;
  refresh: () => void;
}

export function usePaginatedApi<T>(
  apiFunction: (params: any) => Promise<{ data: { data: T[]; pagination: PaginationInfo } }>
): UsePaginatedApiReturn<T> {
  const [state, setState] = useState<UsePaginatedApiState<T>>({
    data: null,
    pagination: null,
    loading: false,
    error: null,
  });
  
  const [currentParams, setCurrentParams] = useState<any>({
    page: 1,
    limit: 20,
  });

  const fetchData = useCallback(
    async (params?: any) => {
      const mergedParams = { ...currentParams, ...params };
      setCurrentParams(mergedParams);
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await apiFunction(mergedParams);
        setState({
          data: response.data.data,
          pagination: response.data.pagination,
          loading: false,
          error: null,
        });
      } catch (err) {
        const error = err as AxiosError<{ error: { message: string } }>;
        const errorMessage = error.response?.data?.error?.message || 
                           error.message || 
                           'Failed to fetch data';
        
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
      }
    },
    [apiFunction, currentParams]
  );

  const setPage = useCallback((page: number) => {
    fetchData({ page });
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData(currentParams);
  }, [fetchData, currentParams]);

  useEffect(() => {
    fetchData();
  }, []); // Only run on mount

  return { ...state, fetchData, setPage, refresh };
}