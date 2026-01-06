import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';

/**
 * Custom hook for handling API calls with loading and error states
 * Provides consistent error handling and loading management
 */
const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const execute = useCallback(async (apiCall, options = {}) => {
    const {
      onSuccess = null,
      onError = null,
      showLoading = true,
      resetError = true
    } = options;

    try {
      if (resetError) {
        setError(null);
      }
      
      if (showLoading) {
        setLoading(true);
      }

      const result = await apiCall();
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err.message || 'Произошла ошибка при выполнении запроса';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      } else {
        console.error('API Error:', err);
      }
      
      throw err;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError
  };
};

export default useApi;