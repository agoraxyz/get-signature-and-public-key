import { showNotification } from "@mantine/notifications"
import useWorker from "hooks/useWorker"
import { useSignMessage } from "wagmi"
import type { Input, Output } from "workers/generateProof.worker"

const useGenerateProof = () => {
  const { signMessageAsync } = useSignMessage()

  return useWorker<Input, Output>(
    "generateProof",
    {
      signature:
        ({ worker }) =>
        (message) =>
          signMessageAsync({ message })
            .then((signature) =>
              worker.postMessage({ type: "signature", data: signature })
            )
            .catch(() => worker.postMessage({ type: "signature", data: null })),
      main:
        ({ resolve, reject }) =>
        (pr) =>
          pr instanceof Error ? reject(pr) : resolve(pr),
    },
    {
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
    }
  )
}

export default useGenerateProof
