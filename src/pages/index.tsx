import { Alert, Group, Stack } from "@mantine/core"
import GenerateProofButton from "components/GenerateProofButton"
import GuildSelector from "components/GuildSelector"
import VerifyButton from "components/VerifyButton"
import { useState } from "react"
import { useConnect } from "wagmi"

const DemoPage = () => {
  const { isConnected } = useConnect()

  const [proof, setProof] = useState()
  const [ring, setRing] = useState<string[]>()
  const [userPubKey, setUserPubKey] = useState<string>()
  const [guild, setGuild] = useState<any>()
  const [balancyResponse, setBalancyResponse] = useState<{
    Pubkeys: string[]
    Hash: string
    Nonce: string
    Signature: string
    Timestamp: number
  }>()

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Stack>
      <GuildSelector {...{ setGuild, setRing, setUserPubKey, setBalancyResponse }} />

      <Group position="right">
        <GenerateProofButton {...{ ring, userPubKey, guild, setProof }} />
        <VerifyButton Proof={proof} {...balancyResponse} />
      </Group>
    </Stack>
  )
}

export default DemoPage
