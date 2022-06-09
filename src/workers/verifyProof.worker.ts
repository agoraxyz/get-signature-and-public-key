export type Input = {
  main: { proof: any; ring: any } // TODO typing
}

export type Output = {
  main: boolean
}

addEventListener("message", (event) => {
  if (event.data.type !== "main") return

  console.group("[WORKER - verifyProof]")

  const { proof, ring } = event.data.data

  console.log("inputs:", { proof })

  import("zk-wasm")
    .then(async ({ verifyProof }) => {
      console.log("calling verifyProof(proof)")
      try {
        const verifyResult = verifyProof(proof, ring)
        console.log("verifyResult:", verifyResult)
        postMessage({ type: "main", data: verifyResult })
      } catch (error) {
        console.log("verifyResult error:", error)
        postMessage({ type: "main", data: false })
      }
    })
    .finally(() => {
      console.groupEnd()
    })
})

export {}
