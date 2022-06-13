import { Collapse, InputWrapper, Select, SimpleGrid } from "@mantine/core"
import { Contract } from "ethers"
import useGuilds from "hooks/useGuilds"
import useSubmit from "hooks/useSubmit"
import fetcher from "utils/fetcher"
import { useProvider } from "wagmi"
import ERC20_ABI from "../static/erc20abi.json"

const GuildSelector = ({ setGuild, setRole }) => {
  const provider = useProvider()

  const guilds = useGuilds()

  const { response: guild, onSubmit: onFetchGuild } = useSubmit(
    (guildUrlName) => fetcher(`/guild/${guildUrlName}`),
    { onSuccess: (g) => setGuild(g) }
  )

  const { onSubmit: onFetchRole } = useSubmit(
    (roleId) =>
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
      ),
    { onSuccess: (r) => setRole(r) }
  )

  return (
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
  )
}

export default GuildSelector
