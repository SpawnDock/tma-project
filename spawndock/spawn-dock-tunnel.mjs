import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { WebSocket } from "ws"

const PRIMARY_CONFIG_FILE = "spawndock.dev-tunnel.json"
const LEGACY_CONFIG_FILE = "spawndock.config.json"

const readNumber = (value) => {
  if (value === undefined || value.length === 0) {
    return undefined
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

const normalizeConfig = (data) => {
  if (typeof data !== "object" || data === null) {
    return {}
  }

  const record = data
  const controlPlane =
    typeof record.controlPlane === "string"
      ? record.controlPlane
      : typeof record.controlPlaneUrl === "string"
        ? record.controlPlaneUrl
        : undefined
  const projectSlug =
    typeof record.projectSlug === "string" ? record.projectSlug : undefined
  const deviceSecret =
    typeof record.deviceSecret === "string"
      ? record.deviceSecret
      : typeof record.deviceToken === "string"
        ? record.deviceToken
        : undefined
  const port =
    typeof record.port === "number"
      ? record.port
      : typeof record.localPort === "number"
        ? record.localPort
        : undefined

  return { controlPlane, projectSlug, deviceSecret, port }
}

const readConfigFile = (dir) => {
  for (const fileName of [PRIMARY_CONFIG_FILE, LEGACY_CONFIG_FILE]) {
    try {
      const raw = readFileSync(resolve(dir, fileName), "utf-8")
      return normalizeConfig(JSON.parse(raw))
    } catch {
      // Try next candidate.
    }
  }

  return {}
}

const parseArgs = (argv) => {
  const result = {}

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    const next = argv[index + 1]

    if (arg === "--control-plane" || arg.startsWith("--control-plane=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next
      if (value) {
        result.controlPlane = value
      }
      if (!arg.includes("=")) {
        index += 1
      }
      continue
    }

    if (arg === "--project-slug" || arg.startsWith("--project-slug=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next
      if (value) {
        result.projectSlug = value
      }
      if (!arg.includes("=")) {
        index += 1
      }
      continue
    }

    if (arg === "--device-secret" || arg.startsWith("--device-secret=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next
      if (value) {
        result.deviceSecret = value
      }
      if (!arg.includes("=")) {
        index += 1
      }
      continue
    }

    if (arg === "--port" || arg.startsWith("--port=")) {
      const value = arg.includes("=") ? arg.slice(arg.indexOf("=") + 1) : next
      const parsed = readNumber(value)
      if (parsed !== undefined) {
        result.port = parsed
      }
      if (!arg.includes("=")) {
        index += 1
      }
    }
  }

  return result
}

const resolveConfig = (
  argv = process.argv.slice(2),
  cwd = process.cwd()
) => {
  const file = readConfigFile(cwd)
  const args = parseArgs(argv)
  const env = {
    controlPlane: process.env.SPAWNDOCK_CONTROL_PLANE,
    projectSlug: process.env.SPAWNDOCK_PROJECT_SLUG,
    deviceSecret: process.env.SPAWNDOCK_DEVICE_SECRET,
    port: readNumber(process.env.SPAWNDOCK_PORT)
  }

  const controlPlane = args.controlPlane ?? env.controlPlane ?? file.controlPlane
  const projectSlug = args.projectSlug ?? env.projectSlug ?? file.projectSlug
  const deviceSecret = args.deviceSecret ?? env.deviceSecret ?? file.deviceSecret
  const port = args.port ?? env.port ?? file.port ?? 3000

  if (!controlPlane) {
    throw new Error("Missing --control-plane or SPAWNDOCK_CONTROL_PLANE")
  }

  if (!projectSlug) {
    throw new Error("Missing --project-slug or SPAWNDOCK_PROJECT_SLUG")
  }

  if (!deviceSecret) {
    throw new Error("Missing --device-secret or SPAWNDOCK_DEVICE_SECRET")
  }

  return { controlPlane, projectSlug, deviceSecret, port }
}

const createTunnel = (config) => {
  const localOrigin = `http://127.0.0.1:${config.port}`
  const wsUrl = buildWsUrl(config)

  const connect = () => {
    const ws = new WebSocket(wsUrl)
    let heartbeatInterval = null

    ws.on("open", () => {
      console.log(`SpawnDock dev tunnel: ${config.projectSlug} -> ${localOrigin}`)
      ws.send(
        JSON.stringify({
          type: "hello",
          projectSlug: config.projectSlug,
          port: config.port,
          protocolVersion: 1
        })
      )

      heartbeatInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "heartbeat",
              projectSlug: config.projectSlug,
              timestamp: Date.now()
            })
          )
        }
      }, 15_000)
    })

    ws.on("message", async (data) => {
      let message

      try {
        message = JSON.parse(data.toString())
      } catch {
        return
      }

      if (message.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", nonce: message.nonce }))
        return
      }

      if (message.type !== "http-request" || !message.request) {
        return
      }

      try {
        const response = await proxyRequest(message.request, localOrigin)
        ws.send(JSON.stringify({ type: "http-response", response }))
      } catch (error) {
        const messageText =
          error instanceof Error ? error.message : String(error)
        ws.send(
          JSON.stringify({
            type: "error",
            requestId: message.request.requestId,
            message: messageText
          })
        )
      }
    })

    ws.on("close", () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }

      console.log("SpawnDock tunnel disconnected, retrying in 2s")
      setTimeout(connect, 2000)
    })

    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error.message}`)
    })
  }

  connect()
}

const buildWsUrl = (config) => {
  const url = new URL(config.controlPlane)

  if (url.protocol === "http:") {
    url.protocol = "ws:"
  } else if (url.protocol === "https:") {
    url.protocol = "wss:"
  } else if (url.protocol !== "ws:" && url.protocol !== "wss:") {
    throw new Error("Unsupported control plane URL protocol")
  }

  url.pathname = `${url.pathname.replace(/\/$/, "")}/tunnel/connect`
  url.searchParams.set("token", config.deviceSecret)
  url.searchParams.set("protocolVersion", "1")

  return url.toString()
}

const proxyRequest = async (request, localOrigin) => {
  const targetUrl = new URL(request.path, localOrigin)
  const headers = new Headers()

  for (const [name, value] of request.headers ?? []) {
    if (!isHopByHopHeader(name)) {
      headers.set(name, value)
    }
  }

  const init = {
    method: request.method,
    headers
  }

  if (request.body && request.method !== "GET" && request.method !== "HEAD") {
    init.body = decodeRequestBody(request.body)
  }

  const upstreamResponse = await fetch(targetUrl, init)
  const bodyBytes = new Uint8Array(await upstreamResponse.arrayBuffer())

  const response = {
    requestId: request.requestId,
    status: upstreamResponse.status,
    headers: Array.from(upstreamResponse.headers.entries())
  }

  if (!isResponseBodyEmpty(bodyBytes)) {
    return {
      ...response,
      body: encodeResponseBody(bodyBytes)
    }
  }

  return response
}

const isHopByHopHeader = (name) => {
  const hopByHopHeaders = new Set([
    "connection",
    "host",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "content-length"
  ])

  return hopByHopHeaders.has(name.toLowerCase())
}

const decodeRequestBody = (body) => {
  if (body.encoding === "utf8") {
    return body.value
  }

  return Buffer.from(body.value, "base64")
}

const encodeResponseBody = (body) => ({
  encoding: "base64",
  value: Buffer.from(body).toString("base64")
})

const isResponseBodyEmpty = (body) => body.byteLength === 0

try {
  const config = resolveConfig()
  createTunnel(config)
} catch (error) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
