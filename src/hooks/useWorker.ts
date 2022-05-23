import { useEffect, useRef } from "react"
import useSubmit, { Options } from "./useSubmit"

type WorkerName = "generateProof" | "verifyProof" | "verifyRing"

type BaseOutput = {
  main: any
}

const useWorker = <Inputs extends BaseOutput, Outputs extends BaseOutput>(
  workerName: WorkerName,
  messageHandlers: {
    [x in keyof Outputs]: ({
      resolve,
      reject,
      worker,
    }: Partial<{
      resolve: (value: Outputs[x]) => void
      reject: (reason: any) => void
      worker: Worker
    }>) => (input: Outputs[x]) => void
  },
  options: Options<Outputs["main"]> = {}
) => {
  const worker = useRef<Worker>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const workers: Record<WorkerName, Worker> = {
      generateProof: new Worker(
        new URL(`../workers/generateProof.worker.ts`, import.meta.url)
      ),
      verifyProof: new Worker(
        new URL(`../workers/verifyProof.worker.ts`, import.meta.url)
      ),
      verifyRing: new Worker(
        new URL(`../workers/verifyRing.worker.ts`, import.meta.url)
      ),
    }

    worker.current = workers[workerName]
  }, [])

  useEffect(() => () => worker.current?.terminate(), [worker])

  const fetcherFunction = (input: Inputs["main"]) => {
    let messageListener = null
    let errorListener = null

    return new Promise<Outputs[keyof Outputs]>((resolve, reject) => {
      messageListener = (event) =>
        messageHandlers[event.data.type as keyof Outputs]({
          worker: worker.current,
          resolve,
          reject,
        })(event.data.data)
      errorListener = () => reject()

      worker.current.addEventListener("message", messageListener)
      worker.current.addEventListener("error", errorListener)

      worker.current.postMessage({ type: "main", data: input })
    }).finally(() => {
      worker.current.removeEventListener("message", messageListener)
      worker.current.removeEventListener("error", errorListener)
    })
  }

  return useSubmit(fetcherFunction, options)
}

export default useWorker
