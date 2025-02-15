import React, { createContext, useContext, ReactNode, useState } from 'react';

interface ModalContextType {
  showModal: (content: ReactNode) => void;
  hideModal: () => void;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modalContent, setModalContent] = useState<ReactNode | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const showModal = (content: ReactNode) => {
    setModalContent(content);
    setIsOpen(true);
  };

  const hideModal = () => {
    setIsOpen(false);
    // Clear content after animation completes
    setTimeout(() => setModalContent(null), 200);
  };

  return (
    <ModalContext.Provider value={{ showModal, hideModal, isOpen }}>
      {children}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={hideModal}
        >
          <div 
            className="bg-white rounded-xl p-6 w-full max-w-4xl my-8 mx-auto relative"
            onClick={e => e.stopPropagation()}
          >
            {modalContent}
          </div>
        </div>
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