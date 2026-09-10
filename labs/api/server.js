// Demo API tối giản (không framework) cho các lab:
//  - GET /courses/:id  → cache-aside qua Redis khi USE_CACHE=1 (CSH-04). Header X-Cache: HIT/MISS.
//  - GET /courses       → list (dùng cho journey load test).
//  - POST /enroll        → idempotent theo header "Idempotency-Key" (FLT-09).
//  - GET /metrics        → Prometheus (OBS-14): http_requests_total + http_request_duration_seconds.
const http = require("http");
const { Pool } = require("pg");
const { createClient } = require("redis");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: Number(process.env.PG_POOL || 10),
});
const useCache = process.env.USE_CACHE === "1";
const ttl = Number(process.env.CACHE_TTL || 60);
const port = Number(process.env.PORT || 8080);

let redis = null;
async function initRedis() {
  if (!useCache) return;
  redis = createClient({ url: process.env.REDIS_URL });
  redis.on("error", () => {});
  await redis.connect();
}

// ---- Metrics (OBS-14) ----
const BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5];
const reqTotal = new Map(); // "method path status" -> count
const hist = { buckets: new Array(BUCKETS.length).fill(0), sum: 0, count: 0 };
function recordMetric(method, path, status, seconds) {
  const k = `${method} ${path} ${status}`;
  reqTotal.set(k, (reqTotal.get(k) || 0) + 1);
  hist.sum += seconds;
  hist.count += 1;
  for (let i = 0; i < BUCKETS.length; i++) if (seconds <= BUCKETS[i]) hist.buckets[i] += 1;
}
function renderMetrics() {
  let out = "# TYPE http_requests_total counter\n";
  for (const [k, v] of reqTotal) {
    const [method, path, status] = k.split(" ");
    out += `http_requests_total{method="${method}",path="${path}",status="${status}"} ${v}\n`;
  }
  out += "# TYPE http_request_duration_seconds histogram\n";
  let cum = 0;
  for (let i = 0; i < BUCKETS.length; i++) {
    cum += hist.buckets[i];
    out += `http_request_duration_seconds_bucket{le="${BUCKETS[i]}"} ${cum}\n`;
  }
  out += `http_request_duration_seconds_bucket{le="+Inf"} ${hist.count}\n`;
  out += `http_request_duration_seconds_sum ${hist.sum}\n`;
  out += `http_request_duration_seconds_count ${hist.count}\n`;
  return out;
}
// Chuẩn hóa path để tránh cardinality nổ (/courses/123 → /courses/:id).
function labelPath(pathname) {
  if (/^\/courses\/\d+$/.test(pathname)) return "/courses/:id";
  return pathname;
}

function json(res, code, obj, headers = {}) {
  res.writeHead(code, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(obj));
}

async function handle(req, res, url) {
  if (url.pathname === "/metrics") {
    res.writeHead(200, { "content-type": "text/plain; version=0.0.4" });
    return res.end(renderMetrics());
  }
  if (url.pathname === "/health") return json(res, 200, { ok: true, cache: useCache });

  if (req.method === "GET" && url.pathname === "/courses") {
    const { rows } = await pool.query("select id,title,price from courses order by id limit 20");
    return json(res, 200, rows);
  }

  const m = url.pathname.match(/^\/courses\/(\d+)$/);
  if (req.method === "GET" && m) {
    const id = m[1];
    const key = "course:" + id;
    if (useCache && redis) {
      const cached = await redis.get(key);
      if (cached) return json(res, 200, JSON.parse(cached), { "x-cache": "HIT" });
    }
    const { rows } = await pool.query("select * from courses where id=$1", [id]);
    if (!rows[0]) return json(res, 404, { error: "not found" });
    if (useCache && redis) {
      const jitter = Math.floor(ttl * 0.2 * (Math.random() - 0.5));
      await redis.set(key, JSON.stringify(rows[0]), { EX: ttl + jitter });
    }
    return json(res, 200, rows[0], { "x-cache": "MISS" });
  }

  if (req.method === "POST" && url.pathname === "/enroll") {
    let body = "";
    for await (const c of req) body += c;
    const data = body ? JSON.parse(body) : {};
    const idem = req.headers["idempotency-key"] || null;
    if (idem) {
      const prev = await pool.query("select enrollment_id from idempotency where key=$1", [idem]);
      if (prev.rows[0])
        return json(res, 200, { enrollment_id: prev.rows[0].enrollment_id, replay: true });
    }
    const ins = await pool.query(
      "insert into enrollments(user_id,course_id) values($1,$2) returning id",
      [data.user_id, data.course_id]
    );
    const eid = ins.rows[0].id;
    if (idem)
      await pool.query(
        "insert into idempotency(key,enrollment_id) values($1,$2) on conflict do nothing",
        [idem, eid]
      );
    return json(res, 201, { enrollment_id: eid, replay: false });
  }

  json(res, 404, { error: "no route" });
}

const server = http.createServer((req, res) => {
  const start = process.hrtime.bigint();
  const url = new URL(req.url, "http://x");
  res.on("finish", () => {
    if (url.pathname === "/metrics") return; // không tự đếm endpoint metrics
    const sec = Number(process.hrtime.bigint() - start) / 1e9;
    recordMetric(req.method, labelPath(url.pathname), res.statusCode, sec);
  });
  handle(req, res, url).catch((e) => json(res, 500, { error: String(e) }));
});

initRedis().then(() =>
  server.listen(port, () => console.log(`api on :${port} cache=${useCache}`))
);
