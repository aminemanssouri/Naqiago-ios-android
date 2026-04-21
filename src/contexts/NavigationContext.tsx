import React, { createContext, useContext, useState, ReactNode } from 'react';

interface NavigationContextType {
  pendingNavigation: { screen: string; params?: any } | null;
  setPendingNavigation: (navigation: { screen: string; params?: any } | null) => void;
  clearPendingNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [pendingNavigation, setPendingNavigation] = useState<{ screen: string; params?: any } | null>(null);

  const clearPendingNavigation = () => {
    setPendingNavigation(null);
  };

  return (
    <NavigationContext.Provider value={{
      pendingNavigation,
      setPendingNavigation,
      clearPendingNavigation,
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigationContext = () => {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigationContext must be used within a NavigationProvider');
  }
  return context;
};
