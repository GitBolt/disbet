import { Flex, LinkBox, Text } from "@chakra-ui/react"
import dynamic from "next/dynamic";
import Link from "next/link";
const Wallets = dynamic(() => import("../components/WalletButton"), { ssr: false });

export const Navbar = () => {
  return (
    <Flex zIndex="10" bg="gray.200" h="1rem" w="100%" justify="space-between" align="center" p="9">

      <Link href="/">
        <LinkBox fontSize="1.5rem" color="gray.800" fontWeight={700} borderRadius="1rem">Disbet</LinkBox>
      </Link>
      <Wallets />
    </Flex>
  )
}