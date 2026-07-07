import { useCallback, useState } from 'react';

export default function useAsyncAction(action) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      return await action(...args);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [action]);

  return { run, loading, error, clearError: () => setError(null) };
}
