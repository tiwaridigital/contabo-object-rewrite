// server.js (Node, no dependencies)
const http = require("http");
const https = require("https");

const BASE = "https://eu2.contabostorage.com/0a32580aadc445ef969bf80291b61f14:asurcdn";

const buildPath = (rawPath, removeQuestion = false) =>
  rawPath.split("/").map((seg) => {
    try {
      let d = decodeURIComponent(seg);
      if (removeQuestion) d = d.replace(/\?$/, "");
      return encodeURIComponent(d);
    } catch { return seg; }
  }).join("/");

http.createServer(async (req, res) => {
  const raw = req.url.replace("?", "%3F");
  
  const tryFetch = (path) => new Promise((resolve) => {
    https.get(BASE + path, resolve).on("error", () => resolve({ statusCode: 500 }));
  });

  let upstream = await tryFetch(buildPath(raw, false));
  
  if (upstream.statusCode === 403 || upstream.statusCode === 404) {
    upstream = await tryFetch(buildPath(raw, true));
  }

  res.writeHead(upstream.statusCode, upstream.headers);
  upstream.pipe(res);
}).listen(3000);