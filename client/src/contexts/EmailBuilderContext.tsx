import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Contact {
  name: string;
  email: string;
  company?: string;
  title?: string;
}

interface EmailBuilderContextType {
  isEmailMode: boolean;
  setIsEmailMode: (mode: boolean) => void;
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  currentTemplate: string;
  setCurrentTemplate: (template: string) => void;
  companyName: string;
  setCompanyName: (name: string) => void;
  // Function to inject content into email builder
  injectContent: ((content: string, subject?: string) => void) | null;
  setInjectContent: (fn: ((content: string, subject?: string) => void) | null) => void;
  // Trigger to send content to email builder
  pendingContent: { content: string; subject?: string } | null;
  sendToEmailBuilder: (content: string, subject?: string) => void;
  clearPendingContent: () => void;
}

const EmailBuilderContext = createContext<EmailBuilderContextType | null>(null);

export function EmailBuilderProvider({ children }: { children: ReactNode }) {
  const [isEmailMode, setIsEmailMode] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentTemplate, setCurrentTemplate] = useState('professional');
  const [companyName, setCompanyName] = useState('');
  const [injectContent, setInjectContent] = useState<((content: string, subject?: string) => void) | null>(null);
  const [pendingContent, setPendingContent] = useState<{ content: string; subject?: string } | null>(null);

  const sendToEmailBuilder = useCallback((content: string, subject?: string) => {
    if (injectContent) {
      injectContent(content, subject);
    } else {
      // Store for later when email builder opens
      setPendingContent({ content, subject });
    }
  }, [injectContent]);

  const clearPendingContent = useCallback(() => {
    setPendingContent(null);
  }, []);

  return (
    <EmailBuilderContext.Provider value={{
      isEmailMode,
      setIsEmailMode,
      contacts,
      setContacts,
      currentTemplate,
      setCurrentTemplate,
      companyName,
      setCompanyName,
      injectContent,
      setInjectContent,
      pendingContent,
      sendToEmailBuilder,
      clearPendingContent,
    }}>
      {children}
    </EmailBuilderContext.Provider>
  );
}

export function useEmailBuilder() {
  const context = useContext(EmailBuilderContext);
  if (!context) {
    throw new Error('useEmailBuilder must be used within an EmailBuilderProvider');
  }
  return context;
}
