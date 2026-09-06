/**
 * useApodTelemetry Hook
 * 
 * - What it does:
 *   Fetches astronomical observation metadata for a given target date (or current daily release),
 *   executing the automated classification + distance telemetry resolver pipeline.
 *   Provides caching, loading, error, and force-refetch states.
 */

import { useState, useEffect, useCallback } from 'react';
import { ApodData } from '../types';
import { fetchApod } from '../lib/fetchApod';

export function useApodTelemetry(targetDate?: string) {
  const [data, setData] = useState<ApodData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (dateToFetch?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchApod(dateToFetch);
      setData(result.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to acquire APOD telemetry');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(targetDate);
  }, [targetDate, loadData]);

  const refetch = useCallback(() => {
    return loadData(targetDate);
  }, [targetDate, loadData]);

  return {
    data,
    isLoading,
    error,
    refetch
  };
}
