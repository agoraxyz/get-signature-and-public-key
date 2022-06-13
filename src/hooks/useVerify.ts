import fetcher from "utils/fetcher"
import { BalancyResponse } from "./useBalancy"
import useSubmit from "./useSubmit"

type SubmitProps = Omit<BalancyResponse["sign"], "usedLogic"> & { Proof: any }

const useVerify = () => {
  const verify = (body: SubmitProps) =>
    fetcher(`/api/balancy/verify`, { body })
      .then(() => true)
      .catch((error) =>
        error?.message?.includes("failed to verify membership")
          ? false
          : Promise.reject(error)
      )

  return useSubmit(verify)
}

export default useVerify
