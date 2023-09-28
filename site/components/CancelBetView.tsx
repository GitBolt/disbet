import {
    Divider,
    Text,
    Box,
  } from '@chakra-ui/react';
  import { truncatedPublicKey } from './WalletButton';
  
  
  type Props = {
    betAddress: string;
  }
  export const CancelBetView = ({ betAddress }: Props) => {
    return (
      <>
        <Box>
          <Text fontSize="5rem" fontWeight={800}>You Are About To Cancel a Bet</Text>
        </Box>
  
        <Divider />
  
        <Box fontSize="2.5rem">
          <Text>Bet Address:
            <a
              href={`https://solscan.io/address/${betAddress}`}
              target="_blank"
              style={{ color: "#127aff", textDecoration: "underline" }}>
              {truncatedPublicKey(betAddress, 5)}
            </a>
          </Text>
        </Box>
        <Divider /></>
    )
  }