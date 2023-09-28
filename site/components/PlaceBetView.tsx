import {
  Divider,
  Text,
  Box,
} from '@chakra-ui/react';
import { truncatedPublicKey } from './WalletButton';


type Props = {
  type: string;
  amount: string;
  marketPk: string;
}
export const PlaceBetView = ({ type, amount, marketPk }: Props) => {
  return (
    <>
      <Box>
        <Text fontSize="5rem" fontWeight={800}>You Are About To Place a Bet</Text>
      </Box>

      <Divider />

      <Box fontSize="2.5rem">
        <Text>Market Address:
          <a
            href={`https://solscan.io/address/${marketPk}`}
            target="_blank"
            style={{ color: "#127aff", textDecoration: "underline" }}>
            {truncatedPublicKey(marketPk, 5)}
          </a>
        </Text>
        <Text>Type: {type}</Text>
        <Text>Amount: {amount} USDT</Text>
      </Box>
      <Divider /></>
  )
}