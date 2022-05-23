export type Input = {
  main: { balancyRing: string[]; proofRing: string[] }
}

export type Output = {
  main: boolean
}

addEventListener("message", (event) => {
  if (event.data.type !== "main") return

  const { balancyRing, proofRing } = event.data.data as Input["main"]

  console.log("worker: inputs:", { balancyRing, proofRing })

  const balancyRingSet = new Set(balancyRing.map((address) => address.toLowerCase()))

  const isValid = proofRing.every((proofRingItem) =>
    balancyRingSet.has(
      `0x${proofRingItem
        .slice(0, 40)
        .split("")
        .reduce(
          (acc, _, i, arr) => (i % 2 === 0 ? `${arr[i]}${arr[i + 1]}${acc}` : acc),
          ""
        )}`
    )
  )
  console.log("worker: isValid:", isValid)

  postMessage({ type: "main", data: isValid })
})

export {}
