addEventListener("message", (event) => {
  if (event.data.type !== "verifyrequest") return

  const { balancyRing, proofRing } = event.data.data as {
    balancyRing: string[]
    proofRing: string[]
  }

  console.log("worker: inputs:", { balancyRing, proofRing })

  const balancyRingSet = new Set(balancyRing)

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

  postMessage({ type: "verifyresult", data: isValid })
})

export {}
