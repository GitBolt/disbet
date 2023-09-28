import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head'
import {
  useToast,
  Divider,
  Button,
  Text,
  Box,
  Center,
  VStack,
} from '@chakra-ui/react';
import { useAnchorWallet } from '@solana/wallet-adapter-react';
import { placeBet } from '../../../utils/protocol';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Navbar } from '../../../components/Navbar';

interface Props {
  data: any;
  error?: any;
}
export const truncatedPublicKey = (publicKey: string, length?: number) => {
  if (!publicKey) return;
  if (!length) {
    length = 5;
  }
  return publicKey.replace(publicKey.slice(length, 44 - length), '...');
};

const Sign = function SignPage(props: Props) {
  const toast = useToast();
  const wallet = useAnchorWallet();
  const [processing, setProcessing] = useState<boolean>(false)

  const performAction = async () => {
    if (!wallet) {
      toast({
        status: 'error',
        title: 'Please connect your wallet',
      });
      return;
    }
    setProcessing(true)
    const data = props.data;

    if (data.transaction_type === 'placeBet') {
      try {
        const res = await placeBet(data.marketPk, data.marketPk, data.amount, wallet as NodeWallet);
        if (res && res.data.success) {
          toast({
            status: 'success',
            title: 'Transaction successful',
          });
        } else {
          toast({
            status: 'error',
            title: res && res.errors ? res.errors.toString() : "Error occured",
          });
        }
        setProcessing(false)
      } catch (error) {
        toast({
          status: 'error',
          title: 'Transaction failed',
        });
        console.error(error);
      }
      setProcessing(false)
    }
  };

  useEffect(() => {
    console.log(props.data);
    if (props.error) {
      toast({
        status: 'error',
        title: props.error,
      });
      return;
    }
  }, [props.error, wallet]);

  return (
    <>
      <Navbar />
      <Head>
        <title>DisBet</title>
        <meta name="description" content="Powered by Monaco Protocol" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Center h="80vh">
        <VStack spacing={4}>
          <Box>
            <Text fontSize="5rem" fontWeight={800}>You Are About To Place a Bet</Text>
          </Box>

          <Divider />

          <Box fontSize="2.5rem">
            <Text>Market Address:
              <a href={`https://solscan.io/address/${props.data.marketPk}`} target="_blank" style={{ color: "#127aff", textDecoration: "underline" }}>{truncatedPublicKey(props.data.marketPk, 5)}</a>
            </Text>
            <Text>Type: {props.data.type}</Text>
            <Text>Amount: {props.data.amount} USDT</Text>
          </Box>
          <Divider />

          <Button
            colorScheme="messenger"
            onClick={performAction}
            fontSize="2rem"
            width="17rem"
            isDisabled={processing}
            borderRadius="1rem"
            height="4rem">
            {processing ? 'Processing...' : 'Go Ahead'}
          </Button>
        </VStack>
      </Center>
    </>

  );
};

export default Sign;

export async function getServerSideProps({
  query,
}: {
  query: {
    id: string;
  };
}) {
  const jsonString = Buffer.from(query.id, 'base64').toString();
  try {
    const json = JSON.parse(jsonString);
    return {
      props: {
        data: json,
      },
    };
  } catch (error) {
    return {
      props: {
        error: 'Invalid JSON',
      },
    };
  }
}
