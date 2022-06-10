import { Button } from "@mantine/core"
import useGenerateProof from "hooks/useGenerateProof"
import { useEffect } from "react"

const GenerateProofButton = ({ userPubKey, ring, guild, setProof }) => {
  const {
    onSubmit: onGenerateProof,
    isLoading: isProofGenerating,
    response: proof,
  } = useGenerateProof()

  useEffect(() => setProof(proof), [proof])

  return (
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
  )
}

export default GenerateProofButton
