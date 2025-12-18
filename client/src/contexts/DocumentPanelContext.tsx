import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { DocumentType } from '@/components/studio/DocumentPanel';

interface DocumentPanelState {
  isOpen: boolean;
  content: string;
  title: string;
  documentType: DocumentType;
  recipient?: string;
  subject?: string;
}

interface DocumentPanelContextType {
  // State
  isOpen: boolean;
  content: string;
  title: string;
  documentType: DocumentType;
  recipient?: string;
  subject?: string;
  
  // Actions
  openDocument: (params: {
    content?: string;
    title?: string;
    type?: DocumentType;
    recipient?: string;
    subject?: string;
  }) => void;
  closeDocument: () => void;
  updateContent: (content: string) => void;
  
  // Legacy compatibility (for sendToEmailBuilder calls)
  sendToDocument: (content: string, subject?: string) => void;
  
  // For components that need to know if panel should expand
  shouldExpand: boolean;
}

const DocumentPanelContext = createContext<DocumentPanelContextType | null>(null);

const defaultState: DocumentPanelState = {
  isOpen: false,
  content: '',
  title: 'Untitled',
  documentType: 'report',
  recipient: undefined,
  subject: undefined,
};

export function DocumentPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DocumentPanelState>(defaultState);

  const openDocument = useCallback((params: {
    content?: string;
    title?: string;
    type?: DocumentType;
    recipient?: string;
    subject?: string;
  }) => {
    setState({
      isOpen: true,
      content: params.content || '',
      title: params.title || 'Untitled',
      documentType: params.type || 'report',
      recipient: params.recipient,
      subject: params.subject,
    });
  }, []);

  const closeDocument = useCallback(() => {
    setState(defaultState);
  }, []);

  const updateContent = useCallback((content: string) => {
    setState(prev => ({ ...prev, content }));
  }, []);

  // Legacy compatibility - maps to openDocument with email type
  const sendToDocument = useCallback((content: string, subject?: string) => {
    setState({
      isOpen: true,
      content,
      title: subject || 'Email',
      documentType: 'email',
      recipient: undefined,
      subject: subject,
    });
  }, []);

  return (
    <DocumentPanelContext.Provider value={{
      isOpen: state.isOpen,
      content: state.content,
      title: state.title,
      documentType: state.documentType,
      recipient: state.recipient,
      subject: state.subject,
      openDocument,
      closeDocument,
      updateContent,
      sendToDocument,
      shouldExpand: state.isOpen,
    }}>
      {children}
    </DocumentPanelContext.Provider>
  );
}

export function useDocumentPanel() {
  const context = useContext(DocumentPanelContext);
  if (!context) {
    throw new Error('useDocumentPanel must be used within a DocumentPanelProvider');
  }
  return context;
}

// Optional hook that doesn't throw if context is missing (for gradual migration)
export function useOptionalDocumentPanel() {
  return useContext(DocumentPanelContext);
}
