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
import useSubmit from "hooks/useSubmit"
import useWorker from "hooks/useWorker"
import { Check, X } from "phosphor-react"
import { useMemo, useState } from "react"
import fetcher from "utils/fetcher"
import { useAccount, useConnect, useProvider, useSignMessage } from "wagmi"
import type {
  Input as GenerateProofInput,
  Output as GenerateProofOutput,
} from "workers/generateProof.worker"
import {
  Input as VerifyProofInput,
  Output as VerifyProofOutput,
} from "workers/verifyProof.worker"
import {
  Input as VerifyRingInput,
  Output as VerifyRingOutput,
} from "workers/verifyRing.worker"
import ERC20_ABI from "../static/erc20abi.json"

const DemoPage = () => {
  const { data: accountData } = useAccount()
  const { isConnected } = useConnect()
  const provider = useProvider()
  const { signMessageAsync } = useSignMessage()

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
  } = useWorker<GenerateProofInput, GenerateProofOutput>(
    "generateProof",
    {
      signature:
        ({ worker }) =>
        (message) =>
          signMessageAsync({ message })
            .then((signature) =>
              worker.postMessage({ type: "signature", data: signature })
            )
            .catch(() => worker.postMessage({ type: "signature", data: null })),
      main:
        ({ resolve, reject }) =>
        (pr) =>
          pr instanceof Error ? reject(pr) : resolve(pr),
    },
    {
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
    }
  )

  const {
    onSubmit: onVerifyProofSubmit,
    isLoading: isVerifyProofLoading,
    response: verifyProofResult,
  } = useWorker<VerifyProofInput, VerifyProofOutput>(
    "verifyProof",
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
    }
  )

  const {
    onSubmit: onVerifyRingSubmit,
    isLoading: isVerifyRingLoading,
    response: verifyRingResult,
  } = useWorker<VerifyRingInput, VerifyRingOutput>(
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
