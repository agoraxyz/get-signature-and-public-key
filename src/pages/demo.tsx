import { Alert, Button } from "@mantine/core"
import { showNotification } from "@mantine/notifications"
import useGenerateProof from "hooks/useGenerateProof"
import useSubmit from "hooks/useSubmit"
import { useEffect } from "react"
import { useConnect } from "wagmi"

const DemoPage = () => {
  const generateProof = useGenerateProof()
  const { isConnected } = useConnect()

  const { onSubmit, isLoading, response } = useSubmit(() => generateProof(), {
    onError: () => {
      showNotification({
        color: "red",
        title: "Error",
        message: "Signature request has been rejected",
        autoClose: 2000,
      })
    },
    onSuccess: () => {
      showNotification({
        color: "green",
        title: "Success",
        message: "Proof generation successful",
        autoClose: 2000,
      })
    },
  })

  useEffect(() => {
    if (!response) return
    console.log("Proof:", response)
  }, [response])

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Button loading={!generateProof || isLoading} onClick={onSubmit}>
      Generate proof
    </Button>
  )
}

export default DemoPage
