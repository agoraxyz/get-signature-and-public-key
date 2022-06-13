import { Alert, Group, Stack } from "@mantine/core"
import GenerateProofButton from "components/GenerateProofButton"
import GuildSelector from "components/GuildSelector"
import VerifyButton from "components/VerifyButton"
import useBalancy from "hooks/useBalancy"
import { useState } from "react"
import { useConnect } from "wagmi"

const DemoPage = () => {
  const { isConnected } = useConnect()

  const [proof, setProof] = useState()
  const [guild, setGuild] = useState<any>()
  const [role, setRole] = useState<any>()

  const {
    Pubkeys,
    isLoading: isBalancyLoading,
    Hash,
    Nonce,
    Signature,
    Timestamp,
  } = useBalancy<"sign">(role?.requirements, role?.logic, "sign")

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Stack>
      <GuildSelector {...{ setGuild, setRole }} />

      <Group position="right">
        <GenerateProofButton
          isRoleLoading={role === null}
          ring={Pubkeys}
          {...{ guild, setProof, isBalancyLoading }}
        />
        <VerifyButton
          Proof={proof}
          {...{ Hash, Nonce, Signature, Timestamp, Pubkeys }}
        />
      </Group>
    </Stack>
  )
}

export default DemoPage
