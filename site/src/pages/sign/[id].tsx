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
import { cancelBet, placeBet } from '../../../utils/protocol';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Navbar } from '../../../components/Navbar';
import { CancelBetView } from '../../../components/CancelBetView';
import { PlaceBetView } from '../../../components/PlaceBetView';

interface Props {
  data: any;
  error?: any;
}


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

    try {
      let res
      if (data.transaction_type === 'placeBet') {
        res = await placeBet(data.marketPk, data.marketPk, data.amount, wallet as NodeWallet);
      } else if (data.transaction_type === 'cancelBet') {
        res = await cancelBet(data.betAddress, wallet as NodeWallet);
      } else {
        toast({
          status: 'error',
          title: 'Something went wrong, try again',
        });
        return
      }
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


          {props.data.transaction_type == "cancelBet" ? <CancelBetView betAddress={props.data.betAddress} /> :
            <PlaceBetView
              type={props.data.type}
              amount={props.data.amount}
              marketPk={props.data.marketPk}
            />}

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
