import { showNotification } from "@mantine/notifications"
import useWorker from "hooks/useWorker"
import { Input, Output } from "workers/verifyRing.worker"

const useVerifyRing = () =>
  useWorker<Input, Output>(
    "verifyRing",
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
          message: "Falied to verify ring",
          autoClose: 2000,
        })
      },
      onSuccess: () => {
        showNotification({
          color: "green",
          title: "Success",
          message: "Ring verification successful",
          autoClose: 2000,
        })
      },
    }
  )

export default useVerifyRing
