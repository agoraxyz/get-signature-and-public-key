import {
  Checkbox,
  Collapse,
  Divider,
  Group,
  InputWrapper,
  Loader,
  Select,
  SimpleGrid,
  Text,
} from "@mantine/core"
import { Contract } from "ethers"
import { keccak256, recoverPublicKey, toUtf8Bytes } from "ethers/lib/utils"
import useBalancy from "hooks/useBalancy"
import useGuilds from "hooks/useGuilds"
import useSubmit from "hooks/useSubmit"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import fetcher from "utils/fetcher"
import { useProvider, useSignMessage } from "wagmi"
import ERC20_ABI from "../static/erc20abi.json"

const GuildSelector = ({ setGuild, setUserPubKey, setRing, setBalancyResponse }) => {
  const { signMessageAsync } = useSignMessage()
  const provider = useProvider()

  const guilds = useGuilds()

  const { response: guild, onSubmit: onFetchGuild } = useSubmit(
    (guildUrlName) => fetcher(`/guild/${guildUrlName}`),
    { onSuccess: (g) => setGuild(g) }
  )

  const { response: role, onSubmit: onFetchRole } = useSubmit((roleId) =>
    fetcher(`/role/${roleId}`).then((r) =>
      Promise.all(
        r.requirements.map((req) =>
          req.type === "ERC20"
            ? new Contract(req.address, ERC20_ABI, provider)
                .decimals()
                .then(Number)
                .catch(() => 18)
            : null
        )
      ).then((decimals) => ({
        requirements: r.requirements.map((req, i) => ({
          ...req,
          decimals: decimals[i],
        })),
        logic: r.logic,
      }))
    )
  )

  const {
    Pubkeys,
    holders,
    isLoading: isBalancyLoading,
    Hash,
    Nonce,
    Signature,
    Timestamp,
  } = useBalancy<"sign">(role?.requirements, role?.logic, "sign")

  useEffect(() => {
    setBalancyResponse({ Pubkeys, Hash, Nonce, Signature, Timestamp })
  }, [Pubkeys, Hash, Nonce, Signature, Timestamp])

  const pubKeysSet = useMemo(
    () => (Pubkeys ? new Set(Pubkeys) : undefined),
    [Pubkeys]
  )

  const [isCheating, setIsCheating] = useState(false)
  const { data: userPubKey } = useSWR(
    isCheating && guild?.id ? ["dummy signature", guild?.id] : null,
    (_, guildId) => {
      const msgHash = keccak256(toUtf8Bytes(`#zkp/join.guild.xyz/${guildId}`))
      return signMessageAsync({ message: msgHash }).then((dummySignature) =>
        recoverPublicKey(msgHash, dummySignature).slice(2)
      )
    },
    {
      onSuccess: (pk) => setUserPubKey(pk),
      refreshInterval: 0,
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  )

  const pubKeysAfterCheat = useMemo(
    () =>
      isCheating && userPubKey ? new Set(pubKeysSet).add(userPubKey) : pubKeysSet,
    [pubKeysSet, isCheating, userPubKey]
  )

  useEffect(
    () =>
      setRing(
        (pubKeysAfterCheat !== undefined && Array.from(pubKeysAfterCheat)) ||
          undefined
      ),
    [pubKeysAfterCheat]
  )

  return (
    <>
      <SimpleGrid cols={2} style={{ flexGrow: 1 }}>
        <InputWrapper label="Guild">
          <Select
            searchable
            value={guild?.id}
            onChange={(guildIdStr) => onFetchGuild(guildIdStr)}
            data={(guilds ?? []).map(({ name: label, id: value }) => ({
              label,
              value,
            }))}
          />
        </InputWrapper>

        <Collapse in={!!guild}>
          <InputWrapper label="Role">
            <Select
              onChange={onFetchRole}
              data={(guild?.roles ?? []).map(({ name: label, id: value }) => ({
                label,
                value,
              }))}
            />
          </InputWrapper>
        </Collapse>
      </SimpleGrid>

      <Group align={"center"}>
        {isBalancyLoading ? (
          <Loader size="sm" />
        ) : typeof holders === "number" ? (
          <Text>{pubKeysAfterCheat.size} keys in ring</Text>
        ) : null}

        {!!pubKeysSet && (
          <>
            <Divider orientation="vertical" style={{ height: "30px" }} />
            Cheat?
            <Checkbox
              checked={isCheating}
              onClick={({ target: { checked } }: any) => setIsCheating(checked)}
            />
          </>
        )}
      </Group>
    </>
  )
}

export default GuildSelector
