import { useState } from "react"

type Options<ResponseType> = {
  onSuccess?: (response: ResponseType) => void
  onError?: (error: any) => void
}

const useSubmit = <DataType, ResponseType>(
  fetch: (data?: DataType) => Promise<ResponseType>,
  { onSuccess, onError }: Options<ResponseType> = {}
) => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)
  const [response, setResponse] = useState<ResponseType>(undefined)

  return {
    onSubmit: (data?: DataType) => {
      setIsLoading(true)
      setError(undefined)
      fetch(data)
        .then((d) => {
          onSuccess?.(d)
          setResponse(d)
        })
        .catch((e) => {
          onError?.(e)
          setError(e)
        })
        .finally(() => setIsLoading(false))
    },
    response,
    isLoading,
    error,
  }
}

export default useSubmit
