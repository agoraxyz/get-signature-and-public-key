import { Alert, Button, Group, InputWrapper, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/hooks"
import { Prism } from "@mantine/prism"
import { hashMessage, recoverPublicKey } from "ethers/lib/utils"
import type { NextPage } from "next"
import { useMemo } from "react"
import { useConnect, useSignMessage } from "wagmi"

const Home: NextPage = () => {
  const { isConnected } = useConnect()

  const { signMessage, data, variables, isLoading } = useSignMessage()

  const form = useForm({
    initialValues: {
      message: "",
    },
  })

  const jsonData = useMemo(() => {
    if (!variables || !data) return

    const hashMsg = hashMessage(variables.message)

    return {
      message: variables.message,
      hashMessage: hashMsg,
      signature: data,
      publicKey: recoverPublicKey(hashMsg, data),
    }
  }, [variables, data])

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Stack>
      <form onSubmit={form.onSubmit(signMessage)}>
        <InputWrapper label="Message">
          <Textarea {...form.getInputProps("message")} />
        </InputWrapper>

        <Group position="right" mt="md">
          <Button loading={isLoading} type="submit">
            Submit
          </Button>
        </Group>
      </form>

      {data && <Prism language="json">{JSON.stringify(jsonData, null, 2)}</Prism>}
    </Stack>
  )
}

export default Home
