import type { AppProps } from 'next/app';
import { SettingsProvider } from '../contexts/SettingsContext';
import { ModalProvider } from '../contexts/ModalContext';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SettingsProvider>
      <ModalProvider>
        <Component {...pageProps} />
      </ModalProvider>
    </SettingsProvider>
  );
}

export default MyApp;