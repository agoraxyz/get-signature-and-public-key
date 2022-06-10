import fetcher from "utils/fetcher"
import { BalancyResponse } from "./useBalancy"
import useSubmit from "./useSubmit"

type SubmitProps = Omit<BalancyResponse["sign"], "usedLogic"> & { Proof: any }

const useVerify = () => {
  const verify = (body: SubmitProps) =>
    fetcher(`${process.env.NEXT_PUBLIC_BALANCY_API}/verify`, { body })

  return useSubmit(verify)
}

export default useVerify
