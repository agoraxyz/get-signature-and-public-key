import { NextApiHandler } from "next"

const handler: NextApiHandler = async (req, res) => {
  const {
    query: { params },
  } = req
  const path = (typeof params === "string" ? [params] : params).join("/")

  const response = await fetch(`${process.env.NEXT_PUBLIC_BALANCY_API}/${path}`, {
    method: req.method,
    body: !req.body
      ? undefined
      : (typeof req.body === "string" && req.body) || JSON.stringify(req.body),
    headers: {
      "Content-Type": "application/json",
    },
  })

  const body = await response.text()

  res
    .status(response.status)
    .json(response.ok ? body : JSON.stringify({ message: body }))
}

export default handler
