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
import { Contract } from "ethers"
import useBalancy from "hooks/useBalancy"
import useGenerateProof from "hooks/useGenerateProof"
import useSubmit from "hooks/useSubmit"
import useVerifyProof from "hooks/useVerifyProof"
import useVerifyRing from "hooks/useVerifyRing"
import { Check, X } from "phosphor-react"
import { useMemo, useState } from "react"
import fetcher from "utils/fetcher"
import { useAccount, useConnect, useProvider } from "wagmi"
import ERC20_ABI from "../static/erc20abi.json"

const DemoPage = () => {
  const { data: accountData } = useAccount()
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

  const {
    onSubmit: onGenerateProof,
    isLoading: isProofGenerating,
    response: proof,
  } = useGenerateProof()

  const {
    onSubmit: onVerifyProofSubmit,
    isLoading: isVerifyProofLoading,
    response: verifyProofResult,
  } = useVerifyProof()

  const {
    onSubmit: onVerifyRingSubmit,
    isLoading: isVerifyRingLoading,
    response: verifyRingResult,
  } = useVerifyRing()

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
          loading={isProofGenerating}
          onClick={() =>
            onGenerateProof({
              address: accountData.address,
              ring: Array.from(cheatedAddresses),
            })
          }
          disabled={!cheatedAddresses}
        >
          {(isProofGenerating && "Generating proof") || "Generate proof"}
        </Button>
      </Group>

      <Collapse in={!!proof}>
        <Stack>
          <Divider />

          <Group>
            <Button
              sx={{ width: "min-content" }}
              loading={isVerifyProofLoading}
              onClick={() => onVerifyProofSubmit({ proof })}
              size="xs"
              variant="outline"
            >
              {(isVerifyProofLoading && "Verifying") || "Verify proof"}
            </Button>

            {typeof verifyProofResult === "boolean" && !isVerifyProofLoading && (
              <ThemeIcon
                color={(verifyProofResult && "green") || "red"}
                variant="light"
                size="lg"
                sx={{ borderRadius: "100%" }}
              >
                {(verifyProofResult && <Check />) || <X />}
              </ThemeIcon>
            )}
          </Group>

          <Group>
            <Button
              sx={{ width: "min-content" }}
              loading={isVerifyRingLoading}
              onClick={() =>
                onVerifyRingSubmit({ balancyRing: addresses, proofRing: proof.ring })
              }
              size="xs"
              variant="outline"
            >
              {(isVerifyRingLoading && "Verifying") || "Verify ring"}
            </Button>

            {typeof verifyRingResult === "boolean" && !isVerifyRingLoading && (
              <ThemeIcon
                color={(verifyRingResult && "green") || "red"}
                variant="light"
                size="lg"
                sx={{ borderRadius: "100%" }}
              >
                {(verifyRingResult && <Check />) || <X />}
              </ThemeIcon>
            )}
          </Group>
        </Stack>
      </Collapse>
    </Stack>
  )
}

export default DemoPage
