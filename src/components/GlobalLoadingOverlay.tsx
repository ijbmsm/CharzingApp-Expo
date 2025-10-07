import React from 'react';
import { useLoading } from '../contexts/LoadingContext';
import LoadingSpinner from './LoadingSpinner';

const GlobalLoadingOverlay: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();

  return (
    <LoadingSpinner
      visible={isLoading}
      message={loadingMessage}
      overlay={true}
    />
  );
};

export default GlobalLoadingOverlay;