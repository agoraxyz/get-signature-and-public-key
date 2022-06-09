import {
  Alert,
  Button,
  Collapse,
  Divider,
  Group,
  Stack,
  ThemeIcon,
} from "@mantine/core"
import GuildSelector from "components/GuildSelector"
import useGenerateProof from "hooks/useGenerateProof"
import useVerifyProof from "hooks/useVerifyProof"
import { Check, X } from "phosphor-react"
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
          sx={{ width: "min-content" }}
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
      </Group>

      <Collapse in={!!proof}>
        <Stack>
          <Divider />

          <Group>
            <Button
              sx={{ width: "min-content" }}
              loading={isVerifyProofLoading}
              onClick={() => onVerifyProofSubmit({ proof, ring })}
              size="xs"
              variant="outline"
            >
              {(isVerifyProofLoading && "Verifying") || "Verify proof"}
            </Button>

            {typeof verifyProofResult === "boolean" && !isVerifyProofLoading && (
              <ThemeIcon
                color={(verifyProofResult && "green") || "red"}
                variant="light"
                size="lg"
                sx={{ borderRadius: "100%" }}
              >
                {(verifyProofResult && <Check />) || <X />}
              </ThemeIcon>
            )}
          </Group>
        </Stack>
      </Collapse>
    </Stack>
  )
}

export default DemoPage
