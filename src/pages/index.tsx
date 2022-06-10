import { Alert, Button, Collapse, Group, Stack } from "@mantine/core"
import GuildSelector from "components/GuildSelector"
import useGenerateProof from "hooks/useGenerateProof"
import useVerifyProof from "hooks/useVerifyProof"
import { useState } from "react"
import { useConnect } from "wagmi"

const DemoPage = () => {
  const { isConnected } = useConnect()
  const [ring, setRing] = useState<string[]>()
  const [userPubKey, setUserPubKey] = useState<string>()
  const [guild, setGuild] = useState<any>()

  const {
    onSubmit: onGenerateProof,
    isLoading: isProofGenerating,
    response: proof,
  } = useGenerateProof()

  const {
    onSubmit: onVerifyProofSubmit,
    isLoading: isVerifyProofLoading,
    response: verifyProofResult,
  } = useVerifyProof()

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Stack>
      <GuildSelector {...{ setGuild, setRing, setUserPubKey }} />

      <Group position="right">
        <Button
          loading={isProofGenerating}
          onClick={() =>
            onGenerateProof({
              userPubKey,
              ring,
              guildId: guild?.id?.toString(),
            })
          }
          disabled={!ring}
        >
          {(isProofGenerating && "Generating proof") || "Generate proof"}
        </Button>

        <Collapse in={!!proof}>
          <Button
            loading={isVerifyProofLoading}
            onClick={() => onVerifyProofSubmit({ proof, ring })}
            variant="outline"
            color={
              (typeof verifyProofResult === "boolean" &&
                ((verifyProofResult && "green") || "red")) ||
              undefined
            }
          >
            {(isVerifyProofLoading && "Verifying") || "Verify proof"}
          </Button>
        </Collapse>
      </Group>
    </Stack>
  )
}

export default DemoPage
