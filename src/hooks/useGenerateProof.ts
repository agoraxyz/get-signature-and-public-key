import { useEffect, useState } from "react"
import { useAccount, useSignMessage } from "wagmi"

const useGenerateProof = () => {
  const { data: accountData } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [worker, setWorker] = useState<Worker>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    setWorker(
      new Worker(new URL(`../workers/generateProof.worker.ts`, import.meta.url))
    )
  }, [])

  useEffect(() => () => worker?.terminate(), [worker])

  return (ring: string[]) => {
    let messageListener = null
    let errorListener = null

    return new Promise<any>((resolve, reject) => {
      const messageHandlers = {
        signrequest: (data_1) =>
          signMessageAsync({ message: data_1 })
            .then((signature) =>
              worker.postMessage({ type: "signature", data: signature })
            )
            .catch(() => worker.postMessage({ type: "signature", data: null })),
        proof: (data_3) => resolve(data_3),
        error: () => reject(),
      }

      messageListener = (event) => messageHandlers[event.data.type](event.data.data)
      errorListener = () => reject()

      worker.addEventListener("message", messageListener)
      worker.addEventListener("error", errorListener)

      worker.postMessage({
        type: "proofrequest",
        data: { address: accountData.address, ring },
      })
    }).finally(() => {
      worker.removeEventListener("message", messageListener)
      worker.removeEventListener("error", errorListener)
    })
  }
}

export default useGenerateProof
