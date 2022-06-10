import { parseUnits } from "@ethersproject/units"
import useDebouncedState from "hooks/useDebouncedState"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import fetcher from "utils/fetcher"

const fetchHolders = (
  _: string,
  logic: "OR" | "AND",
  requirements: any,
  mode: keyof BalancyResponse
) =>
  fetcher(`${process.env.NEXT_PUBLIC_BALANCY_API}/${mode}`, {
    body: {
      logic,
      requirements,
      limit: 0,
    },
  }).then((data) => ({ ...data, usedLogic: logic }))

type BalancyResponse = {
  xyzHolders: {
    addresses: string[]
    count: number
    limit: number
    offset: number
    usedLogic: "OR" | "AND"
  }
  sign: {
    Pubkeys: string[]
    Hash: string
    Nonce: string
    Timestamp: number
    Signature: string
    usedLogic: "OR" | "AND"
  }
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

// TODO: Would be nice to only pass mode as type or only as value parameter
const useBalancy = <Mode extends keyof BalancyResponse>(
  requirements,
  logic,
  mode: keyof BalancyResponse = "xyzHolders"
) => {
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

  const [holders, setHolders] = useState<BalancyResponse[Mode]>(undefined)
  const { data, isValidating } = useSWR(
    shouldFetch ? ["balancy_holders", balancyLogic, mappedRequirements, mode] : null,
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
    holders:
      ("count" in holders && holders?.count) ||
      ("addresses" in holders && holders.addresses.length) ||
      ("Pubkeys" in holders && holders.Pubkeys.length) ||
      undefined,
    isLoading: isValidating,
    inaccuracy:
      renderedRequirements.length - (mappedRequirements.length + allowlists.length), // Always non-negative
    ...holders,
  }
}

export default useBalancy
