import "../styles/globals.scss";

import type { AppProps } from "next/app";
import { ThemeProvider } from "../src/hooks/ThemeProvider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}
