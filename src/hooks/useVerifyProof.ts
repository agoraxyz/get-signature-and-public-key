import { showNotification } from "@mantine/notifications"
import useWorker from "hooks/useWorker"
import { Input, Output } from "workers/verifyProof.worker"

const useVerifyProof = () =>
  useWorker<Input, Output>(
    "verifyProof",
    {
      main:
        ({ resolve }) =>
        (res) =>
          resolve(res),
    },
    {
      onError: () => {
        showNotification({
          color: "red",
          title: "Error",
          message: "Falied to verify proof",
          autoClose: 2000,
        })
      },
      onSuccess: () => {
        showNotification({
          color: "green",
          title: "Success",
          message: "Proof verification successful",
          autoClose: 2000,
        })
      },
    }
  )

export default useVerifyProof
