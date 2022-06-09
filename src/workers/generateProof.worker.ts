import { keccak256, recoverPublicKey } from "ethers/lib/utils"

export type Input = {
  main: { address: string; ring: string[] }
  signature: string
}

export type Output = {
  main: any // type Proof
  signature: string
}

function hexToBytes(hex) {
  // eslint-disable-next-line no-var
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16))
  return bytes
}

addEventListener("message", (event) => {
  if (event.data.type !== "main") return

  const { address, ring } = event.data.data as Input["main"]

  // Small cheat here, if the address is not in the ring, we would get -1
  const index = Math.abs(ring.findIndex((ringItem) => ringItem === address))

  console.log("worker: inputs:", { address, ring, index })

  import("../../zk-wasm").then(
    async ({ commitAddress, generatePedersenParameters, generateProof }) => {
      const pedersonParameters = generatePedersenParameters()
      console.log("worker: pedersonParameters:", pedersonParameters)
      const commitment = commitAddress(address, pedersonParameters)
      console.log("worker: commitment:", commitment)

  import("zk-wasm")

      const signature = await new Promise<string>((resolve, reject) => {
        addEventListener("message", (ev) => {
          if (ev.data.type !== "signature") return
          if (ev.data.data === null) reject()

          console.log("worker: recieved signature: ", event.data.data)
          resolve(ev.data.data)
        })
        console.log("worker: requesting signature")
        postMessage({ type: "signature", data: msgHash })
      }).catch(() => {
        console.log("worker: signature was denied, proof won't be generated")
        postMessage({
          type: "main",
          data: new Error("Signature was denied, proof won't be generated"),
        })
        return undefined
      })

      if (signature === undefined) return

      console.log("worker: signature:", signature)

      const proofInput = {
        msgHash,
        pubkey: recoverPublicKey(msgHash, signature),
        signature,
        index,
        ring,
      }
      console.log("worker: proofInput:", proofInput)

      const proof = generateProof(proofInput, commitment, pedersonParameters)

      console.log("worker: proof:", proof)

      console.log("worker: sending proof message")

      postMessage({ type: "main", data: proof })
    }
  )
})

export {}
