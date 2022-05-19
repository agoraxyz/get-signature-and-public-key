import {
  Alert,
  Button,
  Checkbox,
  Collapse,
  Divider,
  Group,
  InputWrapper,
  Loader,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
} from "@mantine/core"
import { useForm } from "@mantine/hooks"
import { showNotification } from "@mantine/notifications"
import { Contract } from "ethers"
import useBalancy from "hooks/useBalancy"
import useGenerateProof from "hooks/useGenerateProof"
import useSubmit from "hooks/useSubmit"
import useVerifyProof from "hooks/useVerifyProof"
import { Check, X } from "phosphor-react"
import { useEffect, useMemo, useState } from "react"
import fetcher from "utils/fetcher"
import { useAccount, useConnect, useProvider } from "wagmi"
import ERC20_ABI from "../static/erc20abi.json"

const DemoPage = () => {
  const { data: accountData } = useAccount()
  const generateProof = useGenerateProof()
  const { isConnected } = useConnect()
  const provider = useProvider()

  const guildNameForm = useForm({
    initialValues: {
      guildUrlName: "",
    },
  })

  const { response: roles, onSubmit: onFetchGuild } = useSubmit((guildUrlName) =>
    fetcher(`/guild/${guildUrlName}`).then((g) => g.roles)
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

  const cheatedAddresses = useMemo(
    () =>
      isCheating ? new Set(addressesSet).add(accountData.address) : addressesSet,
    [addressesSet, isCheating]
  )

  const verifyProof = useVerifyProof()

  const {
    onSubmit,
    isLoading,
    response: proof,
  } = useSubmit(() => generateProof(Array.from(cheatedAddresses)), {
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
  })

  const {
    onSubmit: onVerifySubmit,
    isLoading: isVerifyLoading,
    response: verifyResult,
  } = useSubmit(() => verifyProof(proof), {
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
  })

  useEffect(() => {
    if (!proof) return
    console.log("Proof:", proof)
  }, [proof])

  if (!isConnected) {
    return (
      <Alert title="Wallet not connected" color="red">
        Connect your wallet to continue
      </Alert>
    )
  }

  return (
    <Stack>
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

      <Collapse in={!!roles}>
        <Stack>
          <InputWrapper label="Role" sx={{ flexGrow: 1 }}>
            <Select
              onChange={onFetchRole}
              data={(roles ?? []).map(({ name: label, id: value }) => ({
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

        {/* <Collapse in={!!requirements}>
          <Prism language="json">{JSON.stringify(requirements, null, 2)}</Prism>
          </Collapse> */}
      </Collapse>

      <Group position="right">
        <Button
          sx={{ width: "min-content" }}
          loading={!generateProof || isLoading}
          onClick={onSubmit}
          disabled={!cheatedAddresses}
        >
          {(isLoading && "Generating proof") || "Generate proof"}
        </Button>
      </Group>

      <Collapse in={!!proof}>
        <Stack>
          <Divider />

          <Group>
            <Button
              sx={{ width: "min-content" }}
              loading={isVerifyLoading}
              onClick={onVerifySubmit}
              size="xs"
              variant="outline"
            >
              {(isVerifyLoading && "Verifying") || "Verify proof"}
            </Button>

            {typeof verifyResult === "boolean" && !isVerifyLoading && (
              <ThemeIcon
                color={(verifyResult && "green") || "red"}
                variant="light"
                size="lg"
                sx={{ borderRadius: "100%" }}
              >
                {(verifyResult && <Check />) || <X />}
              </ThemeIcon>
            )}
          </Group>
        </Stack>
      </Collapse>
    </Stack>
  )
}

export default DemoPage
