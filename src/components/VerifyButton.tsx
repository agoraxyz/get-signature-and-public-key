import { Button, Collapse } from "@mantine/core"
import useVerify from "hooks/useVerify"

const VerifyButton = ({ Proof, Hash, Nonce, Pubkeys, Signature, Timestamp }) => {
  const { isLoading, onSubmit, response } = useVerify()

  return (
    <Collapse in={!!Proof}>
      <Button
        loading={isLoading}
        onClick={() =>
          onSubmit({
            Proof: JSON.stringify(Proof),
            Hash,
            Nonce,
            Pubkeys,
            Signature,
            Timestamp,
          })
        }
        variant="outline"
        color={
          (typeof response === "boolean" && ((response && "green") || "red")) ||
          undefined
        }
      >
        {(isLoading && "Verifying") || "Verify proof"}
      </Button>
    </Collapse>
  )
}

export default VerifyButton
