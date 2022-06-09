import {
  Button,
  Checkbox,
  Collapse,
  Group,
  InputWrapper,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
} from "@mantine/core"
import { useForm } from "@mantine/hooks"
import { Contract } from "ethers"
import { keccak256, recoverPublicKey, toUtf8Bytes } from "ethers/lib/utils"
import useBalancy from "hooks/useBalancy"
import useSubmit from "hooks/useSubmit"
import { useEffect, useMemo, useState } from "react"
import useSWR from "swr"
import fetcher from "utils/fetcher"
import { useProvider, useSignMessage } from "wagmi"
import ERC20_ABI from "../../static/erc20abi.json"

const GuildSelector = ({ setGuild, setUserPubKey, setRing }) => {
  const { signMessageAsync } = useSignMessage()
  const provider = useProvider()

  const guildNameForm = useForm({
    initialValues: {
      guildUrlName: "",
    },
  })

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
    addresses,
    holders,
    isLoading: isBalancyLoading,
  } = useBalancy(role?.requirements, role?.logic)

  const addressesSet = useMemo(
    () => (addresses ? new Set(addresses) : undefined),
    [addresses]
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

  const cheatedAddresses = useMemo(
    () =>
      isCheating && userPubKey
        ? new Set(addressesSet).add(userPubKey)
        : addressesSet,
    [addressesSet, isCheating, userPubKey]
  )

  useEffect(
    () =>
      setRing(
        (cheatedAddresses !== undefined && Array.from(cheatedAddresses)) || undefined
      ),
    [cheatedAddresses]
  )

  return (
    <>
      <form
        onSubmit={guildNameForm.onSubmit(({ guildUrlName }) =>
          onFetchGuild(guildUrlName)
        )}
      >
        <Group align="flex-end">
          <InputWrapper label="Guild urlName" sx={{ flexGrow: 1 }}>
            <TextInput {...guildNameForm.getInputProps("guildUrlName")} />
          </InputWrapper>

          <Button type="submit">List Roles</Button>
        </Group>
      </form>

      <Collapse in={!!guild?.roles}>
        <Stack>
          <InputWrapper label="Role" sx={{ flexGrow: 1 }}>
            <Select
              onChange={onFetchRole}
              data={(guild?.roles ?? []).map(({ name: label, id: value }) => ({
                label,
                value,
              }))}
            />
          </InputWrapper>

          {isBalancyLoading ? (
            <Loader size="sm" />
          ) : typeof holders === "number" ? (
            <Text>{holders} addresses satisfy the requirements</Text>
          ) : null}

          <Collapse in={!!addressesSet}>
            <Stack>
              <Group>
                <Text>Cheat?</Text>
                <Checkbox
                  checked={isCheating}
                  onClick={({ target: { checked } }: any) => setIsCheating(checked)}
                />
              </Group>

              {isCheating && cheatedAddresses.size > 0 && (
                <Text>{cheatedAddresses.size} addresses after cheat</Text>
              )}
            </Stack>
          </Collapse>
        </Stack>
      </Collapse>
    </>
  )
}

export default GuildSelector
