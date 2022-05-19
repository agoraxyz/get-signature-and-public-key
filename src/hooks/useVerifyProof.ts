import { useEffect, useState } from "react"

const useVerifyProof = () => {
  const [worker, setWorker] = useState<Worker>(null)

  useEffect(() => {
    if (typeof window === "undefined") return
    setWorker(new Worker(new URL(`../workers/verify.worker.ts`, import.meta.url)))
  }, [])

  useEffect(() => () => worker?.terminate(), [worker])

  return (proof) => {
    let messageListener = null
    let errorListener = null

    return new Promise<any>((resolve, reject) => {
      const messageHandlers = {
        verifyresult: (result) => resolve(result),
      }

      messageListener = (event) => messageHandlers[event.data.type](event.data.data)
      errorListener = () => reject()

      worker.addEventListener("message", messageListener)
      worker.addEventListener("error", errorListener)

      worker.postMessage({ type: "verifyrequest", data: { proof } })
    }).finally(() => {
      worker.removeEventListener("message", messageListener)
      worker.removeEventListener("error", errorListener)
    })
  }
}

export default useVerifyProof
