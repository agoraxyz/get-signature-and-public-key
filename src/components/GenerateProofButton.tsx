import { Button, Loader, Text } from "@mantine/core"
import useGenerateProof from "hooks/useGenerateProof"
import { useEffect } from "react"

const GenerateProofButton = ({
  ring,
  guild,
  setProof,
  isBalancyLoading,
  isRoleLoading,
}) => {
  const {
    onSubmit: onGenerateProof,
    isLoading: isProofGenerating,
    response: proof,
  } = useGenerateProof()

  useEffect(() => setProof(proof), [proof])

  return (
    <>
      {isBalancyLoading || isRoleLoading || (!isRoleLoading && !ring) ? (
        <Loader size="sm" />
      ) : typeof ring?.length === "number" ? (
        <Text>{ring.length} keys in ring</Text>
      ) : null}

      <Button
        loading={isProofGenerating}
        onClick={() =>
          onGenerateProof({
            ring,
            guildId: guild?.id?.toString(),
          })
        }
        disabled={!ring}
      >
        {(isProofGenerating && "Generating proof") || "Generate proof"}
      </Button>
    </>
  )
}

export default GenerateProofButton
