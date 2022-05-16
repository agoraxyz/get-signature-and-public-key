import { Alert, Button, Group, InputWrapper, Stack, Textarea } from "@mantine/core"
import { useForm } from "@mantine/hooks"
import { Prism } from "@mantine/prism"
import { arrayify, hashMessage, recoverPublicKey } from "ethers/lib/utils"
import type { NextPage } from "next"
import { useConnect, useSignMessage } from "wagmi"

const Home: NextPage = () => {
  const { isConnected } = useConnect()

  const { signMessage, data, variables, isLoading } = useSignMessage()

  const form = useForm({
    initialValues: {
      message: "",
    },
  })

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
        onSubmit={form.onSubmit(({ message }) =>
          signMessage({ message: hashMessage(message) })
        )}
      >
        <InputWrapper label="Message">
          <Textarea {...form.getInputProps("message")} />
        </InputWrapper>

        <Group position="right" mt="md">
          <Button loading={isLoading} type="submit">
            Submit
          </Button>
        </Group>
      </form>

      {data && (
        <Prism language="json">
          {JSON.stringify(
            {
              message: variables.message,
              hashMessage: hashMessage(variables.message),
              signature: data,
              publicKey: recoverPublicKey(
                arrayify(hashMessage(variables.message)),
                data
              ),
            },
            null,
            2
          )}
        </Prism>
      )}
    </Stack>
  )
}

export default Home
