import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalContextType {
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const showModal = (content: ReactNode) => {
    setModalContent(content);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    setTimeout(() => setModalContent(null), 200);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, isOpen }}>
      {children}
      {mounted && isOpen && modalContent && createPortal(
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 overflow-y-auto"
          style={{ zIndex: 9999 }}
          onClick={hideModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 mx-auto relative"
            onClick={e => e.stopPropagation()}
            role="document"
          >
            {modalContent}
          </div>
        </div>,
        document.body
      )}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}