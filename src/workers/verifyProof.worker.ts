export type Input = {
  main: { proof: any; ring: any } // TODO typing
}

export type Output = {
  main: boolean
}

addEventListener("message", (event) => {
  if (event.data.type !== "main") return

  console.group("[WORKER - verifyProof]")

  const { proof, ring } = event.data.data as Input["main"]

  // eslint-disable-next-line import/no-extraneous-dependencies
  import("tom256")
    .then(async ({ verifyProof }) => {
      try {
        console.log("inputs: ", { proof, ring })
        const verifyResult = verifyProof(proof, ring)
        console.log("result:", verifyResult)
        postMessage({ type: "main", data: verifyResult })
      } catch (error) {
        console.error("error:", error)
        postMessage({ type: "main", data: false })
      }
    })
    .finally(() => {
      console.groupEnd()
    })
})

export {}
