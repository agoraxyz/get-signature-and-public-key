import { keccak256, recoverPublicKey } from "ethers/lib/utils"

function hexToBytes(hex) {
  // eslint-disable-next-line no-var
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16))
  return bytes
}

addEventListener("message", (event) => {
  if (event.data.type !== "proofrequest") return

  const { address, ring } = event.data.data as { address: string; ring: string[] }

  // Small cheat here, if the address is not in the ring, we would get -1
  const index = Math.abs(ring.findIndex((ringItem) => ringItem === address))

  console.log("worker: inputs:", { address, ring, index })

  import("../../zk-wasm").then(
    async ({ commitAddress, generatePedersenParameters, generateProof }) => {
      const pedersonParameters = generatePedersenParameters()
      console.log("worker: pedersonParameters:", pedersonParameters)
      const commitment = commitAddress(address, pedersonParameters)
      console.log("worker: commitment:", commitment)

      const digest = [
        ...hexToBytes(commitment.commitment.x),
        ...hexToBytes(commitment.commitment.y),
        ...hexToBytes(commitment.commitment.z),
      ]
      console.log("worker: digest:", digest)
      const msgHash = keccak256(digest)

      console.log("worker: msgHash:", msgHash)

      const signature = await new Promise<string>((resolve, reject) => {
        addEventListener("message", (ev) => {
          if (ev.data.type !== "signature") return
          if (ev.data.data === null) reject()

          console.log("worker: recieved signature: ", event.data.data)
          resolve(ev.data.data)
        })
        console.log("worker: requesting signature")
        postMessage({ type: "signrequest", data: msgHash })
      }).catch(() => {
        console.log("worker: signature was denied, proof won't be generated")
        postMessage({ type: "error" })
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

      postMessage({ type: "proof", data: proof })
    }
  )
})

export {}
