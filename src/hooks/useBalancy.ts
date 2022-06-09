import { parseUnits } from "@ethersproject/units"
import useDebouncedState from "hooks/useDebouncedState"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import fetcher from "utils/fetcher"

const fetchHolders = (_: string, logic: "OR" | "AND", requirements: any) =>
  fetcher(`${process.env.NEXT_PUBLIC_BALANCY_API}/xyzHolders`, {
    body: {
      logic,
      requirements,
      limit: 0,
    },
  }).then((data) => ({ ...data, usedLogic: logic }))

type BalancyResponse = {
  addresses: string[]
  count: number
  limit: number
  offset: number
  usedLogic: "OR" | "AND"
}

/** These are objects, so we can just index them when filtering requirements */
const BALANCY_SUPPORTED_TYPES = {
  ERC20: true,
  ERC721: true,
  ERC1155: true,
}
const BALANCY_SUPPORTED_CHAINS = {
  ETHEREUM: true,
}

const useBalancy = (requirements, logic) => {
  const debouncedRequirements = useDebouncedState(requirements)

  // Fixed logic for single requirement to avoid unnecessary refetch when changing logic
  const balancyLogic =
    logic === "NAND" || logic === "NOR" ? logic.substring(1) : logic

  const renderedRequirements = useMemo(
    () => debouncedRequirements?.filter(({ type }) => type !== null) ?? [],
    [debouncedRequirements]
  )

  const mappedRequirements = useMemo(
    () =>
      renderedRequirements
        ?.filter(
          ({ type, address, chain, data, decimals }) =>
            address?.length > 0 &&
            BALANCY_SUPPORTED_TYPES[type] &&
            BALANCY_SUPPORTED_CHAINS[chain] &&
            (type !== "ERC20" || typeof decimals === "number") &&
            (typeof data?.minAmount === "number" ||
              /^([0-9]+\.)?[0-9]+$/.test(data?.minAmount))
        )
        ?.map(({ address, data: { minAmount }, type, decimals }) => {
          let balancyAmount = minAmount.toString()
          if (type === "ERC20") {
            try {
              const wei = parseUnits(balancyAmount, decimals).toString()
              balancyAmount = wei
            } catch {}
          }

          return {
            tokenAddress: address,
            amount: balancyAmount,
          }
        }) ?? [],
    [renderedRequirements]
  )

  const shouldFetch = !!balancyLogic && mappedRequirements?.length > 0

  const [holders, setHolders] = useState<BalancyResponse>(undefined)
  const { data, isValidating } = useSWR(
    shouldFetch ? ["balancy_holders", balancyLogic, mappedRequirements] : null,
    fetchHolders,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  useEffect(() => {
    if (mappedRequirements.length <= 0) {
      setHolders(undefined)
    }
  }, [mappedRequirements])

  const allowlists = useMemo(
    () =>
      renderedRequirements
        ?.filter(({ type }) => type === "ALLOWLIST")
        ?.map(({ data: { addresses } }) => addresses) ?? [],
    [renderedRequirements]
  )

  useEffect(() => {
    if (!data) return

    if (balancyLogic === "OR") {
      const holdersList = new Set([
        ...(data?.addresses ?? []),
        ...allowlists.filter((_) => !!_).flat(),
      ])

      setHolders({
        ...data,
        count: holdersList.size,
        addresses: Array.from(holdersList),
      })
      return
    }

    const holdersList = (data?.addresses ?? []).filter((address) =>
      allowlists.filter((_) => !!_).every((list) => list.includes(address))
    )

    setHolders({
      ...data,
      count: holdersList.length,
      addresses: holdersList,
    })
  }, [data, renderedRequirements])

  return {
    addresses: holders
      ? [
          "045e62fd6208f642e3d71ba08e76211e6167e1a594d9f327c929e1ff089c1c5c128e1beb1ebc7b54719fdbd00e4f86124e5f763783cf7ca13e380020a65dafbbdf",
          "0490f7ba720cb01cb6b073c12e8a1e3b989a3fd5d10372483a66741ac5a8540d69f3c2b6302008eed8739adf1abe36199c6a4a6cf04ae13d0f5cf179eb93204f30",
          "047f00ec1d5e0b579a56c6b0b311407e32542a2e787a24973876a7481106eb3e69ef6cea2fe5501fd19870daefb471136c96766b2396c4007827f2981af3bb3898",
          "048f977e594cded9c10630f69eb01e04d679bb5a152e4a1d7b930aa1396fe57ad6e0a51a738824688ca64b58757e6b31a5e1fbcfb1510273011096941357611468",
          "04fcd9155da3594ca354286019fcbdd17051bc9973ebfeb618261be1f3528a306602e8df3461dab168291cbe0c67cf11a1ab6daf3fe34066699b5eefad48a3f616",
          "0487cfc64ffe363bd77656c7d5fd4bd5ab01aab5985413041a08a6223ed7245a0f1bd1b4021fa4fd405f906ef4adfed5d995172868b76319047c35cf19e757c59d",
        ]
      : undefined, // holders?.addresses
    holders: holders ? 6 : undefined, // holders?.count
    usedLogic: holders?.usedLogic, // So we always display "at least", and "at most" according to the logic, we used to fetch holders
    isLoading: isValidating,
    inaccuracy:
      renderedRequirements.length - (mappedRequirements.length + allowlists.length), // Always non-negative
  }
}

export default useBalancy
