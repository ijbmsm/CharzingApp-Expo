import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ValidationContextType {
  showValidationErrors: boolean;
  setShowValidationErrors: (show: boolean) => void;
}

const ValidationContext = createContext<ValidationContextType | undefined>(undefined);

export const ValidationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  return (
    <ValidationContext.Provider value={{ showValidationErrors, setShowValidationErrors }}>
      {children}
    </ValidationContext.Provider>
  );
};

export const useValidation = () => {
  const context = useContext(ValidationContext);
  if (!context) {
    throw new Error('useValidation must be used within a ValidationProvider');
  }
  return context;
};
