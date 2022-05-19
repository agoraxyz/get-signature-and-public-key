import { randomBytes } from "crypto"
import { keccak256, recoverPublicKey } from "ethers/lib/utils"

function hexToBytes(hex) {
  // eslint-disable-next-line no-var
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16))
  return bytes
}

const getRing = (ourAddress: string) => {
  const index = Math.floor(Math.random() * 5)
  return {
    ring: [...new Array(6)].map((_, i) =>
      i === index ? ourAddress : `0x${randomBytes(20).toString("hex")}`
    ),
    index,
  }
}

addEventListener("message", (event) => {
  if (event.data.type !== "proofrequest") return

  const address = event.data.data

  console.log("worker: recieved address:", address)

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

      const { index, ring } = getRing(address)
      console.log("worker: ring:", ring)
      console.log("worker: index:", index)

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
