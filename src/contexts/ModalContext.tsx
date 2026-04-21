import React, { createContext, useContext, useState, ReactNode } from 'react';
import AnimatedModal from '../components/ui/AnimatedModal';

export type ModalType = 'success' | 'info' | 'warning' | 'email';

type ModalState = {
  visible: boolean;
  type: ModalType;
  title: string;
  message?: string;
  primaryActionText?: string;
  onPrimaryAction?: () => void;
};

const defaultState: ModalState = {
  visible: false,
  type: 'info',
  title: '',
};

const ModalContext = createContext({
  show: (_: Omit<ModalState, 'visible'>) => {},
  hide: () => {},
});

export const useModal = () => useContext(ModalContext);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ModalState>(defaultState);
  const show = (opts: Omit<ModalState, 'visible'>) => setState({ ...opts, visible: true });
  const hide = () => setState((s) => ({ ...s, visible: false }));

  return (
    <ModalContext.Provider value={{ show, hide }}>
      {children}
      <AnimatedModal
        visible={state.visible}
        type={state.type}
        title={state.title}
        message={state.message}
        onClose={hide}
        primaryActionText={state.primaryActionText}
        onPrimaryAction={state.onPrimaryAction}
      />
    </ModalContext.Provider>
  );
}
