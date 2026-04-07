import type { AppProps } from 'next/app';

export default function TinyTaleLegacyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
