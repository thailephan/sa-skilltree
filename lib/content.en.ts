// English content — mapped over the VI NODES so language-neutral fields
// (id / tier / xp / prereq / calc / synth / boss) stay in sync automatically.
import { NODES, type SkillNode, type Tier } from "./content";

type Localized = Pick<
  SkillNode,
  "title" | "sum" | "theory" | "whenUse" | "pros" | "cons" | "questions" | "lab" | "links"
>;

const EN: Record<string, Localized> = {
  "FND-00": {
    title: "SA Mindset & Trade-offs",
    sum: "CAP/PACELC, latency numbers, back-of-envelope load estimation.",
    theory: `<p>A Solution Architect isn't the person who knows the most tools — it's the person who <b>makes the right trade-off within concrete constraints</b>. Four root questions for every decision: (1) What are the constraints? (users, RPS, budget, team). (2) What are you trading for what? (3) How does this fail? (4) When do I <i>not yet</i> need it?</p>
 <p><b>CAP:</b> under a network partition you can only keep Consistency <i>or</i> Availability. <b>PACELC</b> is more practical: if Partition → choose A or C; Else (normal) → choose Latency or Consistency. This is the root of why different data lives in different stores (a wallet balance picks C; a live-viewer count picks A/Latency).</p>
 <p><b>Latency numbers to memorize:</b> RAM ~100ns · Redis same-DC ~0.5ms · SSD ~0.1ms · round-trip in-DC ~0.5ms · cross-continent ~150ms · indexed query 1–10ms. Every optimization = avoid the expensive op, lean on the cheap one.</p>
 <p><b>Load estimation:</b> 10M users × 10% DAU = 1M active × 50 req/day = 50M/day ≈ 580 RPS average × peak 5–10× ≈ <b>3,000–6,000 RPS peak</b>. Read:write ~100:1 → optimizing reads is priority #1.</p>`,
    whenUse: `<p>Apply this <b>before every other decision</b> in this tree. Without constraint numbers you don't have an architecture — only an opinion.</p>`,
    pros: ["Prevents over-engineering (complexity before it's needed)", "Every later choice has a measurable basis", "Lets you challenge other people's proposals"],
    cons: ["Requires counter-intuitive thinking (accept trade-offs; there's no 'best')", "Needs real data; a wrong estimate skews the design"],
    questions: [
      { q: "Should a 'test-score history' table lean toward C or A? What about 'courses you might like'?",
        a: "<strong>Test scores → C (Consistency).</strong> Wrong/lost scores are unacceptable, with legal/academic weight. A slower response or a temporary error beats a wrong answer. <strong>Course suggestions → A/Latency.</strong> Being a few seconds stale is fine; always respond fast. This is exactly why the two data types can live in two different kinds of store." },
      { q: "2M DAU, 30 req/day/user, peak ×8. Peak RPS ≈ ?",
        a: "2,000,000 × 30 = 60M req/day ÷ 86,400s ≈ <strong>~695 RPS average</strong> × 8 ≈ <strong>~5,560 RPS peak</strong>. Takeaway: a well-written service cluster + cache + read replica handles this — 'millions of users' sounds big, but RPS is what shapes the design." },
      { q: "Name a case where 'add a cache' is the WRONG decision.",
        a: "When data <strong>changes constantly and must always be correct</strong> (wallet balance, exam-seat inventory) — a cache serves stale data and breaks business logic. Or when the <strong>hit rate is low</strong> (each key is read ~once) — a cache only adds a layer without cutting load. A wrong cache is worse than no cache." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Write a one-page 'napkin math' for your own edtech app: assume DAU, requests/user/day, read:write ratio, peak factor → derive average and peak RPS. For each of your 6 key data tables, write 'C or A/Latency?' with a one-line reason.</p>`,
    links: [
      { t: "System Design Primer (classic repo)", u: "github.com/donnemartin/system-design-primer" },
      { t: "Latency numbers every programmer should know", u: "gist.github.com/jboner/2841832" },
      { t: "CAP theorem — IBM", u: "ibm.com/topics/cap-theorem" },
      { t: "Notes on distributed systems for young bloods", u: "somethingsimilar.com/2013/01/14/notes-on-distributed-systems-for-young-bloods" },
    ],
  },
  "LNG-01": {
    title: "Language per service",
    sum: "Polyglot: pick languages by CPU-bound vs I/O-bound, not by what's trendy.",
    theory: `<p>In microservices each service can use the language that fits best (polyglot). The decision axis is <b>not 'what's trendy'</b> but the workload profile: <b>CPU-bound</b> (heavy compute → Go/Rust/Java/C#) vs <b>I/O-bound</b> (many connections waiting on network/disk → Go/Node with cheap concurrency).</p>
 <p>Edtech suggestion: <b>Auth/Identity</b> → C#/.NET or Java (mature identity ecosystem, type-safe). <b>Media/Image upload</b> → Go (lightweight goroutines, great streaming, low RAM). <b>Realtime/Enrollment</b> → NestJS/Node (event-loop suits I/O). <b>Analytics/ML</b> → Python. <b>Catalog</b> → Java/Go.</p>`,
    whenUse: `<p><b>Go polyglot</b> when services have very different profiles AND the team is large enough (>10). <b>Don't</b> with a small team — pick 1–2 core languages. Polyglot on a small team = suicide during a 3 AM on-call.</p>`,
    pros: ["Right tool for the right problem", "Hire from a wider talent pool", "Services are tech-independent, easy to replace"],
    cons: ["Operational cost multiplies per language", "Hard to share common code (contracts via API/proto)", "Cross-language on-call & debugging is hard"],
    questions: [
      { q: "A 'grade student code in a sandbox' service — CPU- or I/O-bound? Which language?",
        a: "Mostly <strong>CPU-bound</strong> (compiling/running code, resource limits). You want a compiled language with good resource control + strong isolation: <strong>Go or Rust</strong> for the sandbox orchestrator, running code inside a container/gVisor/Firecracker. The crux isn't the language — it's <strong>isolation + CPU/RAM/timeout limits</strong> per grading run." },
      { q: "Team of 6 — should you use 5 languages as suggested? Argue against it.",
        a: "<strong>No.</strong> Six people can't maintain deep expertise + on-call for 5 runtimes, 5 security-library sets, 5 pipelines. Consolidate to <strong>1–2 languages</strong> (e.g. Go for most + one rich-ecosystem language like .NET/Java for Auth). Polyglot is a large-org optimization; for a small team, 'boring & uniform' wins." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Build a table for your 6 edtech services: [Service | CPU/IO-bound | chosen language | one-line reason | if the team is only 5, consolidate to which language]. Goal: practice classifying workloads, not chasing trends.</p>`,
    links: [
      { t: "Martin Fowler — Polyglot Programming", u: "martinfowler.com/bliki/PolyglotProgramming.html" },
      { t: "microservices.io — pattern overview", u: "microservices.io/patterns/microservices.html" },
      { t: "Go — why it fits network/concurrency services", u: "go.dev/doc/effective_go" },
    ],
  },
  "DB-02": {
    title: "Choosing a Database (Polyglot Persistence)",
    sum: "No single DB for everything. Choose by data shape + access pattern.",
    theory: `<p>Pick a DB by <b>data shape and how you query it</b>, not by habit.</p>
 <ul>
 <li><b>PostgreSQL</b> — users, RBAC, courses, enrollments: relational, needs ACID + joins. The default to start with.</li>
 <li><b>Object storage (S3/MinIO)</b> — images/video: never put blobs in the DB; the DB stores only the URL.</li>
 <li><b>Redis</b> — session, cache, rate-limit, leaderboard: key-value, TTL, &lt;1ms.</li>
 <li><b>OpenSearch/Elasticsearch</b> — course search, full-text + facets.</li>
 <li><b>ClickHouse</b> (columnar) — learning analytics, dashboards: aggregate billions of rows.</li>
 <li><b>Cassandra/Scylla</b> (wide-column) — activity feed, high-write progress, distributed.</li>
 </ul>
 <p><b>Golden rule:</b> start with Postgres for EVERYTHING (it also does JSONB, full-text, geo, a light queue). Only split to a specialized DB with <b>measurable evidence</b> (p99 &gt; SLA, DB CPU saturated despite indexing + caching).</p>`,
    whenUse: `<p>Move to polyglot persistence when one query type genuinely 'hurts' on Postgres. Don't move for the trend.</p>`,
    pros: ["Each query type is optimally fast (search, analytics, kv)", "Scale each workload independently"],
    cons: ["Consistency across DBs becomes hard (needs event/CDC sync)", "Backup/ops/monitoring get far more complex", "Many sources of 'truth' → data can drift"],
    questions: [
      { q: "'10 related courses' and 'search by keyword + price filter' — which DB(s)? Split or combine?",
        a: "<strong>Search + facet filter → OpenSearch/Elasticsearch</strong> (inverted index, fast filtering). <strong>Related suggestions</strong> can start in Postgres (query by tag/category) or precomputed into Redis; when you need behavior/graph-based, add a graph/vector store. <strong>Start combined on Postgres</strong> for simplicity; split OpenSearch out only when search truly gets slow." },
      { q: "Why NOT store images directly in Postgres even though `bytea` exists?",
        a: "Large blobs <strong>bloat the DB, slow backups/replication, and evict the buffer cache</strong> (pushing hot data out of RAM), and Postgres is not a CDN — it can't serve files well/cheaply. The right way: store files in <strong>object storage</strong>, keep only metadata + URL in Postgres, serve via CDN." },
      { q: "A junior proposes 'use MongoDB for everything because it's schema-flexible'. Rebut.",
        a: "Schema flexibility isn't free: you <strong>lose relational constraints + joins + strong multi-table transactions</strong> that edtech needs (user↔enrollment↔course↔payment). Choose a DB by <strong>access pattern</strong>, not 'flexibility': relational + consistency-needing data → Postgres; use a document store only for genuinely unstructured/document-read data." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Draw an edtech 'data map': list 8–10 data types, each with [primary access pattern | chosen DB | why]. Then challenge yourself: which could Postgres actually handle up to 1M users, which must be split? Mark 'split' only with a measurable reason.</p>`,
    links: [
      { t: "Martin Fowler — Polyglot Persistence", u: "martinfowler.com/bliki/PolyglotPersistence.html" },
      { t: "AWS — Purpose-built databases", u: "docs.aws.amazon.com/whitepapers/latest/aws-overview/database.html" },
      { t: "Things you should know about databases", u: "architecturenotes.co/p/things-you-should-know-about-databases" },
    ],
  },
  "CAP-03": {
    title: "Capacity Planning & Sizing",
    sum: "Little's Law + pool sizing: size config so you don't run short in production.",
    theory: `<p>This answers 'how much capacity so I don't run short in production'. Three pillars:</p>
 <p><b>1) Little's Law:</b> <code>L = λ × W</code>. Concurrent in-flight requests (L) = arrival rate (λ, req/s) × time per request (W, seconds). E.g. 500 RPS × 0.2s = <b>100 concurrent in-flight</b>. That's the minimum number of 'seats' the system must have.</p>
 <p><b>2) Sizing thread/connection pools:</b> two common formulas:</p>
 <ul>
 <li>Threads for I/O-bound: <code>Nthreads = Ncpu × Ucpu × (1 + W/C)</code> — Ncpu cores, Ucpu target utilization (0.8), W wait time (I/O), C compute time.</li>
 <li>DB connection pool (HikariCP): smaller than you think. <code>pool ≈ (cores × 2) + effective spindles</code>. Too big a pool makes it SLOWER (contention, context switching). Use <b>PgBouncer</b> to pool connections instead of raising the pool.</li>
 </ul>
 <p><b>3) Headroom & redundancy (the most important part of 'not running short'):</b></p>
 <ul>
 <li>Run at <b>60–70% utilization</b>, never 100%. Per Kingman, latency <b>rises non-linearly</b> past ~70–80% → queues explode.</li>
 <li>Keep <b>N+1 / N+2</b> redundancy: losing one node must not cause an outage (fault tolerance + rolling deploys).</li>
 <li>Multiply by the <b>peak factor</b> (evening study rush), not the average.</li>
 <li>Add a <b>growth buffer</b> (e.g. enough for 6–12 months of growth).</li>
 <li>Watch <b>saturation</b> of hidden resources: connection pool, file descriptors, bandwidth, IOPS — these often run short before CPU.</li>
 </ul>`,
    whenUse: `<p>Size <b>before every instance/replica/pool choice</b>, and re-do it after each load test. It's the bridge between 'load estimation' (FND-00) and real config.</p>`,
    pros: ["Config chosen with a basis, not guesswork", "Avoids both waste and running short", "Surfaces hidden bottlenecks (pool, IOPS) before users hit them"],
    cons: ["Needs a real W (latency) figure — measure, don't guess", "Idealized model; real systems fluctuate → add headroom", "Wrong peak-factor assumption → still runs short"],
    questions: [
      { q: "A service at 3,000 RPS, p95 latency 150ms. How many in-flight? Why NOT size the pool to exactly that?",
        a: "L = 3000 × 0.15 = <strong>450 in-flight</strong>. Don't size the pool to 450 because that leaves <strong>no headroom</strong>: one small latency spike overflows the queue, requests pile up, p99 explodes. Size pool/workers to run ~<strong>60–70%</strong> (e.g. capacity ~640–750) and keep N+1 spare nodes." },
      { q: "You raise the DB pool from 50 → 500 but throughput drops and latency rises. Why?",
        a: "A DB parallelizes effectively only up to a point (bounded by cores/disks). Too big a pool causes <strong>lock contention, context switching, DB RAM exhaustion</strong> → each query gets slower. The right move: a small pool (HikariCP formula) + <strong>PgBouncer</strong> to fan thousands of clients into few real connections. The shortage isn't connections — it's the DB's real capacity." },
      { q: "Why is targeting 100% CPU a sizing mistake?",
        a: "Per queuing theory (Kingman), as utilization approaches 100%, <strong>wait time approaches infinity</strong> — latency rises non-linearly. At 70% everything is smooth; at 95% a small fluctuation multiplies p99. Always leave headroom for spikes, GC, deploys, and node loss." },
    ],
    lab: `<span class="tag">Lab · use the calculator below</span><p style="margin-top:8px">Enter your peak RPS (from FND-00) + measured p95 latency into the calculator. Read the in-flight count, recommended workers/pool (with 70% headroom), and N+1 node count. Then double the latency (simulating a slow DB) and watch the config demand jump — that's why you must load-test before locking config.</p>`,
    links: [
      { t: "HikariCP — About Pool Sizing (must read)", u: "github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing" },
      { t: "Connection Pool Sizing with Little's Law", u: "michal-drozd.com/en/blog/connection-pool-littles-law" },
      { t: "Vlad Mihalcea — The simple scalability equation", u: "vladmihalcea.com/the-simple-scalability-equation" },
      { t: "Google SRE Workbook — Implementing SLOs", u: "sre.google/workbook/implementing-slos" },
    ],
  },
  "CSH-04": {
    title: "Caching & Redis",
    sum: "Cache layers, cache-aside, invalidation, stampede, hot keys.",
    theory: `<p>A cache = a copy kept somewhere faster to avoid redoing expensive work. <b>Layers:</b> Browser → CDN (images/static) → API Gateway → Application (Redis) → DB buffer.</p>
 <p><b>Patterns:</b> <b>Cache-aside</b> (most common): read cache → on miss read DB → write back to cache. <b>Write-through</b>: write DB + cache together (cache always fresh, slower writes). <b>Write-behind</b>: write cache first, DB later (fast, risk of data loss).</p>
 <p><b>Three classic problems:</b> (1) <b>Invalidation</b> — when data changes, stale cache is wrong; fix with short TTL + fire an event to evict on write. (2) <b>Stampede/thundering herd</b> — many keys expire at once → thousands of requests hit the DB; fix with TTL + jitter and a lock so only one request recomputes. (3) <b>Hot key</b> — one key too hot (a viral course) overloads one node; fix by replicating the key + local cache.</p>
 <p>Redis also does: session, rate-limiter (token bucket), distributed lock, leaderboard (sorted set), pub/sub, light queue.</p>`,
    whenUse: `<p><b>Use</b> when reads dominate, data is re-read often, and a few seconds of staleness is acceptable. <b>Don't</b> when data must be instantly correct (balances) or hit rate is low.</p>`,
    pros: ["Cuts DB load 10–100×, big latency win", "Redis is versatile (lock, rate-limit, session, leaderboard)"],
    cons: ["Adds a failure point + you must reason about invalidation (hard)", "Data can be stale", "Hot key / stampede if done carelessly; a wrong cache is worse than none"],
    questions: [
      { q: "A 'hot' course page at 100k views/min is killing the DB. How do you cache? TTL? Stampede protection?",
        a: "Cache-aside the whole course-page payload in Redis, moderate TTL (e.g. 60–300s) + <strong>jitter</strong> (±20%) so keys don't expire together. Prevent stampede with a <strong>single-flight lock</strong> (only one request rebuilds, the rest wait/read stale) or <strong>stale-while-revalidate</strong>. If one key is still hot → add a <strong>local in-process cache</strong> in the app (a few seconds) to absorb most hits at the pod." },
      { q: "A teacher edited the description but students see the old version for 5 minutes — bug or trade-off? How do you explain it to the PM?",
        a: "It's a <strong>TTL trade-off</strong>, not a bug. Explain: we traded 'absolutely fresh' for 'low load + fast'. Fix by need: (a) accept the delay with a shorter TTL; (b) <strong>actively evict/rewrite the cache on save</strong> (event-driven invalidation) for near-instant freshness; (c) versioned keys. Pick (b) if the PM needs it visible right after editing." },
      { q: "Using Redis as a cache vs as the primary database — what's the difference and the risk of the latter?",
        a: "A cache = a <strong>secondary source you can lose</strong> (rebuild from the source DB). A primary DB = the source of truth; losing it loses data. Risk of treating Redis as primary: by default Redis favors speed over durability — you must configure AOF/replicas carefully, and can still lose a few seconds of writes on failure. Only do it for loss-tolerant data (sessions, temporary counters)." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Run Redis (Docker) + an API that reads a course. Measure p99 for (1) no cache, (2) cache-aside. Then simulate a stampede: have 500 clients call right as the key expires — watch the DB spike. Add jitter + a single-flight lock and re-measure. Record before/after numbers.</p>`,
    links: [
      { t: "AWS — Caching best practices", u: "aws.amazon.com/caching/best-practices" },
      { t: "Cache stampede (Wikipedia)", u: "en.wikipedia.org/wiki/Cache_stampede" },
      { t: "Cloudflare — What is caching", u: "cloudflare.com/learning/cdn/what-is-caching" },
      { t: "Redis docs — patterns", u: "redis.io/docs/latest/develop/use/patterns" },
    ],
  },
  "SHD-05": {
    title: "Partitioning vs Sharding",
    sum: "Split within one server vs across servers. The shard key is do-or-die.",
    theory: `<p><b>Partitioning</b> = split one big table into pieces <b>within a single DB server</b>. Goal: queries scan only the relevant piece, and maintenance is easy (drop a partition to delete old data). E.g. partition <code>activity_log</code> by month.</p>
 <p><b>Sharding</b> = split data across <b>multiple DB servers</b>. Goal: exceed one machine's limits (capacity/write RPS). This is the 'last resort weapon'.</p>
 <p><b>Shard key — the do-or-die choice:</b> it must have high cardinality + even distribution (avoid a 'hot shard'), and match the most common access pattern (avoid scatter-gather across all shards). Edtech: shard by <code>tenant_id/school_id</code> or <code>user_id</code>. AVOID sharding by <code>created_date</code> (new data all lands on one shard).</p>
 <p><b>Tools (2026):</b> don't hand-roll sharding. Use <b>Citus</b> (Postgres), <b>Vitess</b> (MySQL), or a natively-distributed DB (<b>CockroachDB/YugabyteDB/Spanner</b>) — they handle resharding for you.</p>
 <p><b>DB scaling escalation order (memorize):</b> Index → Cache → Read replica → Vertical scale → Partition → Sharding.</p>`,
    whenUse: `<p><b>Partition</b> when a table hits tens of millions of rows and queries filter along one dimension (time/region). <b>Shard</b> only when one server (even the biggest + with replicas) still can't handle writes/capacity. Exhaust the simpler options first.</p>`,
    pros: ["Sharding: near-unlimited write/capacity scaling", "Partition: faster queries + easy maintenance/deletion"],
    cons: ["Sharding: lose cross-shard JOINs & transactions", "Resharding is painful, ops are complex", "A bad shard key → hot shard or scatter-gather everywhere"],
    questions: [
      { q: "2B enrollment rows, 5,000 writes/s, already have index+cache+replica. Partition or shard? Which shard key?",
        a: "Read replicas only help <strong>reads</strong>; the bottleneck here is <strong>5,000 writes/s + 2B rows of capacity</strong> → you need <strong>sharding</strong> (combined with partitioning inside each shard for maintenance). Shard key: <strong>tenant_id/school_id</strong> if multi-tenant (keeps a school's data on one shard, matching per-school queries), or <strong>user_id</strong> for B2C. Avoid created_date." },
      { q: "Why does sharding by created_date cause a hot shard? Describe it.",
        a: "Every NEW write carries the current date → they all land on <strong>the shard covering the current time range</strong>. That shard takes 100% of write traffic while old shards 'sleep'. Result: one shard overloaded, the rest wasted — defeating sharding's purpose (even distribution)." },
      { q: "After sharding by user_id, 'admin views all enrollments for one school' is slow. Why? Fix?",
        a: "A school's students are scattered across shards by user_id → the query must <strong>scatter-gather</strong> every shard then merge → slow. Fixes: (a) add/switch a shard key by school_id if per-school queries are common; (b) maintain a <strong>read model/CQRS</strong> aggregated per school (materialized); (c) run this query in the analytics tier (ClickHouse) instead of OLTP." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Stand up Citus (Docker) with 2 workers. Create an enrollment table distributed by user_id, load ~10M fake rows. Run: (1) query by user_id (single-shard) vs (2) 'count by school' (scatter-gather) — measure the gap. Try switching the distribution column to school_id and compare. Lesson: shard key = access pattern.</p>`,
    links: [
      { t: "Citus — Understanding partitioning vs sharding", u: "citusdata.com/blog/2023/08/04/understanding-partitioning-and-sharding-in-postgres-and-citus" },
      { t: "Vitess — Sharding concepts", u: "vitess.io/docs/concepts/shard" },
      { t: "Database Sharding strategies 2026", u: "zylos.ai/research/2026-02-15-database-sharding" },
    ],
  },
  "GTW-06": {
    title: "API Gateway & Ingress",
    sum: "The front door: routing, auth, rate-limit, SSL. Gateway vs Ingress vs Mesh.",
    theory: `<p>An <b>API Gateway</b> is the single front door every request enters. It handles <b>cross-cutting</b> concerns so services don't repeat them: routing, token verification, rate limiting, SSL termination, request aggregation, logging.</p>
 <p><b>Don't confuse them:</b> <b>API Gateway</b> (Kong/APISIX/AWS API GW) = API logic layer. <b>Ingress Controller/LB</b> (Nginx/Traefik/Envoy) = the K8s entry, L7 routing. <b>Service Mesh</b> (Istio/Linkerd) = manages <b>service↔service internal</b> traffic (mTLS, retries, traffic split). Gateway = north-south (in from outside); Mesh = east-west (internal).</p>`,
    whenUse: `<p>You always need a Gateway/Ingress once you have &gt;1 service. Add a <b>Service Mesh</b> only at &gt;10–15 services when you need mTLS + retries/observability everywhere — Istio is famously complex, don't add it early.</p>`,
    pros: ["Centralizes security/observability/rate-limit", "Slims services down; routing changes don't touch services"],
    cons: ["A central bottleneck & failure point (must be HA + carefully scaled)", "Adds one latency hop", "A misconfig can take down the whole system"],
    questions: [
      { q: "Login token checking — at the Gateway or in each service? Pros/cons?",
        a: "Usually do <strong>authentication (is the token valid?) at the Gateway</strong> — blocks early, services don't repeat it. But <strong>authorization (can this user do this to this resource?) belongs in the service</strong>, since only it knows the business context. All at the Gateway → it bloats with business logic; all in services → duplication + unauthenticated traffic reaches the inside." },
      { q: "The Gateway is a single point of failure. What do you do so it doesn't take down everything?",
        a: "Run <strong>multiple stateless Gateway instances behind an LB</strong>, spread across ≥2 AZs; autoscale; health-check + auto-replace dead ones. Configure <strong>timeouts, rate limits, circuit breakers</strong> at the Gateway so one slow downstream can't drag it down; roll out config via canary so a bad config doesn't take everything down." },
      { q: "In one sentence: how does a Gateway differ from a Service Mesh?",
        a: "<strong>A Gateway handles traffic coming INTO the system from outside (north-south); a Service Mesh handles traffic BETWEEN internal services (east-west).</strong>" },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Run Kong or APISIX (Docker) in front of 2 small services. Configure: path routing, JWT verification, rate-limit 100 req/min/user. Use curl to confirm over-limit requests are blocked. Bonus: enable response caching and measure the load drop on the backend service.</p>`,
    links: [
      { t: "microservices.io — API Gateway pattern", u: "microservices.io/patterns/apigateway.html" },
      { t: "Microsoft — Gateway routing/aggregation", u: "learn.microsoft.com/azure/architecture/microservices/design/gateway" },
      { t: "Istio — What is a service mesh", u: "istio.io/latest/about/service-mesh" },
    ],
  },
  "CQR-07": {
    title: "CQRS & Event Sourcing",
    sum: "Split reads/writes. Store a stream of events instead of state. Use selectively.",
    theory: `<p><b>CQRS</b> = separate the <b>write</b> model (Command, normalized) from the <b>read</b> model (Query, denormalized, pre-optimized for display). E.g. a 'course progress' dashboard reads from a read model with pre-computed %, instead of joining 5 tables on each load.</p>
 <p><b>Event Sourcing</b> = instead of storing current state, store a <b>stream of events</b>; state = replay the events. E.g. store <code>LessonCompleted(1)</code>, <code>QuizPassed</code>... → compute 60%. Gives a <b>perfect audit trail</b>, time travel, and the ability to build a new read model anytime.</p>
 <p>CQRS and ES are <b>independent</b> — you can use CQRS without ES. Both come with <b>eventual consistency</b> (the read model lags the write).</p>`,
    whenUse: `<p><b>CQRS</b>: when reads:writes are very skewed (100:1 like edtech), or display queries are complex/slow. <b>Event Sourcing</b>: ONLY for the few domains that need an audit trail (payments, certificates, legally-meaningful progress). Fowler warns most CQRS/ES cases he's seen were 'not good' — don't use it for simple CRUD.</p>`,
    pros: ["CQRS: reads/writes scale independently, reads are very fast", "ES: immortal audit trail, debug by replay, build new views freely"],
    cons: ["Eventual consistency: read model lags by tens of ms–seconds", "ES is very complex: events are immutable, hard to change old event schemas", "Easy to over-engineer — a project-killing trap"],
    questions: [
      { q: "'Issuing a completion certificate' — should it be Event Sourced? What about 'comment like count'?",
        a: "<strong>Certificate → good fit for Event Sourcing:</strong> needs a full audit (what was studied, when, which criteria met), has legal weight, history must be immutable. <strong>Like count → NO:</strong> simple, low-value, just a counter (Redis/Postgres). Event-sourcing something simple = needless complexity." },
      { q: "After adopting CQRS, progress updates 2s later. How do you explain 'eventual consistency' to a customer?",
        a: "Frame it around their benefit: 'The system records your result immediately and guarantees it isn't lost; the aggregated view updates right after (usually under a few seconds) so the page loads fast even under heavy load.' If they need it instant for the action they just took → use <strong>read-your-own-writes</strong> (read the write model for that user's own action) or an optimistic UI update." },
      { q: "What's the biggest downside of ES when you need to change the structure of an event stored 1M times?",
        a: "Events are <strong>immutable</strong> — you don't rewrite history. You must handle <strong>event/schema versioning</strong>: add a new event version + an 'upcaster' that converts old events to new on replay, and keep code that reads the old version. This long-term burden is why ES is only worth it for domains that truly need an audit trail." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Build a mini 'learning progress' two ways: (A) store progress=% directly; (B) store an event stream (LessonStarted/Completed/QuizPassed), compute % via replay + a denormalized read model updated by events. Compare: code complexity, ability to answer 'what did the student do at 10:05', and read-model lag.</p>`,
    links: [
      { t: "Martin Fowler — CQRS (read the caveats carefully)", u: "martinfowler.com/bliki/CQRS.html" },
      { t: "Microsoft — CQRS pattern", u: "learn.microsoft.com/azure/architecture/patterns/cqrs" },
      { t: "Microsoft — Event Sourcing pattern", u: "learn.microsoft.com/azure/architecture/patterns/event-sourcing" },
      { t: "Martin Fowler — Event Sourcing", u: "martinfowler.com/eaaDev/EventSourcing.html" },
    ],
  },
  "K8S-08": {
    title: "Kubernetes & Autoscaling",
    sum: "Container orchestration, self-healing, HPA/Cluster Autoscaler/KEDA.",
    theory: `<p><b>Kubernetes</b> = a container orchestrator: auto-deploy, auto-restart dead containers, scale replicas by load, rolling updates with no downtime, load distribution.</p>
 <p><b>Minimum concepts:</b> Pod (unit of running) · Deployment (manages replicas) · Service (stable address) · Ingress (entry from outside) · ConfigMap/Secret · <b>HPA</b> (scale pod count by CPU/RAM/custom metric) · liveness/readiness probes · resource requests/limits.</p>
 <p><b>Autoscaling in 3 tiers:</b> HPA (add pods) → Cluster Autoscaler (add nodes/machines) → <b>KEDA</b> (scale by Kafka queue length — great for event-driven).</p>`,
    whenUse: `<p><b>Use</b> when you have many services needing self-healing/autoscale/safe deploys. <b>Not yet</b> for an MVP &lt; tens of thousands of users — a few VMs + Docker Compose + LB is enough and far cheaper in effort.</p>`,
    pros: ["Self-healing + autoscale + rolling deploys, industry standard", "Runs both on-prem and cloud (avoids vendor lock-in)"],
    cons: ["Steep learning curve, complex operations", "Misconfig → wasted money / security holes", "Overkill for small systems"],
    questions: [
      { q: "Distinguish liveness vs readiness probes. What happens if you misconfigure readiness as liveness?",
        a: "<strong>Liveness</strong>: is the pod alive — on failure K8s <strong>restarts</strong> the pod. <strong>Readiness</strong>: is the pod ready for traffic — on failure K8s <strong>stops sending traffic</strong> (no restart). If you put 'not ready yet' logic (e.g. warming up, waiting on a dependency) into <strong>liveness</strong>, the pod gets <strong>restarted repeatedly (crash loop)</strong> instead of just being pulled from the load balancer → instability." },
      { q: "HPA on CPU can't keep up for a Kafka-consuming service. What to use? Why?",
        a: "Use <strong>KEDA</strong> to scale by <strong>queue length (consumer lag)</strong> — a metric that reflects the real backlog and rises before CPU can react. CPU is a lagging, indirect signal for event-driven workloads." },
      { q: "Why must you set resource requests/limits on pods?",
        a: "<strong>Requests</strong> let the scheduler place a pod on a node with enough resources (and are the basis for HPA/bin-packing). <strong>Limits</strong> stop one pod from eating all RAM/CPU and hurting others (noisy neighbor). Without them → nodes get over-subscribed, random OOM kills, unpredictable behavior under load." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Install k3s (lightweight) on one VM. Deploy a service with readiness+liveness probes + resource requests/limits. Enable HPA on CPU. Fire load with k6 and watch pods scale up; kill a pod (kubectl delete pod) and watch it self-heal. Record the HPA reaction time.</p>`,
    links: [
      { t: "Kubernetes — Concepts", u: "kubernetes.io/docs/concepts" },
      { t: "Kubernetes — Horizontal Pod Autoscaler", u: "kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale" },
      { t: "KEDA — event-driven autoscaling", u: "keda.sh/docs/latest/concepts" },
      { t: "k3s — lightweight Kubernetes", u: "docs.k3s.io" },
    ],
  },
  "FLT-09": {
    title: "Fault Tolerance & Resilience",
    sum: "Circuit breaker, retry+backoff, timeout, bulkhead, idempotency, SPOF.",
    theory: `<p>The heart of 'high fault tolerance'. The patterns:</p>
 <ul>
 <li><b>Circuit Breaker</b> (most important): B dies → A stops calling B for a while (opens the breaker), returns a fallback, avoiding cascading failure.</li>
 <li><b>Retry + Exponential Backoff + Jitter</b>: retry but spaced out + randomized, to avoid a 'retry storm'.</li>
 <li><b>Timeout</b>: never wait forever. Every network call must have a timeout.</li>
 <li><b>Bulkhead</b>: isolate resources (a separate pool per downstream) — one sinking compartment doesn't sink the ship.</li>
 <li><b>Graceful degradation</b>: losing Recommendations still shows courses (only the suggestions are missing).</li>
 <li><b>Idempotency</b>: repeating an operation yields the same result → retries are safe (mandatory for payment/enrollment).</li>
 </ul>
 <p><b>Remove SPOFs:</b> every component ≥2 instances across ≥2 AZs; DB with replica + auto-failover; multiple Gateways behind an LB.</p>`,
    whenUse: `<p>Apply to <b>every network call crossing a service boundary</b> (service↔service, service↔DB/third-party). Start with timeout + retry + circuit breaker; add bulkhead when a downstream is often slow.</p>`,
    pros: ["One dead service doesn't take down the whole system", "The system 'fails partially' instead of totally", "Retries are safe thanks to idempotency"],
    cons: ["Adds complexity + config (breaker thresholds, timeouts)", "Wrong retries amplify an incident (retry storm)", "Idempotency must be designed in from the start (hard to add later)"],
    questions: [
      { q: "Media calls a flaky third-party resize API. Which patterns do you combine, and in what order of reasoning?",
        a: "(1) <strong>Timeout</strong> every call (e.g. 2s) — never hang. (2) <strong>Retry + backoff + jitter</strong> for transient errors, capped. (3) <strong>Circuit breaker</strong>: if the third party keeps failing → open the breaker, stop calling for a while, return a <strong>fallback</strong> (original image/placeholder) — <strong>graceful degradation</strong>. (4) <strong>Bulkhead</strong>: a separate pool for resize calls so their slowness doesn't exhaust the whole Media service's threads. Reasoning order: stop hangs → retry with discipline → cut off when failing long → isolate the blast radius." },
      { q: "Why is idempotency mandatory when Enrollment has retries? Give a failure example without it.",
        a: "A retry can resend a request whose first attempt <strong>actually succeeded but the response was lost</strong>. Without idempotency → the student gets <strong>enrolled/charged twice</strong>. Fix: the client sends a unique <strong>idempotency key</strong> per operation; the server records processed keys and returns the prior result on a repeat → retries are safe." },
      { q: "Plain retries can make an incident WORSE. Why? How to fix?",
        a: "When a downstream is overloaded, all clients retry immediately → a <strong>retry storm</strong> doubles/triples load and sinks it deeper (cascading). Fix: <strong>exponential backoff + jitter</strong> (randomized spacing), a retry cap, and a <strong>circuit breaker</strong> to stop entirely while it's failing instead of hammering it." },
    ],
    lab: `<span class="tag">Lab · chaos</span><p style="margin-top:8px">Use resilience4j (Java) or Polly (.NET) to wrap a call to a fake service with random latency/errors (toxiproxy). Enable timeout → retry+jitter → circuit breaker → bulkhead one at a time and watch the caller's p99 + error rate. Then use Chaos Mesh to kill the DB pod and verify auto-failover actually works.</p>`,
    links: [
      { t: "Martin Fowler — Circuit Breaker", u: "martinfowler.com/bliki/CircuitBreaker.html" },
      { t: "AWS Well-Architected — Reliability Pillar", u: "docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html" },
      { t: "Google SRE Book — Handling Overload", u: "sre.google/sre-book/handling-overload" },
      { t: "resilience4j — resilience patterns", u: "resilience4j.readme.io/docs/getting-started" },
    ],
  },
  "INF-10": {
    title: "On-prem vs AWS (Environment setup)",
    sum: "Map components on both sides. Open standards to avoid vendor lock-in.",
    theory: `<p>To run both: design around <b>open standards</b> (K8s, Postgres, Redis, Kafka, S3-API) → the same architecture runs on both, you only swap the 'provider'.</p>
 <p><b>Mapping (on-prem → AWS):</b> self-managed K8s (kubeadm/k3s) → EKS · Nginx/HAProxy → ALB/NLB · Kong → API Gateway · Postgres+Patroni → RDS/Aurora · Redis Sentinel → ElastiCache · <b>MinIO → S3</b> · Nginx cache → CloudFront · Kafka → MSK · OpenSearch → OpenSearch Service · Vault → Secrets Manager · ArgoCD → CodePipeline/ArgoCD.</p>
 <p><b>Trade-off:</b> On-prem — full control, cheap at stable large scale, data at home (education compliance); but you run everything (HA/backup/scale), high upfront capex, hard to burst. AWS — fast scaling, managed handles the hard parts, pay-as-you-go; but expensive at large/stable scale, lock-in, costs easily spiral.</p>`,
    whenUse: `<p>Learning: build <b>on-prem first with Docker + k3s</b> (MinIO for S3, Postgres, Redis, Kafka) to understand the essence, then map to AWS managed services to see <i>what</i> you're paying AWS to handle.</p>`,
    pros: ["Open standards → runs on both, portable", "On-prem cheap at stable scale; AWS fast & elastic"],
    cons: ["On-prem: you carry all ops/HA/security", "AWS: lock-in + hidden costs (egress, requests, cross-AZ)"],
    questions: [
      { q: "MinIO being 'S3-API compatible' — what does that mean for your code? Why does it avoid lock-in?",
        a: "Your code uses the <strong>same S3 SDK/protocol</strong> (same putObject/getObject calls, only the endpoint + credentials change). So you can run <strong>MinIO on-prem for dev/self-host</strong> and <strong>S3 on AWS in production</strong> with <strong>no application code changes</strong> → you're not locked into one storage vendor." },
      { q: "Very spiky load (back-to-school ×20, deep summer drop). On-prem or AWS? A hybrid option?",
        a: "Strongly elastic load favors <strong>AWS</strong> (autoscale, pay-as-you-go — no buying peak hardware that idles all year). A <strong>hybrid</strong> option: run the stable baseline on-prem (cheap) + <strong>burst to cloud</strong> during peaks; or keep stateful parts on-prem and autoscale stateless parts in the cloud." },
      { q: "Two AWS cost categories newbies get burned by?",
        a: "(1) <strong>Data egress</strong> — moving data OUT to the internet (and <strong>cross-AZ traffic</strong>) is billed, and balloons with video/images. (2) <strong>Idle per-request/per-instance costs</strong> — NAT Gateway, idle load balancers, over-provisioned RDS/EBS, unbounded logs/metrics. You must enable cost alerts + periodic review." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Build a 'mini-cloud' on-prem with docker-compose: Postgres + Redis + MinIO + Kafka + one image-upload service using the S3 SDK pointed at MinIO. Then rewrite only the config to point the SDK at real S3 (or localstack). Prove it: swap the infra, not the code. Note the operational differences (backup, HA).</p>`,
    links: [
      { t: "AWS Well-Architected Framework", u: "aws.amazon.com/architecture/well-architected" },
      { t: "MinIO — S3-compatible object storage", u: "min.io/docs/minio/linux/index.html" },
      { t: "AWS — Cost Optimization pillar", u: "docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html" },
    ],
  },
  "TST-11": {
    title: "Load & Concurrency Testing",
    sum: "5 test types, k6/Gatling/Locust, reading p99, finding bottlenecks, chaos.",
    theory: `<p>Simulate many concurrent users to find the <b>breaking point</b> before real users do.</p>
 <p><b>5 test types:</b> <b>Load</b> (expected load, meets SLA?) · <b>Stress</b> (ramp until it breaks — gracefully or total collapse?) · <b>Spike</b> (sudden surge — does autoscale keep up?) · <b>Soak</b> (moderate load for 8–24h — memory leaks, pool exhaustion) · <b>Breakpoint</b> (max users).</p>
 <p><b>Tools (2026):</b> <b>k6</b> (Go, JS scripts, ~30–40k VU/machine, low RAM, CI/CD-friendly — recommended default) · <b>Gatling</b> (JVM, nice reports, 3–5k VU/agent) · <b>Locust</b> (Python, distributed built-in).</p>
 <p><b>Testing for 10M users:</b> you don't need 10M VUs. Compute the <b>target RPS</b> (~6,000 peak), test the <b>user journey</b> (login→view→enroll→upload) hitting that RPS with p99 &lt; SLA, run k6 distributed (k6 Operator on K8s) to reach enough VUs.</p>
 <p><b>Metrics you must read:</b> <b>p50/p95/p99</b> (NOT the average — it lies), throughput (RPS), error rate, saturation (CPU/RAM/pool/DB), and <b>where it breaks</b>.</p>`,
    whenUse: `<p>Run in the final stage before launch and in CI for critical paths. The loop: Test → find the bottleneck → fix (index/cache/replica/pool) → re-test → repeat. This is how you 'prove' the system handles load.</p>`,
    pros: ["Know the real ceiling + how it breaks, scale with confidence", "Find hidden bugs (memory leaks, deadlocks, pool exhaustion)"],
    cons: ["Effort to set up; the test env must resemble production", "Easy to misread (looking at the average instead of p99)"],
    questions: [
      { q: "Why look at p99 not the average latency? Give two systems with the same average but very different p99.",
        a: "The average hides the tail. System A: every request ~100ms → average 100, p99 ~110. System B: 99% at 50ms but 1% at 5,000ms → average still ~100ms but <strong>p99 = 5,000ms</strong>. At 6,000 RPS, '1% slow' = <strong>60 users/second</strong> having a bad experience. p99/p999 is what reflects the worst experience many real users actually get." },
      { q: "You add VUs but RPS doesn't rise and latency shoots up. What does it signal? Where do you suspect the bottleneck?",
        a: "The system is <strong>saturated</strong> — at its throughput ceiling; more load just queues (latency up, RPS flat). Suspect an exhausted resource: <strong>DB connection pool</strong>, a service's CPU, a DB lock, or a slow downstream. Check per-tier saturation metrics (CPU, pool active/queue, DB wait) to find the exact tier, then widen exactly there." },
      { q: "Distinguish spike test and stress test — what real edtech scenario does each guard against?",
        a: "<strong>Stress</strong>: ramp <em>gradually</em> until it breaks → find the ceiling and check whether it fails 'gracefully' (graceful degradation). <strong>Spike</strong>: surge <em>suddenly</em> then drop → check fast reaction. Edtech: spike guards against <strong>opening a hot course / a synchronized exam start</strong> (does autoscale keep up, does the queue overflow); stress guards against <strong>gradual growth hitting the infra ceiling</strong>." },
    ],
    lab: `<span class="tag">Lab · the loop</span><p style="margin-top:8px">Write a k6 scenario simulating the journey: login → list courses → view detail → enroll. Run a load test ramping VUs. Record p95/p99/RPS/error at each level. When p99 breaks: identify the bottleneck (often the DB pool or one endpoint), fix it (add index/cache/widen the pool properly), re-test. Repeat until you hit the target RPS with p99 &lt; SLA. Bonus: run a 2h soak to find memory leaks.</p>`,
    links: [
      { t: "k6 — Test types (load/stress/spike/soak)", u: "grafana.com/docs/k6/latest/testing-guides/test-types" },
      { t: "k6 — docs", u: "grafana.com/docs/k6/latest" },
      { t: "Gatling — documentation", u: "docs.gatling.io" },
      { t: "Locust — documentation", u: "docs.locust.io" },
    ],
  },
  "SYN-A": {
    title: "⚙ Synthesis: Read-Path Design",
    sum: "Combine Cache + Sharding + CQRS into a load-bearing read path for feeds/dashboards.",
    theory: `<p>This node unlocks once you've grasped Cache, Sharding, and CQRS — now you learn to <b>assemble</b> them. The problem: a student 'progress + activity' dashboard, extremely read-heavy, data spread across many tables/shards.</p>
 <p><b>The ideal read path:</b> write to the write model (Postgres, possibly sharded by user_id) → emit an <b>event</b> → update a <b>denormalized read model</b> (CQRS) pre-aggregated per user → serve via a <b>cache</b> (Redis, TTL + jitter) → CDN for static parts. Read one key instead of joining many tables across shards.</p>
 <p>The crux: the read model is organized by <b>exactly how it's read</b> (per-user), so it avoids scatter-gather; the cache absorbs most load; CQRS lets the read model scale independently of writes.</p>`,
    whenUse: `<p>When you have a read-heavy screen aggregating many sources needing &lt;100ms at scale — and you accept eventual consistency of a few seconds.</p>`,
    pros: ["Very fast reads, avoids cross-shard JOINs", "Each tier (read model, cache) scales independently"],
    cons: ["Multiple data copies → sync complexity + eventual consistency", "More components to operate & monitor"],
    questions: [
      { q: "Why does a per-user read model solve sharding's scatter-gather problem?",
        a: "Sharding by user_id makes an aggregate query hit many shards IF read along another dimension. But the read model is <strong>precomputed and stored by the exact read key (per-user)</strong> — so the dashboard needs just <strong>one read by user_id</strong> (single-shard/one cache key), no JOIN, no multi-shard gather. You 'pay' by updating the read model on write (via events), in exchange for cheap reads." },
      { q: "If the event that updates the read model is lost/delayed, the dashboard is wrong. How do you reduce the risk?",
        a: "Use a <strong>durable event bus (Kafka)</strong> + <strong>idempotent</strong> consumers + monitor <strong>consumer lag</strong> (KEDA scales if it falls behind). Have a <strong>reconciliation/rebuild job</strong> for the read model from the write model (CQRS/ES allows replay). Show an 'updated at…' timestamp and allow <strong>read-your-own-writes</strong> for just-taken actions so the experience feels instant." },
    ],
    lab: `<span class="tag">Synthesis lab</span><p style="margin-top:8px">Assemble a mini end-to-end: Postgres (write) → emit an event (Kafka/Redis stream) → a consumer updates a read model (denormalized per-user table) → a read API served via Redis cache. Measure the read-path p99 vs a 'direct JOIN' read. Then stop the consumer for a few seconds to see eventual consistency, and restart to watch it catch up.</p>`,
    links: [
      { t: "Microsoft — Materialized View pattern", u: "learn.microsoft.com/azure/architecture/patterns/materialized-view" },
      { t: "Microsoft — CQRS pattern", u: "learn.microsoft.com/azure/architecture/patterns/cqrs" },
      { t: "AWS — Caching best practices", u: "aws.amazon.com/caching/best-practices" },
    ],
  },
  "SYN-B": {
    title: "⚙ Synthesis: Design for Failure",
    sum: "Combine Resilience + Load testing + Infra into a proven fault-tolerant system.",
    theory: `<p>Unlocks once you have Resilience, Testing, and Infra. The lesson: 'high fault tolerance' is not a belief — it must be <b>proven by experiment</b>.</p>
 <p><b>The closed loop:</b> (1) Design redundancy (multi-AZ, ≥2 instances, DB auto-failover) — remove SPOFs. (2) Wrap every call with timeout/retry/circuit breaker/bulkhead. (3) <b>Load test</b> to the breaking point + <b>chaos test</b> (kill pods/DB, add network latency) to confirm it 'fails partially' not totally. (4) Set <b>SLOs + alerts</b> on p99/error rate/saturation. (5) Runbooks for incidents.</p>`,
    whenUse: `<p>Before every important feature launch, and periodically (chaos game days). This is the 'evidence' that lets you confidently take the system to 10M users.</p>`,
    pros: ["Fault-tolerance confidence based on data, not hope", "Finds hidden weaknesses before users do"],
    cons: ["Effort to build a prod-like env + a game-day culture", "Careless chaos can cause a real incident without guardrails"],
    questions: [
      { q: "'A highly fault-tolerant system' — how do you PROVE it instead of just claiming it?",
        a: "Through <strong>controlled experiments</strong>: chaos engineering deliberately <strong>kills nodes/DB/adds latency</strong> during a load test and <strong>measures</strong> whether the system holds SLA (p99, error rate), whether auto-failover fires, whether cascading occurs. Pass/fail + numbers are the 'evidence'; a pretty diagram on paper is not evidence." },
      { q: "Load tests passed but production still fell over at peak. Three common reasons?",
        a: "(1) <strong>Test env differs from prod</strong> (smaller data, fewer shards, different config) → results aren't representative. (2) <strong>Didn't test the right scenarios</strong> (only one endpoint, skipping the real journey/soak/spike → missed leaks & slow autoscale). (3) <strong>Hidden dependencies</strong> not in the test (third parties, cross-AZ, cold cache during deploy). Lesson: test close to prod + cover all 5 test types." },
    ],
    lab: `<span class="tag">Synthesis lab · game day</span><p style="margin-top:8px">On a k3s cluster: deploy a service + a DB with a replica. Run k6 at ~70% load. During it, use Chaos Mesh: (a) kill an app pod → watch HPA/self-heal; (b) kill the DB primary → watch failover + measure downtime; (c) inject 500ms network latency → watch the circuit breaker + degradation. Record: did SLA hold, how long to recover, what needs patching.</p>`,
    links: [
      { t: "AWS Well-Architected — Reliability Pillar", u: "docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html" },
      { t: "Principles of Chaos Engineering", u: "principlesofchaos.org" },
      { t: "Google SRE Book — Addressing Cascading Failures", u: "sre.google/sre-book/addressing-cascading-failures" },
    ],
  },
  "BOSS": {
    title: "★ BOSS: Design Edtech for 10M users",
    sum: "Capstone: assemble every piece into one defensible architecture.",
    theory: `<p>The final task: design and <b>defend</b> a full edtech architecture for 10M users, using everything you've learned.</p>
 <p><b>MVP + scale requirements:</b> Auth/Identity · Course catalog · Image/video upload · Enrollment · Learning progress · Search · Notifications · Analytics. Split into sensible microservices, each choosing a language + DB with a reason; the read path uses cache/CQRS; which DBs need sharding and by what key; Gateway + resilience + K8s autoscale; runs on-prem and AWS; and a load/chaos test plan to prove it.</p>`,
    whenUse: `<p>When the other 13 nodes are cleared. This trains 'architecture storytelling' — the interview & real-world skill of an SA.</p>`,
    pros: ["Synthesizes all the thinking into one defensible product", "Directly prepares you for System Design interviews & SA roles"],
    cons: ["No single 'right' answer — the score is in the quality of trade-offs", "Requires discipline to write it out + self-critique"],
    questions: [
      { q: "Draw the overall architecture and point out 3 potential SPOFs + how to remove them.",
        a: "No fixed answer — graded on: does each tier (Gateway, DB, cache, message bus) have ≥2 instances/multi-AZ? Does the DB have failover? Does a dead cache degrade gracefully? Can you explain <strong>why</strong> for each choice, not just draw boxes. Three commonly-missed SPOFs: <strong>a single DB primary</strong> (→ replica+failover), <strong>a single Gateway/LB</strong> (→ multiple across AZs), <strong>a single Kafka broker / single Redis node</strong> (→ cluster/replica)." },
      { q: "Limited budget: what are 3 things you do NOT do on day one (anti over-engineering)?",
        a: "Graded on FND-00 thinking. Strong candidates defer: <strong>sharding</strong> (use Postgres + replica + partition first), <strong>service mesh</strong> (a Gateway + resilience libs suffice), <strong>system-wide event sourcing</strong> (ES only for payments/certificates), <strong>5-language polyglot</strong> (consolidate to 1–2). The point: the architecture must be <strong>evolvable</strong>, not pre-complicated." },
      { q: "How do you prove to your boss the system survives back-to-school day (spike ×20)?",
        a: "Show <strong>data from spike + chaos tests</strong>: RPS/p99/error charts under a sudden ×20 load, autoscale reaction time, and the result of killing a node mid-peak (did SLA hold). Plus a contingency plan: pre-scale before the event, a load-absorbing queue, degradation for secondary features. Experimental evidence, not a promise." },
    ],
    lab: `<span class="tag">Capstone</span><p style="margin-top:8px">Write a 3–5 page architecture doc for 10M-user edtech: (1) overall diagram + service list (language + DB + reason); (2) read path & write path for 'view course' and 'enroll'; (3) a sizing table (RPS→instances/pool, from CAP-03); (4) DB strategy (when to shard, which key); (5) resilience + SPOF removal; (6) on-prem↔AWS mapping; (7) a load+chaos test plan with pass/fail metrics. Then play interviewer and challenge each choice.</p>`,
    links: [
      { t: "System Design Primer", u: "github.com/donnemartin/system-design-primer" },
      { t: "AWS Well-Architected Framework", u: "aws.amazon.com/architecture/well-architected" },
      { t: "Microsoft — Azure Architecture Center (patterns)", u: "learn.microsoft.com/azure/architecture/patterns" },
    ],
  },
};

export const NODES_EN: SkillNode[] = NODES.map((n) => ({ ...n, ...EN[n.id] }));

export const TIERS_EN: Tier[] = [
  { id: 0, n: "TIER 0", t: "Mindset foundations", sub: "Start here" },
  { id: 1, n: "TIER 1", t: "Building blocks", sub: "Language · Data · Sizing" },
  { id: 2, n: "TIER 2", t: "Scaling data", sub: "Cache · Sharding" },
  { id: 3, n: "TIER 3", t: "Architecture patterns", sub: "Gateway · CQRS · K8s · Resilience" },
  { id: 4, n: "TIER 4", t: "Operations & Testing", sub: "Infra · Load test" },
  { id: 5, n: "TIER 5", t: "Synthesis & Boss", sub: "Assemble everything" },
];

export const RANKS_EN: [number, string][] = [
  [0, "Junior Architect"],
  [300, "Mid Architect"],
  [700, "Senior Architect"],
  [1200, "Staff Architect"],
  [1800, "Principal Architect"],
];
