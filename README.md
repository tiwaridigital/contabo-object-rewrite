**Overview**

- **Purpose:** Simple Node HTTP proxy that routes requests to different upstream storage endpoints based on the request Host header.
- **Files:** See [server.js](server.js) and example config [domains.json](domains.json).

**Quick Start**

1. Install Node.js (14+ recommended).
2. Configure domain mappings (see Configuration).
3. Run the server:

```bash
PORT=3000 node server.js
# Windows PowerShell
$env:PORT=3000; node server.js
```

**Configuration**

- **Default upstream:** set `DEFAULT_BASE` env var to change the fallback upstream URL.
- **Per-domain mappings:** create or edit `domains.json` in the project root, mapping hostnames to upstream base URLs. Example file: [domains.json](domains.json).
- **Environment override:** set `DOMAINS` env var to a JSON string to avoid a file (useful for containers).

Example `domains.json`:

```json
{
  "example.com": "https://eu2.contabostorage.com/0a325...:asurcdn",
  "static.example.org": "https://another.storage.provider/abcd1234:asurcdn"
}
```

Note: in the `domains.json` mapping the **left side** is the domain clients will request (matched against the request Host header), and the **right side** is the upstream S3/storage URL the proxy will fetch from.

**Behavior**

- The server reads the Host header and looks up a matching upstream URL in `domains.json` (host and host without `www.` are checked). If no match is found the `DEFAULT_BASE` value is used.
- Path encoding and a small fallback are preserved from the original behavior: when the upstream returns `403` or `404`, the server retries with a slightly adjusted path encoding.

**Testing**

Run a quick curl test (replace `example.com` with a mapped host or set `Host` header):

```bash
curl -H "Host: example.com" http://localhost:3000/path/to/object
```

**Troubleshooting**

- If mappings aren't applied, ensure `domains.json` is valid JSON and readable by the process, or verify `DOMAINS` env var contains valid JSON.
- Check console output for "Loaded domain map" messages when the server starts.
- Use `DEFAULT_BASE` to verify upstream connectivity.

**Next Steps / Improvements**

- Add hot-reload for `domains.json` when changed.
- Add request logging, rate-limiting, TLS termination, or caching depending on needs.

If you'd like, I can add a Dockerfile, hot-reload, or example systemd service next.
