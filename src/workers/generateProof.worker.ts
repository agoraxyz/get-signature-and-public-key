import {
  arrayify,
  computeAddress,
  hashMessage,
  keccak256,
  recoverPublicKey,
  toUtf8Bytes,
} from "ethers/lib/utils"

export type Input = {
  main: { ring: string[]; guildId: number }
  signature: string
}

export type Output = {
  main: any // type Proof
  signature: string
}

addEventListener("message", (event) => {
  if (event.data.type !== "main") return

  console.group("[WORKER - generateProof]")

  const { ring, guildId } = event.data.data as Input["main"]

  console.log("inputs:", { ring, guildId })

  // eslint-disable-next-line import/no-extraneous-dependencies
  import("tom256")
    .then(async ({ generateProof }) => {
      const msgHash = keccak256(toUtf8Bytes(`#zkp/join.guild.xyz/${guildId}`))
      console.log("msgHash:", msgHash)

      const signature = await new Promise<string>((resolve, reject) => {
        addEventListener("message", (ev) => {
          if (ev.data.type !== "signature") return
          if (ev.data.data === null) reject()
          resolve(ev.data.data)
        })
        console.log("requesting signature")
        postMessage({ type: "signature", data: msgHash })
      }).catch(() => {
        console.log("signature was denied, proof won't be generated")
        postMessage({
          type: "main",
          data: new Error("Signature was denied, proof won't be generated"),
        })
        return undefined
      })

      if (signature === undefined) return

      const pubkey = recoverPublicKey(
        arrayify(hashMessage(msgHash)),
        signature
      ).slice(2)

      const recoveredAddress = computeAddress(`0x${pubkey}`)

      console.log("recoveredAddress", recoveredAddress)

      const index = Math.abs(ring.findIndex((ringItem) => ringItem === pubkey))

      console.log("idnex of signer:", index)

      console.log("signature:", signature)

      const proofInput = { msgHash, pubkey, signature, index, guildId }
      console.log("proofInput:", { input: proofInput, ring })

      const proof = generateProof(proofInput, ring)

      console.log("proof:", proof)

      postMessage({ type: "main", data: proof })
    })
    .finally(() => {
      console.groupEnd()
    })
})

export {}
