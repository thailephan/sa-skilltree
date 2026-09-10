// Demo API tối giản (không framework) cho các lab:
//  - GET /courses/:id  → cache-aside qua Redis khi USE_CACHE=1 (CSH-04). Header X-Cache: HIT/MISS.
//  - GET /courses       → list (dùng cho journey load test).
//  - POST /enroll        → idempotent theo header "Idempotency-Key" (FLT-09).
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

function json(res, code, obj, headers = {}) {
  res.writeHead(code, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://x");

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
        // TTL + jitter (±20%) để chống stampede (cache không hết hạn đồng loạt).
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
  } catch (e) {
    json(res, 500, { error: String(e) });
  }
});

initRedis().then(() =>
  server.listen(port, () => console.log(`api on :${port} cache=${useCache}`))
);
