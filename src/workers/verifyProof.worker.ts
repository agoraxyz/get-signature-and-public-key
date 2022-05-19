addEventListener("message", (event) => {
  if (event.data.type !== "verifyrequest") return

  const { proof } = event.data.data

  console.log("worker: inputs:", { proof })

  import("../../zk-wasm").then(async ({ verifyProof }) => {
    console.log("worker: calling verifyProof...")
    try {
      const verifyResult = verifyProof(proof)
      console.log("worker: verifyResult:", verifyResult)
      postMessage({ type: "verifyresult", data: verifyResult })
    } catch {
      console.log(
        "worker: verifyResult thrown an exception, sending verifyResult:",
        false
      )
      postMessage({ type: "verifyresult", data: false })
    }
  })
})

export {}
