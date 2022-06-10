import {
  Checkbox,
  Collapse,
  Group,
  InputWrapper,
  Loader,
  Select,
  SimpleGrid,
  Stack,
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
import ERC20_ABI from "../../static/erc20abi.json"

const GuildSelector = ({ setGuild, setUserPubKey, setRing }) => {
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
  } = useBalancy<"sign">(role?.requirements, role?.logic, "sign")

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
      <SimpleGrid cols={2}>
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

      <Stack>
        {isBalancyLoading ? (
          <Loader size="sm" />
        ) : typeof holders === "number" ? (
          <Text>{holders} addresses satisfy the requirements</Text>
        ) : null}

        <Collapse in={!!pubKeysSet}>
          <Stack>
            <Group>
              <Text>Cheat?</Text>
              <Checkbox
                checked={isCheating}
                onClick={({ target: { checked } }: any) => setIsCheating(checked)}
              />
            </Group>

            {isCheating && pubKeysAfterCheat.size > 0 && (
              <Text>{pubKeysAfterCheat.size} addresses after cheat</Text>
            )}
          </Stack>
        </Collapse>
      </Stack>
    </>
  )
}

export default GuildSelector
