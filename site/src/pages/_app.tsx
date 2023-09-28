import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Wallet } from '../../components/WalletProvider'
import { ChakraProvider } from '@chakra-ui/react';

export default function App({ Component, pageProps }: AppProps) {
  return (<>

    <ChakraProvider>
      <Wallet>
        <Component {...pageProps} />
      </Wallet>
    </ChakraProvider>
  </>)
}
