import { Alert, Button, Group, InputWrapper, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/hooks"
import { Prism } from "@mantine/prism"
import { hashMessage, recoverPublicKey } from "ethers/lib/utils"
import type { NextPage } from "next"
import { useMemo, useState } from "react"
import { useAccount, useConnect, useSignMessage } from "wagmi"

const Home: NextPage = () => {
  const { data: account } = useAccount()
  const { isConnected } = useConnect()

  const { signMessage, data, variables, isLoading } = useSignMessage()

  const form = useForm({
    initialValues: {
      message: "",
    },
  })

  const [signedMessage, setSignedMessage] = useState<string>("")

  const jsonData = useMemo(() => {
    if (!variables || !data) return undefined

    return {
      message: signedMessage,
      hashMessage: variables.message,
      signature: data,
      publicKey: recoverPublicKey(variables.message, data),
      address: account.address || "",
    }
  }, [variables, data, signedMessage, account])

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Stack>
      <form
        onSubmit={form.onSubmit(({ message }) => {
          setSignedMessage(message)
          signMessage({ message: hashMessage(message) })
        })}
      >
        <InputWrapper label="Message">
          <Textarea {...form.getInputProps("message")} />
        </InputWrapper>

        <Group position="right" mt="md">
          <Button loading={isLoading} type="submit">
            Sign
          </Button>
        </Group>
      </form>

      {jsonData && (
        <Prism language="json">{JSON.stringify(jsonData, null, 2)}</Prism>
      )}
    </Stack>
  )
}

export default Home
