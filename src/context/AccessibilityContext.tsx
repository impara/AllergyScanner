import React, { createContext, useContext, useState, ReactNode } from 'react';
import { getAccessibleColor } from '../utils/accessibility';

interface AccessibilityContextType {
  isHighContrastEnabled: boolean;
  toggleHighContrast: () => void;
  getAccessibleColor: (foreground: string, background: string) => string;
}

interface AccessibilityProviderProps {
  children: ReactNode;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isHighContrastEnabled, setIsHighContrastEnabled] = useState(false);

  const value = {
    isHighContrastEnabled,
    toggleHighContrast: () => setIsHighContrastEnabled(prev => !prev),
    getAccessibleColor: (foreground: string, background: string) => 
      isHighContrastEnabled ? getAccessibleColor(foreground, background) : foreground,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}; 