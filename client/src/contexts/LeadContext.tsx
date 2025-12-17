import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Lead } from '@shared/schema';

interface LeadContextType {
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  clearSelectedLead: () => void;
  sourceId: string | null;
  setSourceId: (id: string | null) => void;
}

const LeadContext = createContext<LeadContextType | null>(null);

export function LeadProvider({ children }: { children: ReactNode }) {
  const [selectedLead, setSelectedLeadState] = useState<Lead | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);

  const setSelectedLead = useCallback((lead: Lead | null) => {
    setSelectedLeadState(lead);
  }, []);

  const clearSelectedLead = useCallback(() => {
    setSelectedLeadState(null);
  }, []);

  return (
    <LeadContext.Provider value={{
      selectedLead,
      setSelectedLead,
      clearSelectedLead,
      sourceId,
      setSourceId,
    }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeadContext() {
  const context = useContext(LeadContext);
  if (!context) {
    throw new Error('useLeadContext must be used within a LeadProvider');
  }
  return context;
}

export function useOptionalLeadContext() {
  return useContext(LeadContext);
}
