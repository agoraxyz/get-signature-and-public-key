import { Alert, Button, Stack } from "@mantine/core"
import { Prism } from "@mantine/prism"
import { randomBytes } from "crypto"
import { hashMessage, recoverPublicKey } from "ethers/lib/utils"
import useSubmit from "hooks/useSubmit"
import type { NextPage } from "next"
import { useMemo, useState } from "react"
import { useAccount, useConnect, useSignMessage } from "wagmi"

const getRandomAddresses = (ourAddress: string) => {
  const ourIndex = Math.floor(Math.random() * 5)
  return {
    ring: [...new Array(6)].map((_, i) =>
      i === ourIndex ? ourAddress : `0x${randomBytes(20).toString("hex")}`
    ),
    ourIndex,
  }
}

const Home: NextPage = () => {
  const { data: account } = useAccount()
  const { signMessage, data: signature, isLoading, variables } = useSignMessage()
  const { isConnected } = useConnect()

  const [randomAddresses, setRandomAddresses] = useState(null)

  const proofInput = useMemo(() => {
    if (!variables || !randomAddresses) return null

    return {
      msgHash: variables.message,
      pubKey: recoverPublicKey(variables.message, signature),
      signature,
      index: randomAddresses.ourIndex,
      ring: randomAddresses.ring,
    }
  }, [randomAddresses, signature, variables])

  const {
    onSubmit: onGenerate,
    isLoading: isGenerating,
    response: generated,
  } = useSubmit(async () => {
    const { generatePedersenParameters } = await import("../dummy-wasm")
    return generatePedersenParameters()
  })

  const {
    onSubmit: onCommit,
    isLoading: isCommiting,
    response: commitment,
  } = useSubmit<any, any>(async () => {
    const { commitAddress } = await import("../dummy-wasm")
    return commitAddress(generated, account.address)
  })

  const {
    onSubmit: onGenerateProof,
    isLoading: isGeneratingProof,
    response: proof,
  } = useSubmit<any, any>(async () => {
    const { generateProof } = await import("../dummy-wasm")
    return generateProof(generated, commitment, proofInput)
  })

  const {
    onSubmit: onVerify,
    isLoading: isVerifying,
    response: verifyResult,
  } = useSubmit<any, any>(async () => {
    const { verifyProof } = await import("../dummy-wasm")
    return verifyProof(proof)
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
      <Button
        style={{ width: "min-content" }}
        loading={isGenerating}
        onClick={onGenerate}
      >
        Generate Pedersen parameters
      </Button>
      {!!generated && (
        <>
          <Prism language="json">{JSON.stringify(generated, null, 2)}</Prism>

          <Button
            style={{ width: "min-content" }}
            loading={isCommiting}
            onClick={onCommit}
          >
            Commit address
          </Button>

          {!!commitment && (
            <>
              <Prism language="json">{JSON.stringify(commitment, null, 2)}</Prism>

              <Button
                style={{ width: "min-content" }}
                loading={isLoading}
                onClick={() =>
                  signMessage({
                    message: hashMessage(
                      `${commitment.commitment.x}${commitment.commitment.y}${commitment.commitment.z}`
                    ),
                  })
                }
              >
                Sign
              </Button>

              {!!signature && (
                <>
                  <Prism language="json">
                    {JSON.stringify({ signature }, null, 2)}
                  </Prism>

                  <Button
                    style={{ width: "min-content" }}
                    onClick={() => {
                      setRandomAddresses(getRandomAddresses(account.address))
                    }}
                  >
                    Generate proof input
                  </Button>

                  {!!proofInput && (
                    <>
                      <Prism language="json">
                        {JSON.stringify(proofInput, null, 2)}
                      </Prism>

                      <Button
                        style={{ width: "min-content" }}
                        loading={isGeneratingProof}
                        onClick={onGenerateProof}
                      >
                        Generate proof
                      </Button>

                      {!!proof && (
                        <>
                          <Prism language="json">
                            {JSON.stringify({ proof }, null, 2)}
                          </Prism>

                          <Button
                            style={{ width: "min-content" }}
                            loading={isVerifying}
                            onClick={onVerify}
                          >
                            Verify proof
                          </Button>

                          {!!verifyResult && (
                            <Prism language="json">
                              {JSON.stringify({ verifyResult }, null, 2)}
                            </Prism>
                          )}
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </Stack>
  )
}

export default Home
