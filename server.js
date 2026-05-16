// server.js (Node, no dependencies)
const http = require("http")
const https = require("https")
const fs = require("fs")
const path = require("path")

const DEFAULT_BASE =
  process.env.DEFAULT_BASE ||
  "https://eu2.contabostorage.com/0a32580aadc445ef969bf80291b61f14:asurcdn"
let DOMAIN_MAP = {}

const loadDomainConfig = () => {
  try {
    const cfgPath = path.join(__dirname, "domains.json")
    if (fs.existsSync(cfgPath)) {
      DOMAIN_MAP = JSON.parse(fs.readFileSync(cfgPath, "utf8"))
      console.log("Loaded domain map from domains.json")
      return
    }
    if (process.env.DOMAINS) {
      DOMAIN_MAP = JSON.parse(process.env.DOMAINS)
      console.log("Loaded domain map from DOMAINS env var")
      return
    }
  } catch (e) {
    console.error("Failed to load domains config:", e.message || e)
  }
  DOMAIN_MAP = {}
}

loadDomainConfig()

const getBaseForHost = (hostHeader) => {
  if (!hostHeader) return DEFAULT_BASE
  const host = hostHeader.split(":")[0].toLowerCase()
  if (DOMAIN_MAP[host]) return DOMAIN_MAP[host]
  const withoutWww = host.replace(/^www\./, "")
  if (DOMAIN_MAP[withoutWww]) return DOMAIN_MAP[withoutWww]
  return DEFAULT_BASE
}

const buildPath = (rawPath, removeQuestion = false) =>
  rawPath
    .split("/")
    .map((seg) => {
      try {
        let d = decodeURIComponent(seg)
        if (removeQuestion) d = d.replace(/\?$/, "")
        return encodeURIComponent(d)
      } catch {
        return seg
      }
    })
    .join("/")

http
  .createServer(async (req, res) => {
    const raw = req.url.replace("?", "%3F")
    const base = getBaseForHost(req.headers.host)

    const tryFetch = (path) =>
      new Promise((resolve) => {
        https
          .get(base + path, resolve)
          .on("error", () => resolve({ statusCode: 500 }))
      })

    let upstream = await tryFetch(buildPath(raw, false))
    if (upstream.statusCode === 403 || upstream.statusCode === 404) {
      upstream = await tryFetch(buildPath(raw, true))
    }

    res.writeHead(upstream.statusCode, upstream.headers)
    upstream.pipe(res)
  })
  .listen(process.env.PORT || 3000, () =>
    console.log(`Listening on ${process.env.PORT || 3000}`),
  )
