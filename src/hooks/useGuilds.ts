import useSWR from "swr"
import fetcher from "utils/fetcher"

const useGuilds = () => {
  const { data } = useSWR("/guild", fetcher)

  return data
}

export default useGuilds
