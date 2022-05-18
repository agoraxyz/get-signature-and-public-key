import { randomBytes } from "crypto"

const generatePedersenParameters = () =>
  new Promise((resolve) => setTimeout(() => resolve({ TODO: "Dummy output" }), 1000))

const commitAddress = (pedersenParamerers, address) =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          commitment: {
            x: randomBytes(16).toString("hex"),
            y: randomBytes(16).toString("hex"),
            z: randomBytes(16).toString("hex"),
          },
          randomness: randomBytes(16).toString("hex"),
        }),
      1000
    )
  )

const generateProof = (pedersenParameters, commitment, proof) =>
  new Promise((resolve) =>
    setTimeout(() => resolve(randomBytes(64).toString("hex")), 1000)
  )

const verifyProof = (proof) =>
  new Promise((resolve) => setTimeout(() => resolve(true), 1000))

export { generatePedersenParameters, commitAddress, generateProof, verifyProof }
