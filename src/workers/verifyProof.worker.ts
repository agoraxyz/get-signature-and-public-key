export type Input = {
  main: { proof: any } // TODO type Proof
}

export type Output = {
  main: boolean
}

addEventListener("message", (event) => {
  if (event.data.type !== "main") return

  const { proof } = event.data.data

  console.log("worker: inputs:", { proof })

  import("../../zk-wasm").then(async ({ verifyProof }) => {
    console.log("worker: calling verifyProof...")
    try {
      const verifyResult = verifyProof(proof)
      console.log("worker: verifyResult:", verifyResult)
      postMessage({ type: "main", data: verifyResult })
    } catch (error) {
      console.log("worker: verifyResult error:", error)
      postMessage({ type: "main", data: false })
    }
  })
})

export {}
