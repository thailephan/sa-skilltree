// Nội dung skill-tree Solution Architect. Tách khỏi UI để dễ bảo trì.

export type Tier = { id: number; n: string; t: string; sub: string };
export type QA = { q: string; a: string };
export type NodeLink = { t: string; u: string };
export type SkillNode = {
  id: string;
  tier: number;
  xp: number;
  prereq: string[];
  title: string;
  sum: string;
  theory: string;
  whenUse: string;
  pros: string[];
  cons: string[];
  questions: QA[];
  lab: string;
  links: NodeLink[];
  calc?: boolean;
  synth?: boolean;
  boss?: boolean;
};

export const TIERS: Tier[] = [
  { id: 0, n: "TẦNG 0", t: "Nền tảng tư duy", sub: "Bắt đầu tại đây" },
  { id: 1, n: "TẦNG 1", t: "Khối xây dựng", sub: "Ngôn ngữ · Dữ liệu · Sizing" },
  { id: 2, n: "TẦNG 2", t: "Mở rộng dữ liệu", sub: "Cache · Sharding" },
  { id: 3, n: "TẦNG 3", t: "Mẫu kiến trúc", sub: "Gateway · CQRS · K8s · Resilience" },
  { id: 4, n: "TẦNG 4", t: "Vận hành & Kiểm thử", sub: "Hạ tầng · Load test" },
  { id: 5, n: "TẦNG 5", t: "Tổng hợp & Boss", sub: "Lắp ghép mọi thứ" },
];

export const RANKS: [number, string][] = [
  [0, "Junior Architect"],
  [300, "Mid Architect"],
  [700, "Senior Architect"],
  [1200, "Staff Architect"],
  [1800, "Principal Architect"],
];

export const NODES: SkillNode[] = [
  {
    id: "FND-00", tier: 0, xp: 100, prereq: [],
    title: "Tư duy SA & Trade-off",
    sum: "CAP/PACELC, latency numbers, ước lượng tải back-of-envelope.",
    theory: `<p>Một Solution Architect không phải người biết nhiều công cụ nhất, mà là người <b>ra quyết định đánh đổi đúng trong ràng buộc cụ thể</b>. 4 câu hỏi gốc cho mọi quyết định: (1) Ràng buộc là gì? (số user, RPS, budget, team). (2) Đánh đổi gì lấy gì? (3) Cái này hỏng thế nào? (4) Khi nào tôi <i>chưa</i> cần nó?</p>
 <p><b>CAP:</b> khi mạng phân vùng, chỉ chọn được Consistency <i>hoặc</i> Availability. <b>PACELC</b> thực dụng hơn: nếu Partition → A hay C; ngược lại (Else) → Latency hay Consistency. Đây là gốc rễ để chọn DB khác nhau cho data khác nhau (ví tiền chọn C; số người xem online chọn A/Latency).</p>
 <p><b>Latency numbers cần thuộc:</b> RAM ~100ns · Redis cùng DC ~0.5ms · SSD ~0.1ms · round-trip trong DC ~0.5ms · xuyên lục địa ~150ms · query có index 1–10ms. Mọi tối ưu = tránh thao tác đắt, dồn vào thao tác rẻ.</p>
 <p><b>Ước lượng tải:</b> 10M user × 10% DAU = 1M active × 50 req/ngày = 50M/ngày ≈ 580 RPS trung bình × peak 5–10× ≈ <b>3.000–6.000 RPS peak</b>. Đọc:ghi ~100:1 → tối ưu đọc là ưu tiên số 1.</p>`,
    whenUse: `<p>Áp dụng <b>trước mọi quyết định</b> khác trong cây này. Không có con số ràng buộc thì không có kiến trúc — chỉ có ý kiến.</p>`,
    pros: ["Ngăn over-engineering (thiết kế phức tạp khi chưa cần)", "Mọi lựa chọn sau đều có cơ sở đo được", "Giúp phản biện đề xuất của người khác"],
    cons: ["Đòi tư duy phản trực giác (chấp nhận trade-off, không có 'best')", "Cần dữ liệu thật; ước lượng sai → thiết kế lệch"],
    questions: [
      { q: "Bảng 'lịch sử điểm bài kiểm tra' nên nghiêng C hay A? Còn 'gợi ý khóa học có thể thích'?",
        a: "<strong>Điểm kiểm tra → C (Consistency).</strong> Sai/mất điểm là không chấp nhận được, có tính pháp lý/kết quả học tập. Chấp nhận trả lời chậm hơn hoặc lỗi tạm thời còn hơn trả sai. <strong>Gợi ý khóa học → A/Latency.</strong> Sai vài giây, hiện danh sách hơi cũ hoàn toàn ổn; ưu tiên luôn phản hồi nhanh. Đây chính là lý do hai loại data này có thể nằm ở hai loại store khác nhau." },
      { q: "2M DAU, 30 req/ngày/user, peak gấp 8. Peak RPS ≈ ?",
        a: "2.000.000 × 30 = 60M req/ngày ÷ 86.400s ≈ <strong>~695 RPS trung bình</strong> × 8 ≈ <strong>~5.560 RPS peak</strong>. Kết luận: con số này một cụm service viết tốt + cache + read-replica gánh được — 'nhiều triệu user' nghe to nhưng RPS mới định hình thiết kế." },
      { q: "Một trường hợp 'thêm cache' lại là quyết định SAI?",
        a: "Khi dữ liệu <strong>thay đổi liên tục và phải luôn đúng</strong> (số dư ví, tồn kho ghế thi) — cache sẽ trả dữ liệu cũ gây sai nghiệp vụ. Hoặc khi <strong>tỉ lệ cache hit thấp</strong> (mỗi key hầu như chỉ đọc 1 lần) — cache chỉ thêm tầng phức tạp mà không giảm tải. Cache sai còn tệ hơn không cache." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Viết 1 trang 'napkin math' cho chính app edtech của bạn: giả định DAU, số request/user/ngày, tỉ lệ đọc:ghi, peak factor → ra RPS trung bình và peak. Với mỗi trong 6 bảng dữ liệu quan trọng, ghi 'C hay A/Latency?' kèm 1 câu lý do.</p>`,
    links: [
      { t: "System Design Primer (repo kinh điển)", u: "github.com/donnemartin/system-design-primer" },
      { t: "Latency numbers every programmer should know", u: "gist.github.com/jboner/2841832" },
      { t: "CAP theorem — IBM", u: "ibm.com/topics/cap-theorem" },
      { t: "Notes on distributed systems for young bloods", u: "somethingsimilar.com/2013/01/14/notes-on-distributed-systems-for-young-bloods" },
    ],
  },
  {
    id: "LNG-01", tier: 1, xp: 100, prereq: ["FND-00"],
    title: "Ngôn ngữ theo từng service",
    sum: "Polyglot: chọn ngôn ngữ theo CPU-bound vs I/O-bound, không theo 'hot'.",
    theory: `<p>Trong microservices, mỗi service có thể dùng ngôn ngữ phù hợp nhất (polyglot). Trục quyết định <b>không phải 'ngôn ngữ nào hot'</b> mà là đặc tính tải: <b>CPU-bound</b> (tính toán nặng → Go/Rust/Java/C#) vs <b>I/O-bound</b> (nhiều kết nối chờ mạng/đĩa → Go/Node concurrency rẻ).</p>
 <p>Đề xuất edtech: <b>Auth/Identity</b> → C#/.NET hoặc Java (ecosystem identity chín, type-safe). <b>Media/Upload ảnh</b> → Go (goroutine nhẹ, streaming tốt, RAM thấp). <b>Realtime/Enrollment</b> → NestJS/Node (event-loop hợp I/O). <b>Analytics/ML</b> → Python. <b>Catalog</b> → Java/Go.</p>`,
    whenUse: `<p><b>Nên polyglot</b> khi service có đặc tính rất khác biệt VÀ team đủ lớn (>10). <b>KHÔNG</b> khi team nhỏ — chọn 1–2 ngôn ngữ chủ đạo. Polyglot với team nhỏ = tự giết mình khi on-call 3h sáng.</p>`,
    pros: ["Tối ưu đúng công cụ cho đúng bài toán", "Tuyển được từ nhiều nguồn nhân lực", "Service độc lập công nghệ, thay thế dễ"],
    cons: ["Chi phí vận hành nhân lên theo mỗi ngôn ngữ", "Khó chia sẻ code chung (phải làm contract qua API/proto)", "On-call & debug xuyên ngôn ngữ khó"],
    questions: [
      { q: "Service 'chấm bài chạy code học viên trong sandbox' — CPU hay I/O-bound? Chọn ngôn ngữ gì?",
        a: "Chủ yếu <strong>CPU-bound</strong> (biên dịch/chạy code, giới hạn tài nguyên). Cần ngôn ngữ compiled kiểm soát tài nguyên tốt + cô lập mạnh: <strong>Go hoặc Rust</strong> cho lớp điều phối sandbox, chạy code trong container/gVisor/Firecracker. Điểm mấu chốt không phải ngôn ngữ mà là <strong>cô lập + giới hạn CPU/RAM/timeout</strong> cho mỗi lần chấm." },
      { q: "Team 6 người, có nên dùng 5 ngôn ngữ như bảng đề xuất? Phản biện.",
        a: "<strong>Không.</strong> 6 người không thể duy trì chuyên môn sâu + on-call cho 5 runtime, 5 bộ thư viện bảo mật, 5 pipeline. Nên gom về <strong>1–2 ngôn ngữ</strong> (vd Go cho phần lớn + một ngôn ngữ ecosystem giàu như .NET/Java cho Auth). Polyglot là tối ưu của tổ chức lớn; với team nhỏ, 'boring & đồng nhất' thắng." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Lập bảng cho 6 service edtech của bạn: cột [Service | CPU/IO-bound | Ngôn ngữ chọn | Lý do 1 câu | Nếu team chỉ 5 người thì gộp về ngôn ngữ nào]. Mục tiêu: luyện tư duy phân loại tải, không phải chạy theo trend.</p>`,
    links: [
      { t: "Martin Fowler — Polyglot Programming", u: "martinfowler.com/bliki/PolyglotProgramming.html" },
      { t: "microservices.io — pattern tổng quan", u: "microservices.io/patterns/microservices.html" },
      { t: "Go — vì sao hợp dịch vụ mạng/concurrency", u: "go.dev/doc/effective_go" },
    ],
  },
  {
    id: "DB-02", tier: 1, xp: 100, prereq: ["FND-00"],
    title: "Chọn Database (Polyglot Persistence)",
    sum: "Không có 1 DB cho mọi thứ. Chọn theo hình dạng data + access pattern.",
    theory: `<p>Chọn DB theo <b>hình dạng dữ liệu và cách truy vấn</b>, không theo thói quen.</p>
 <ul>
 <li><b>PostgreSQL</b> — user, RBAC, khóa học, đăng ký: quan hệ, cần ACID + join. Mặc định nên bắt đầu ở đây.</li>
 <li><b>Object storage (S3/MinIO)</b> — ảnh/video: không nhét blob vào DB, DB chỉ lưu URL.</li>
 <li><b>Redis</b> — session, cache, rate-limit, leaderboard: key-value, TTL, &lt;1ms.</li>
 <li><b>OpenSearch/Elasticsearch</b> — tìm kiếm khóa học full-text + facet.</li>
 <li><b>ClickHouse</b> (columnar) — analytics học tập, dashboard: aggregate hàng tỷ dòng.</li>
 <li><b>Cassandra/Scylla</b> (wide-column) — feed hoạt động, tiến độ ghi cực nhiều, phân tán.</li>
 </ul>
 <p><b>Quy tắc vàng:</b> bắt đầu bằng Postgres cho MỌI thứ (nó làm được cả JSONB, full-text, geo, queue ở mức vừa). Chỉ tách sang DB chuyên dụng khi có <b>bằng chứng đo được</b> (p99 &gt; SLA, DB CPU bão hòa dù đã index + cache).</p>`,
    whenUse: `<p>Chuyển sang polyglot persistence khi một loại query thực sự 'đau' trên Postgres. Không chuyển vì trend.</p>`,
    pros: ["Mỗi loại query nhanh tối ưu (search, analytics, kv)", "Scale từng loại workload độc lập"],
    cons: ["Nhất quán giữa các DB thành bài toán khó (cần event/CDC đồng bộ)", "Backup/vận hành/monitor phức tạp gấp bội", "Nhiều nơi lưu 'sự thật' → dễ lệch dữ liệu"],
    questions: [
      { q: "'Gợi ý 10 khóa liên quan' và 'tìm kiếm theo từ khóa + lọc giá' — dùng DB nào? Tách hay gộp?",
        a: "<strong>Tìm kiếm + lọc facet → OpenSearch/Elasticsearch</strong> (inverted index, filter nhanh). <strong>Gợi ý liên quan</strong> ban đầu có thể làm bằng Postgres (query theo tag/category) hoặc precompute vào Redis; khi cần theo hành vi/đồ thị thì thêm graph/vector store. <strong>Ban đầu nên gộp trên Postgres</strong> để đơn giản, chỉ tách OpenSearch khi search thật sự chậm." },
      { q: "Vì sao KHÔNG lưu ảnh trực tiếp trong Postgres dù có kiểu bytea?",
        a: "Blob lớn làm <strong>phình DB, chậm backup/replication, cạn buffer cache</strong> (đẩy data nóng ra khỏi RAM), và Postgres không phải CDN — không phục vụ file tốt/rẻ. Đúng cách: lưu file ở <strong>object storage</strong>, Postgres chỉ giữ metadata + URL, phục vụ qua CDN." },
      { q: "Junior đề xuất 'dùng MongoDB cho tất cả vì linh hoạt schema'. Phản biện.",
        a: "Linh hoạt schema không miễn phí: bạn <strong>mất ràng buộc quan hệ + JOIN + giao dịch đa bảng mạnh</strong> mà edtech cần (user↔enrollment↔course↔payment). Chọn DB theo <strong>access pattern</strong>, không theo 'linh hoạt': dữ liệu quan hệ + cần nhất quán → Postgres; chỉ dùng document store cho phần thực sự phi cấu trúc/đọc theo document." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Vẽ 'data map' edtech: liệt kê 8–10 loại dữ liệu, mỗi loại ghi [access pattern chính | DB chọn | vì sao]. Sau đó tự thách thức: cái nào thực ra Postgres làm được tới 1M user, cái nào bắt buộc tách? Chỉ đánh dấu 'tách' khi có lý do đo được.</p>`,
    links: [
      { t: "Martin Fowler — Polyglot Persistence", u: "martinfowler.com/bliki/PolyglotPersistence.html" },
      { t: "AWS — Purpose-built databases", u: "docs.aws.amazon.com/whitepapers/latest/aws-overview/database.html" },
      { t: "Things you should know about databases", u: "architecturenotes.co/p/things-you-should-know-about-databases" },
    ],
  },
  {
    id: "CAP-03", tier: 1, xp: 120, prereq: ["FND-00"], calc: true,
    title: "Capacity Planning & Sizing",
    sum: "Little's Law + pool sizing: tính cấu hình để KHÔNG thiếu khi production.",
    theory: `<p>Đây là cách trả lời 'chọn cấu hình bao nhiêu để không thiếu khi chạy thật'. Ba trụ:</p>
 <p><b>1) Little's Law:</b> <code>L = λ × W</code>. Số request đang xử lý đồng thời (L) = tốc độ đến (λ, req/s) × thời gian xử lý mỗi request (W, giây). VD 500 RPS × 0.2s = <b>100 request in-flight</b> cùng lúc. Đây là số 'chỗ ngồi' tối thiểu hệ phải có.</p>
 <p><b>2) Sizing thread/connection pool:</b> hai công thức hay dùng:</p>
 <ul>
 <li>Thread cho I/O-bound: <code>Nthreads = Ncpu × Ucpu × (1 + W/C)</code> — Ncpu số core, Ucpu utilization mục tiêu (0.8), W thời gian chờ (I/O), C thời gian tính CPU.</li>
 <li>DB connection pool (HikariCP): nhỏ hơn bạn tưởng. <code>pool ≈ (core × 2) + số đĩa hiệu dụng</code>. Pool DB quá lớn làm CHẬM đi (tranh chấp, context switch). Dùng <b>PgBouncer</b> gộp connection thay vì tăng pool.</li>
 </ul>
 <p><b>3) Headroom & dự phòng (quan trọng nhất để 'không thiếu'):</b></p>
 <ul>
 <li>Chạy ở <b>60–70% utilization</b>, không bao giờ 100%. Theo Kingman, latency <b>tăng phi tuyến</b> khi vượt ~70–80% → hàng đợi bùng nổ.</li>
 <li>Dự phòng <b>N+1 / N+2</b>: mất 1 node không được sập (chịu lỗi + rolling deploy).</li>
 <li>Nhân theo <b>peak factor</b> (giờ vàng học tối) chứ không theo trung bình.</li>
 <li>Cộng <b>growth buffer</b> (vd đủ cho 6–12 tháng tăng trưởng).</li>
 <li>Đo cả <b>saturation</b> của tài nguyên ẩn: connection pool, file descriptor, băng thông, IOPS — thứ hay 'thiếu' trước cả CPU.</li>
 </ul>`,
    whenUse: `<p>Làm sizing <b>trước mỗi lần chọn instance/số replica/pool</b>, và làm lại sau mỗi đợt load test. Đây là cầu nối giữa 'ước lượng tải' (FND-00) và cấu hình thật.</p>`,
    pros: ["Chọn cấu hình có cơ sở, không đoán mò", "Tránh vừa lãng phí tiền vừa thiếu tài nguyên", "Chỉ ra bottleneck ẩn (pool, IOPS) trước khi user gặp"],
    cons: ["Cần số liệu W (latency) thật — phải đo, không đoán", "Mô hình lý tưởng; hệ thật có biến động → phải cộng headroom", "Sai giả định peak factor → vẫn thiếu"],
    questions: [
      { q: "Service 3.000 RPS, p95 latency 150ms. Bao nhiêu request in-flight? Vì sao KHÔNG set pool đúng bằng số đó?",
        a: "L = 3000 × 0.15 = <strong>450 in-flight</strong>. Không set pool = 450 vì đó là mức <strong>không còn headroom</strong>: chỉ cần một spike latency nhỏ là hàng đợi tràn, request xếp hàng, p99 nổ. Set pool/worker để chạy ~<strong>60–70%</strong> (vd capacity ~640–750) và có N+1 node dự phòng." },
      { q: "Tăng DB connection pool từ 50 → 500 mà throughput lại giảm, latency tăng. Vì sao?",
        a: "DB chỉ chạy song song hiệu quả tới một mức (giới hạn bởi core/đĩa). Pool quá lớn gây <strong>tranh chấp lock, context-switch, cạn RAM DB</strong> → mỗi query chậm hơn. Đúng hướng: pool nhỏ (theo công thức HikariCP) + <strong>PgBouncer</strong> gộp hàng nghìn client vào ít connection thật. 'Thiếu' ở đây không phải thiếu connection, mà thiếu năng lực thật của DB." },
      { q: "Vì sao nhắm 100% CPU khi sizing là sai lầm?",
        a: "Theo lý thuyết hàng đợi (Kingman), khi utilization tiến tới 100%, <strong>thời gian chờ tiến tới vô hạn</strong> — latency tăng phi tuyến. Ở 70% mọi thứ mượt; ở 95% một biến động nhỏ làm p99 gấp nhiều lần. Luôn chừa headroom cho spike, GC, deploy, và mất node." },
    ],
    lab: `<span class="tag">Lab · dùng máy tính bên dưới</span><p style="margin-top:8px">Nhập RPS peak (từ FND-00) + p95 latency đo được vào calculator. Đọc số in-flight, số worker/pool khuyến nghị (đã cộng headroom 70%), và số node N+1. Sau đó thử tăng latency 2× (mô phỏng DB chậm) và xem nhu cầu cấu hình nhảy thế nào — đây là lý do phải load test trước khi chốt cấu hình.</p>`,
    links: [
      { t: "HikariCP — About Pool Sizing (bắt buộc đọc)", u: "github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing" },
      { t: "Connection Pool Sizing with Little's Law", u: "michal-drozd.com/en/blog/connection-pool-littles-law" },
      { t: "Vlad Mihalcea — The simple scalability equation", u: "vladmihalcea.com/the-simple-scalability-equation" },
      { t: "Google SRE Workbook — Implementing SLOs", u: "sre.google/workbook/implementing-slos" },
    ],
  },
  {
    id: "CSH-04", tier: 2, xp: 100, prereq: ["DB-02"],
    title: "Caching & Redis",
    sum: "Các tầng cache, cache-aside, invalidation, stampede, hot key.",
    theory: `<p>Cache = lưu bản sao ở nơi truy cập nhanh hơn để tránh làm lại việc đắt. <b>Các tầng:</b> Browser → CDN (ảnh/static) → API Gateway → Application (Redis) → DB buffer.</p>
 <p><b>Pattern:</b> <b>Cache-aside</b> (phổ biến nhất): đọc cache → miss thì đọc DB → ghi lại cache. <b>Write-through</b>: ghi DB + cache cùng lúc (cache luôn mới, ghi chậm hơn). <b>Write-behind</b>: ghi cache trước, DB sau (nhanh, rủi ro mất data).</p>
 <p><b>Ba vấn đề kinh điển:</b> (1) <b>Invalidation</b> — data đổi thì cache cũ sai; giải bằng TTL ngắn + bắn event xóa cache khi ghi. (2) <b>Stampede/thundering herd</b> — nhiều key hết hạn đồng loạt → nghìn request đập DB; giải bằng TTL + jitter, và lock 'chỉ 1 request đi tính lại'. (3) <b>Hot key</b> — 1 key quá nóng (khóa viral) quá tải 1 node; giải bằng nhân bản key + local cache.</p>
 <p>Redis còn làm: session, rate-limiter (token bucket), distributed lock, leaderboard (sorted set), pub/sub, queue nhẹ.</p>`,
    whenUse: `<p><b>Dùng</b> khi đọc-nhiều, data đọc lại thường xuyên, chấp nhận trễ nhất quán vài giây. <b>KHÔNG</b> khi data phải luôn đúng tức thì (số dư) hoặc cache hit thấp.</p>`,
    pros: ["Giảm tải DB 10–100×, giảm latency mạnh", "Redis đa năng (lock, rate-limit, session, leaderboard)"],
    cons: ["Thêm điểm hỏng + phải nghĩ về invalidation (rất khó)", "Data có thể cũ (stale)", "Hot key / stampede nếu làm ẩu; cache sai còn tệ hơn không cache"],
    questions: [
      { q: "Trang khóa 'hot' 100k view/phút đang giết DB. Cache thế nào? TTL? Chống stampede?",
        a: "Cache-aside toàn bộ payload trang khóa vào Redis, TTL vừa phải (vd 60–300s) + <strong>jitter</strong> (±20%) để không hết hạn đồng loạt. Chống stampede bằng <strong>single-flight lock</strong> (chỉ 1 request rebuild, số còn lại chờ/đọc bản cũ) hoặc <strong>stale-while-revalidate</strong>. Nếu vẫn nóng 1 key → thêm <strong>local in-process cache</strong> ở app (vài giây) để chặn phần lớn ngay tại pod." },
      { q: "Giáo viên sửa mô tả nhưng học viên thấy bản cũ 5 phút — bug hay trade-off? Giải thích PM thế nào?",
        a: "Là <strong>trade-off của TTL</strong>, không phải bug. Giải thích: ta đổi 'tuyệt đối mới' lấy 'tải thấp + nhanh'. Khắc phục theo nhu cầu: (a) chấp nhận độ trễ và giảm TTL; (b) <strong>chủ động xóa/ghi lại cache ngay khi save</strong> (event-driven invalidation) để mới gần như tức thì; (c) versioned key. Chọn (b) nếu PM cần thấy ngay sau khi sửa." },
      { q: "Dùng Redis làm cache khác gì dùng làm database chính? Rủi ro cái sau?",
        a: "Cache = <strong>nguồn phụ, mất được</strong> (rebuild từ DB gốc). DB chính = nguồn sự thật, mất là mất data. Rủi ro khi coi Redis là DB chính: mặc định Redis ưu tiên tốc độ hơn bền vững — cần cấu hình AOF/replica cẩn thận, và vẫn có rủi ro mất vài giây ghi khi sự cố. Chỉ làm vậy cho data chịu được mất (session, đếm tạm)." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Dựng Redis (Docker) + một API đọc khóa học. Đo p99 khi (1) không cache, (2) cache-aside. Rồi mô phỏng stampede: cho 500 client cùng gọi lúc key vừa hết hạn — quan sát DB spike. Thêm jitter + single-flight lock và đo lại. Ghi lại con số trước/sau.</p>`,
    links: [
      { t: "AWS — Caching best practices", u: "aws.amazon.com/caching/best-practices" },
      { t: "Cache stampede (Wikipedia)", u: "en.wikipedia.org/wiki/Cache_stampede" },
      { t: "Cloudflare — What is caching", u: "cloudflare.com/learning/cdn/what-is-caching" },
      { t: "Redis docs — patterns", u: "redis.io/docs/latest/develop/use/patterns" },
    ],
  },
  {
    id: "SHD-05", tier: 2, xp: 120, prereq: ["DB-02", "CAP-03"],
    title: "Partitioning vs Sharding",
    sum: "Chia trong 1 server vs chia ra nhiều server. Shard key sinh tử.",
    theory: `<p><b>Partitioning</b> = chia 1 bảng lớn thành nhiều mảnh <b>trong cùng 1 server DB</b>. Mục tiêu: query chỉ quét mảnh liên quan, bảo trì dễ (xóa data cũ = drop 1 partition). VD partition <code>activity_log</code> theo tháng.</p>
 <p><b>Sharding</b> = chia data ra <b>nhiều server DB khác nhau</b>. Mục tiêu: vượt giới hạn 1 máy (dung lượng/RPS ghi). Đây là 'vũ khí cuối'.</p>
 <p><b>Shard key — quyết định sinh tử:</b> phải cardinality cao + phân bố đều (tránh 'hot shard'), và khớp access pattern phổ biến nhất (tránh scatter-gather phải hỏi mọi shard). Edtech: shard theo <code>tenant_id/school_id</code> hoặc <code>user_id</code>. TRÁNH shard theo <code>created_date</code> (data mới dồn hết 1 shard).</p>
 <p><b>Công cụ (2026):</b> đừng tự viết sharding tay. Dùng <b>Citus</b> (Postgres), <b>Vitess</b> (MySQL), hoặc DB distributed-sẵn (<b>CockroachDB/YugabyteDB/Spanner</b>) — tự lo resharding.</p>
 <p><b>Thứ tự leo thang scale DB (học thuộc):</b> Index → Cache → Read-replica → Vertical scale → Partition → Sharding.</p>`,
    whenUse: `<p><b>Partition</b> khi bảng vài chục triệu dòng, query lọc theo 1 chiều (thời gian/region). <b>Shard</b> chỉ khi 1 server (dù to nhất + có replica) vẫn không gánh nổi ghi/dung lượng. Cạn mọi cách đơn giản trước đã.</p>`,
    pros: ["Sharding: scale ghi/dung lượng gần như vô hạn", "Partition: query nhanh + bảo trì/xóa data dễ"],
    cons: ["Sharding: mất JOIN & transaction xuyên shard", "Resharding đau, ops phức tạp", "Chọn sai shard key → hot shard hoặc scatter-gather khắp nơi"],
    questions: [
      { q: "2 tỷ dòng enrollment, ghi 5.000/s, đã có index+cache+replica. Partition hay shard? Shard key nào?",
        a: "Read-replica chỉ giúp <strong>đọc</strong>; nghẽn ở đây là <strong>ghi 5.000/s + dung lượng 2 tỷ dòng</strong> → cần <strong>sharding</strong> (kết hợp partition trong mỗi shard cho bảo trì). Shard key: <strong>tenant_id/school_id</strong> nếu multi-tenant (giữ data 1 trường cùng shard, hợp truy vấn theo trường), hoặc <strong>user_id</strong> nếu B2C. Tránh created_date." },
      { q: "Vì sao shard theo created_date gây hot shard? Mô tả.",
        a: "Mọi ghi MỚI đều có ngày hiện tại → tất cả rơi vào <strong>đúng shard chứa khoảng thời gian hiện tại</strong>. Shard đó nhận 100% write traffic trong khi các shard cũ 'ngủ'. Kết quả: 1 shard quá tải, phần còn lại lãng phí — mất mục đích của sharding (phân bố đều)." },
      { q: "Sau khi shard theo user_id, 'admin xem tất cả đăng ký của 1 trường' bị chậm. Vì sao? Xử lý?",
        a: "Học viên 1 trường nằm rải khắp các shard theo user_id → query phải <strong>scatter-gather</strong> mọi shard rồi gộp → chậm. Xử lý: (a) đổi/ bổ sung shard key theo school_id nếu truy vấn theo trường là phổ biến; (b) duy trì một <strong>read model/CQRS</strong> tổng hợp theo trường (materialized); (c) chạy query này ở tầng analytics (ClickHouse) thay vì OLTP." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Dựng Citus (Docker) với 2 worker. Tạo bảng enrollment distributed theo user_id, đổ ~10M dòng giả. Chạy: (1) query theo user_id (single-shard) vs (2) query 'đếm theo school' (scatter-gather) — đo chênh lệch. Thử đổi distribution column sang school_id và so sánh. Rút ra: shard key = access pattern.</p>`,
    links: [
      { t: "Citus — Understanding partitioning vs sharding", u: "citusdata.com/blog/2023/08/04/understanding-partitioning-and-sharding-in-postgres-and-citus" },
      { t: "Vitess — Sharding concepts", u: "vitess.io/docs/concepts/shard" },
      { t: "Database Sharding strategies 2026", u: "zylos.ai/research/2026-02-15-database-sharding" },
    ],
  },
  {
    id: "GTW-06", tier: 3, xp: 100, prereq: ["LNG-01"],
    title: "API Gateway & Ingress",
    sum: "Cửa ngõ: routing, auth, rate-limit, SSL. Phân biệt Gateway/Ingress/Mesh.",
    theory: `<p><b>API Gateway</b> = cửa ngõ duy nhất mọi request đi vào, làm các việc <b>ngang</b> (cross-cutting) để service con khỏi lặp lại: routing, verify token, rate-limit, SSL termination, request aggregation, logging.</p>
 <p><b>Phân biệt (hay nhầm):</b> <b>API Gateway</b> (Kong/APISIX/AWS API GW) = tầng logic API. <b>Ingress Controller/LB</b> (Nginx/Traefik/Envoy) = tầng vào của K8s, định tuyến L7. <b>Service Mesh</b> (Istio/Linkerd) = quản lý giao tiếp <b>service↔service nội bộ</b> (mTLS, retry, traffic split). Gateway = bắc–nam (vào từ ngoài); Mesh = đông–tây (nội bộ).</p>`,
    whenUse: `<p>Luôn cần một Gateway/Ingress khi có &gt;1 service. Chỉ thêm <b>Service Mesh</b> khi có &gt;10–15 service và cần mTLS + retry/observability đồng bộ — Istio nổi tiếng phức tạp, đừng thêm sớm.</p>`,
    pros: ["Tập trung security/observability/rate-limit", "Service con nhẹ đi, đổi routing không đụng service"],
    cons: ["Điểm nghẽn & điểm hỏng trung tâm (phải HA + scale kỹ)", "Thêm 1 hop latency", "Cấu hình sai = sập cả hệ"],
    questions: [
      { q: "Kiểm token đăng nhập nên đặt ở Gateway hay từng service? Ưu nhược?",
        a: "Thường <strong>xác thực (authentication: token hợp lệ không) ở Gateway</strong> — chặn sớm, service con khỏi lặp. Nhưng <strong>phân quyền (authorization: user này được làm gì với resource này) nên ở service</strong> vì chỉ service hiểu ngữ cảnh nghiệp vụ. Đặt hết ở Gateway → Gateway phình logic nghiệp vụ; đặt hết ở service → lặp code + lộ traffic chưa xác thực vào trong." },
      { q: "Gateway là single point of failure. Làm gì để nó không làm sập cả hệ?",
        a: "Chạy <strong>nhiều bản Gateway (stateless) sau một LB</strong>, trải trên ≥2 AZ; autoscale; health check + tự thay bản chết. Cấu hình <strong>timeout, rate-limit, circuit breaker</strong> ở Gateway để một downstream chậm không kéo sập; rollout cấu hình theo canary để tránh cấu hình sai làm sập toàn bộ." },
      { q: "Một câu: Gateway khác Service Mesh ở đâu?",
        a: "<strong>Gateway xử lý traffic đi VÀO hệ từ bên ngoài (bắc–nam); Service Mesh xử lý traffic GIỮA các service bên trong (đông–tây).</strong>" },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Dựng Kong hoặc APISIX (Docker) trước 2 service nhỏ. Cấu hình: route theo path, verify JWT, rate-limit 100 req/phút/user. Test bằng curl xem request quá hạn bị chặn. Bonus: bật response cache và đo tải giảm ở service phía sau.</p>`,
    links: [
      { t: "microservices.io — API Gateway pattern", u: "microservices.io/patterns/apigateway.html" },
      { t: "Microsoft — Gateway routing/aggregation", u: "learn.microsoft.com/azure/architecture/microservices/design/gateway" },
      { t: "Istio — What is a service mesh", u: "istio.io/latest/about/service-mesh" },
    ],
  },
  {
    id: "CQR-07", tier: 3, xp: 120, prereq: ["DB-02", "CSH-04"],
    title: "CQRS & Event Sourcing",
    sum: "Tách đọc/ghi. Lưu chuỗi sự kiện thay vì trạng thái. Dùng có chọn lọc.",
    theory: `<p><b>CQRS</b> = tách mô hình <b>ghi</b> (Command, chuẩn hóa) khỏi mô hình <b>đọc</b> (Query, denormalized, tối ưu sẵn cho hiển thị). VD: dashboard 'tiến độ khóa học' đọc từ read model đã tính sẵn %, không JOIN 5 bảng mỗi lần load.</p>
 <p><b>Event Sourcing</b> = thay vì lưu trạng thái hiện tại, lưu <b>chuỗi sự kiện</b>; trạng thái = replay events. VD lưu <code>LessonCompleted(1)</code>, <code>QuizPassed</code>... → tính ra 60%. Cho <b>audit trail hoàn hảo</b>, tua ngược thời gian, tạo read model mới bất kỳ lúc nào.</p>
 <p>CQRS và ES <b>độc lập</b> — dùng CQRS mà không ES được. Cả hai đi kèm <b>eventual consistency</b> (read model trễ hơn ghi).</p>`,
    whenUse: `<p><b>CQRS</b>: khi đọc:ghi rất lệch (100:1 như edtech), query hiển thị phức tạp/chậm. <b>Event Sourcing</b>: CHỈ cho vài domain cần audit (payment, chứng chỉ, tiến độ có giá trị pháp lý). Fowler cảnh báo: phần lớn ca dùng CQRS/ES ông gặp là 'không tốt' — đừng dùng cho CRUD đơn giản.</p>`,
    pros: ["CQRS: đọc/ghi scale độc lập, query đọc siêu nhanh", "ES: audit trail bất tử, debug bằng replay, tạo view mới tự do"],
    cons: ["Eventual consistency: read model trễ vài chục ms–vài giây", "ES rất phức tạp: event immutable, khó đổi cấu trúc event cũ", "Dễ over-engineer — cạm bẫy giết dự án"],
    questions: [
      { q: "'Cấp chứng chỉ hoàn thành' có nên Event Sourcing? Còn 'đếm like bình luận'?",
        a: "<strong>Chứng chỉ → hợp Event Sourcing:</strong> cần audit đầy đủ (đã học gì, khi nào, đạt điều kiện gì), có giá trị pháp lý, không được sửa lịch sử. <strong>Đếm like → KHÔNG:</strong> đơn giản, giá trị thấp, chỉ cần một counter (Redis/Postgres). Event-source cái đơn giản = phức tạp vô ích." },
      { q: "Sau khi áp CQRS, tiến độ 2s sau mới cập nhật. Giải thích 'eventual consistency' cho khách thế nào?",
        a: "Nói theo lợi ích của họ: 'Hệ ghi kết quả ngay và bảo đảm không mất; phần hiển thị tổng hợp được cập nhật ngay sau đó (thường dưới vài giây) để trang tải nhanh kể cả lúc đông người.' Nếu họ cần thấy tức thì cho hành động vừa làm → dùng <strong>read-your-own-writes</strong> (đọc thẳng write model cho chính user vừa thao tác) hoặc cập nhật lạc quan trên UI." },
      { q: "Nhược lớn nhất của ES khi cần đổi cấu trúc 1 event đã lưu 1 triệu bản?",
        a: "Event là <strong>immutable</strong> — không sửa lịch sử. Phải xử lý <strong>schema/event versioning</strong>: thêm phiên bản event mới + 'upcaster' chuyển event cũ sang mới khi replay, giữ cả code đọc bản cũ. Đây là gánh nặng dài hạn khiến ES chỉ đáng dùng cho domain thực sự cần audit." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Làm mini 'tiến độ học' theo 2 kiểu: (A) lưu trạng thái progress=% trực tiếp; (B) lưu event stream (LessonStarted/Completed/QuizPassed) rồi tính % bằng replay + một read model denormalized cập nhật qua event. So sánh: độ phức tạp code, khả năng trả lời 'học viên đã làm gì lúc 10:05', và độ trễ read model.</p>`,
    links: [
      { t: "Martin Fowler — CQRS (đọc kỹ phần cảnh báo)", u: "martinfowler.com/bliki/CQRS.html" },
      { t: "Microsoft — CQRS pattern", u: "learn.microsoft.com/azure/architecture/patterns/cqrs" },
      { t: "Microsoft — Event Sourcing pattern", u: "learn.microsoft.com/azure/architecture/patterns/event-sourcing" },
      { t: "Martin Fowler — Event Sourcing", u: "martinfowler.com/eaaDev/EventSourcing.html" },
    ],
  },
  {
    id: "K8S-08", tier: 3, xp: 120, prereq: ["CAP-03"],
    title: "Kubernetes & Autoscaling",
    sum: "Điều phối container, self-healing, HPA/Cluster Autoscaler/KEDA.",
    theory: `<p><b>Kubernetes</b> = hệ điều phối container: tự deploy, tự restart container chết, scale replica theo tải, rolling update không downtime, phân phối tải.</p>
 <p><b>Khái niệm tối thiểu:</b> Pod (đơn vị chạy) · Deployment (quản lý replica) · Service (địa chỉ ổn định) · Ingress (vào từ ngoài) · ConfigMap/Secret · <b>HPA</b> (scale số pod theo CPU/RAM/custom metric) · liveness/readiness probe · resource request/limit.</p>
 <p><b>Autoscaling 3 tầng:</b> HPA (thêm pod) → Cluster Autoscaler (thêm node/máy) → <b>KEDA</b> (scale theo độ dài hàng đợi Kafka — hợp event-driven).</p>`,
    whenUse: `<p><b>Dùng</b> khi có nhiều service cần self-healing/autoscale/deploy an toàn. <b>CHƯA cần</b> khi MVP &lt; vài chục nghìn user — vài VM + Docker Compose + LB đã đủ và rẻ hơn nhiều công sức.</p>`,
    pros: ["Self-healing + autoscale + rolling deploy chuẩn công nghiệp", "Chạy được cả on-prem lẫn cloud (tránh vendor lock-in)"],
    cons: ["Đường cong học dốc, vận hành phức tạp", "Cấu hình sai → tốn tiền / mất an toàn", "Overkill cho hệ nhỏ"],
    questions: [
      { q: "Phân biệt liveness vs readiness probe. Cấu hình nhầm readiness thành liveness gây gì?",
        a: "<strong>Liveness</strong>: pod còn sống không — fail thì K8s <strong>restart</strong> pod. <strong>Readiness</strong>: pod sẵn sàng nhận traffic chưa — fail thì K8s <strong>ngừng gửi traffic</strong> (không restart). Nếu để logic 'chưa sẵn sàng' (vd đang warm-up, chờ dependency) vào <strong>liveness</strong>, pod sẽ bị <strong>restart liên tục (crash loop)</strong> thay vì chỉ tạm rút khỏi load balancer → mất ổn định." },
      { q: "HPA scale theo CPU không kịp cho service ăn Kafka. Nên dùng gì? Vì sao?",
        a: "Dùng <strong>KEDA</strong> scale theo <strong>độ dài hàng đợi (consumer lag)</strong> — chỉ số phản ánh đúng lượng việc tồn đọng, tăng trước khi CPU kịp phản ứng. CPU là chỉ số trễ và gián tiếp cho workload event-driven." },
      { q: "Vì sao phải đặt resource request/limit cho pod?",
        a: "<strong>Request</strong> giúp scheduler đặt pod lên node đủ tài nguyên (và là cơ sở HPA/tính bin-packing). <strong>Limit</strong> chặn 1 pod ngốn hết RAM/CPU làm ảnh hưởng pod khác (noisy neighbor). Thiếu chúng → node bị over-subscribe, OOM kill ngẫu nhiên, hành vi khó lường khi tải cao." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Cài k3s (nhẹ) trên 1 VM. Deploy 1 service có readiness+liveness probe + resource request/limit. Bật HPA theo CPU. Bắn tải bằng k6 và xem số pod tự tăng; giả lập pod chết (kubectl delete pod) và xem tự hồi. Ghi lại thời gian phản ứng của HPA.</p>`,
    links: [
      { t: "Kubernetes — Concepts", u: "kubernetes.io/docs/concepts" },
      { t: "Kubernetes — Horizontal Pod Autoscaler", u: "kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale" },
      { t: "KEDA — event-driven autoscaling", u: "keda.sh/docs/latest/concepts" },
      { t: "k3s — lightweight Kubernetes", u: "docs.k3s.io" },
    ],
  },
  {
    id: "FLT-09", tier: 3, xp: 120, prereq: ["K8S-08"],
    title: "Fault Tolerance & Resilience",
    sum: "Circuit breaker, retry+backoff, timeout, bulkhead, idempotency, SPOF.",
    theory: `<p>Trái tim của 'chịu lỗi cao'. Các pattern:</p>
 <ul>
 <li><b>Circuit Breaker</b> (quan trọng nhất): B chết → A ngừng gọi B một lúc (mở cầu dao), trả fallback, tránh sập dây chuyền (cascading failure).</li>
 <li><b>Retry + Exponential Backoff + Jitter</b>: thử lại nhưng giãn dần + ngẫu nhiên, tránh 'retry storm'.</li>
 <li><b>Timeout</b>: không bao giờ chờ vô hạn. Mọi lời gọi mạng phải có timeout.</li>
 <li><b>Bulkhead</b>: cô lập tài nguyên (pool riêng mỗi downstream) — 1 phần chìm không kéo cả tàu.</li>
 <li><b>Graceful degradation</b>: mất Recommendation vẫn hiện khóa học (chỉ mất phần gợi ý).</li>
 <li><b>Idempotency</b>: thao tác lặp lại cho cùng kết quả → retry an toàn (bắt buộc cho payment/enrollment).</li>
 </ul>
 <p><b>Loại bỏ SPOF:</b> mọi thành phần ≥2 bản ở ≥2 AZ; DB có replica + auto-failover; Gateway nhiều bản sau LB.</p>`,
    whenUse: `<p>Áp dụng cho <b>mọi lời gọi mạng vượt ranh giới service</b> (service↔service, service↔DB/bên thứ 3). Bắt đầu bằng timeout + retry + circuit breaker; thêm bulkhead khi có downstream hay chậm.</p>`,
    pros: ["Một service chết không kéo sập cả hệ", "Hệ 'hỏng một phần' thay vì sập toàn bộ", "Retry an toàn nhờ idempotency"],
    cons: ["Thêm độ phức tạp + cấu hình (ngưỡng breaker, timeout)", "Retry sai cách → khuếch đại sự cố (retry storm)", "Cần thiết kế idempotency từ đầu (khó thêm sau)"],
    questions: [
      { q: "Media gọi API resize bên thứ 3 chập chờn. Ghép pattern nào, theo thứ tự tư duy nào?",
        a: "(1) <strong>Timeout</strong> mọi lời gọi (vd 2s) — không để treo. (2) <strong>Retry + backoff + jitter</strong> cho lỗi tạm thời, giới hạn số lần. (3) <strong>Circuit breaker</strong>: nếu bên thứ 3 lỗi liên tục → mở cầu dao, ngừng gọi một lúc, trả <strong>fallback</strong> (ảnh gốc/placeholder) — <strong>graceful degradation</strong>. (4) <strong>Bulkhead</strong>: pool riêng cho lời gọi resize để nó chậm không cạn thread của cả Media service. Thứ tự tư duy: chặn treo → thử lại có kỷ luật → ngắt khi hỏng lâu → cô lập ảnh hưởng." },
      { q: "Vì sao idempotency bắt buộc khi Enrollment có retry? Ví dụ hỏng nếu thiếu.",
        a: "Retry có thể gửi lại request mà lần đầu <strong>đã thành công nhưng response bị mất</strong>. Thiếu idempotency → học viên bị <strong>đăng ký/tính tiền 2 lần</strong>. Giải: client gửi <strong>idempotency key</strong> duy nhất mỗi thao tác; server lưu key đã xử lý và trả lại kết quả cũ nếu key lặp → retry an toàn." },
      { q: "Retry đơn thuần có thể làm sự cố TỆ hơn. Vì sao? Sửa thế nào?",
        a: "Khi downstream quá tải, mọi client cùng retry ngay lập tức → <strong>retry storm</strong> nhân đôi/ba tải, dìm nó sâu hơn (cascading). Sửa: <strong>exponential backoff + jitter</strong> (giãn ngẫu nhiên), giới hạn số lần, và kết hợp <strong>circuit breaker</strong> để ngừng hẳn khi đang hỏng thay vì đập liên tục." },
    ],
    lab: `<span class="tag">Lab · chaos</span><p style="margin-top:8px">Dùng resilience4j (Java) hoặc Polly (.NET) bọc 1 lời gọi tới service giả có độ trễ/lỗi ngẫu nhiên (toxiproxy). Bật lần lượt timeout → retry+jitter → circuit breaker → bulkhead và quan sát p99 + error rate của service gọi. Sau đó dùng Chaos Mesh giết pod DB và kiểm chứng auto-failover thật sự hoạt động.</p>`,
    links: [
      { t: "Martin Fowler — Circuit Breaker", u: "martinfowler.com/bliki/CircuitBreaker.html" },
      { t: "AWS Well-Architected — Reliability Pillar", u: "docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html" },
      { t: "Google SRE Book — Handling Overload", u: "sre.google/sre-book/handling-overload" },
      { t: "resilience4j — resilience patterns", u: "resilience4j.readme.io/docs/getting-started" },
    ],
  },
  {
    id: "INF-10", tier: 4, xp: 120, prereq: ["GTW-06", "K8S-08"],
    title: "On-prem vs AWS (Setup môi trường)",
    sum: "Ánh xạ thành phần 2 bên. Chuẩn mở để tránh vendor lock-in.",
    theory: `<p>Muốn làm được cả hai: thiết kế quanh <b>chuẩn mở</b> (K8s, Postgres, Redis, Kafka, S3-API) → chạy được cả hai với cùng kiến trúc, chỉ đổi 'nhà cung cấp'.</p>
 <p><b>Ánh xạ (on-prem → AWS):</b> K8s tự dựng (kubeadm/k3s) → EKS · Nginx/HAProxy → ALB/NLB · Kong → API Gateway · Postgres+Patroni → RDS/Aurora · Redis Sentinel → ElastiCache · <b>MinIO → S3</b> · Nginx cache → CloudFront · Kafka → MSK · OpenSearch → OpenSearch Service · Vault → Secrets Manager · ArgoCD → CodePipeline/ArgoCD.</p>
 <p><b>Trade-off:</b> On-prem — kiểm soát toàn bộ, rẻ khi tải ổn định & lớn, data ở nhà (compliance giáo dục); nhưng tự lo tất cả (HA/backup/scale), vốn ban đầu lớn, khó scale đột biến. AWS — scale nhanh, managed lo phần khó, trả theo dùng; nhưng đắt khi tải lớn/ổn định, lock-in, chi phí dễ mất kiểm soát.</p>`,
    whenUse: `<p>Học: dựng <b>on-prem trước bằng Docker + k3s</b> (MinIO thay S3, Postgres, Redis, Kafka) để hiểu bản chất, rồi ánh xạ sang AWS managed để hiểu bạn trả tiền cho AWS lo <i>cái gì</i>.</p>`,
    pros: ["Chuẩn mở → chạy cả 2 môi trường, chuyển đổi được", "On-prem rẻ ở quy mô ổn định; AWS nhanh & co giãn"],
    cons: ["On-prem: gánh toàn bộ vận hành/HA/bảo mật", "AWS: lock-in + chi phí ẩn (egress, request, cross-AZ)"],
    questions: [
      { q: "MinIO 'tương thích S3 API' nghĩa là gì với code? Vì sao giúp tránh lock-in?",
        a: "Code dùng <strong>cùng SDK/giao thức S3</strong> (cùng call putObject/getObject, chỉ đổi endpoint + credentials). Nên bạn có thể chạy <strong>MinIO on-prem khi dev/self-host</strong> và <strong>S3 trên AWS ở production</strong> mà <strong>không sửa code ứng dụng</strong> → không bị khóa vào một nhà cung cấp storage." },
      { q: "Tải rất thất thường (tựu trường ×20, hè giảm sâu). On-prem hay AWS? Có phương án lai?",
        a: "Tải co giãn mạnh ưu tiên <strong>AWS</strong> (autoscale, trả theo dùng — không phải mua sẵn phần cứng cho đỉnh rồi để không cả năm). Phương án <strong>hybrid</strong>: chạy baseline ổn định on-prem (rẻ) + <strong>burst lên cloud</strong> vào mùa cao điểm; hoặc để phần stateful trên on-prem và stateless autoscale trên cloud." },
      { q: "Hai loại chi phí AWS người mới hay 'cháy túi'?",
        a: "(1) <strong>Data egress</strong> — chuyển dữ liệu RA internet (và <strong>cross-AZ traffic</strong>) tính phí, rất dễ phình với video/ảnh. (2) <strong>Chi phí theo request/instance chạy không tắt</strong> — NAT Gateway, load balancer giờ nhàn rỗi, RDS/EBS provisioned quá mức, log/metric lưu vô tội vạ. Phải bật cost alert + review định kỳ." },
    ],
    lab: `<span class="tag">Lab</span><p style="margin-top:8px">Dựng 'mini-cloud' on-prem bằng docker-compose: Postgres + Redis + MinIO + Kafka + 1 service upload ảnh dùng S3 SDK trỏ vào MinIO. Sau đó viết lại chỉ phần config để trỏ SDK sang S3 thật (hoặc localstack). Chứng minh: đổi hạ tầng, không đổi code. Ghi lại điểm khác biệt vận hành (backup, HA).</p>`,
    links: [
      { t: "AWS Well-Architected Framework", u: "aws.amazon.com/architecture/well-architected" },
      { t: "MinIO — S3-compatible object storage", u: "min.io/docs/minio/linux/index.html" },
      { t: "AWS — Cost Optimization pillar", u: "docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html" },
    ],
  },
  {
    id: "TST-11", tier: 4, xp: 120, prereq: ["CAP-03", "FLT-09"],
    title: "Load & Concurrency Testing",
    sum: "5 loại test, k6/Gatling/Locust, đọc p99, tìm bottleneck, chaos.",
    theory: `<p>Mô phỏng nhiều user đồng thời để tìm <b>điểm gãy</b> trước khi user thật tìm ra.</p>
 <p><b>5 loại test:</b> <b>Load</b> (tải kỳ vọng, đạt SLA?) · <b>Stress</b> (tăng đến khi gãy — gãy êm hay sập cả?) · <b>Spike</b> (tăng đột ngột — autoscale kịp?) · <b>Soak</b> (tải vừa chạy lâu 8–24h — rò rỉ bộ nhớ, cạn pool) · <b>Breakpoint</b> (số user tối đa).</p>
 <p><b>Công cụ (2026):</b> <b>k6</b> (Go, script JS, ~30–40k VU/máy, RAM thấp, hợp CI/CD — khuyên mặc định) · <b>Gatling</b> (JVM, report đẹp, 3–5k VU/agent) · <b>Locust</b> (Python, distributed sẵn).</p>
 <p><b>Test 10M user thế nào:</b> không cần 10M VU. Tính <b>RPS mục tiêu</b> (~6.000 peak), test theo <b>hành trình người dùng</b> (login→xem→đăng ký→upload) đạt RPS đó với p99 &lt; SLA, chạy k6 phân tán (k6 Operator trên K8s) để đủ VU.</p>
 <p><b>Chỉ số phải đo:</b> <b>p50/p95/p99</b> (KHÔNG dùng trung bình — nó nói dối), throughput (RPS), error rate, saturation (CPU/RAM/pool/DB), và <b>nó gãy ở đâu</b>.</p>`,
    whenUse: `<p>Chạy ở GĐ cuối trước launch và trong CI cho đường quan trọng. Vòng lặp: Test → tìm bottleneck → sửa (index/cache/replica/pool) → test lại → lặp. Đây là cách 'chứng minh' hệ chịu tải.</p>`,
    pros: ["Biết trần thật + cách hệ gãy, tự tin scale", "Tìm bug ẩn (memory leak, deadlock, cạn pool)"],
    cons: ["Tốn công dựng; môi trường test phải giống production", "Dễ đọc sai (nhìn trung bình thay vì p99)"],
    questions: [
      { q: "Vì sao nhìn p99 chứ không nhìn latency trung bình? Cho ví dụ 2 hệ cùng trung bình, p99 khác xa.",
        a: "Trung bình che giấu đuôi. Hệ A: mọi request ~100ms → trung bình 100, p99 ~110. Hệ B: 99% ở 50ms nhưng 1% ở 5.000ms → trung bình vẫn ~100ms nhưng <strong>p99 = 5.000ms</strong>. Với 6.000 RPS, '1% chậm' = <strong>60 user/giây</strong> gặp trải nghiệm tệ. p99/p999 mới phản ánh trải nghiệm xấu nhất mà nhiều user thực sự nếm." },
      { q: "Thêm VU nhưng RPS không tăng, latency vọt lên. Báo hiệu gì? Nghi bottleneck ở đâu?",
        a: "Hệ đã <strong>bão hòa</strong> — đạt trần throughput; thêm tải chỉ làm request xếp hàng (latency tăng, RPS phẳng). Nghi ngờ tài nguyên cạn: <strong>DB connection pool</strong>, CPU một service, lock DB, hoặc downstream chậm. Kiểm tra bằng metrics saturation từng tầng (CPU, pool active/queue, DB wait) để tìm đúng tầng nghẽn, rồi nới đúng chỗ đó." },
      { q: "Phân biệt spike test và stress test — mỗi loại phòng tình huống edtech nào?",
        a: "<strong>Stress</strong>: tăng <em>từ từ</em> đến khi gãy → tìm trần và kiểm tra hệ gãy có 'êm' không (graceful degradation). <strong>Spike</strong>: tăng <em>đột ngột</em> rồi rút → kiểm tra phản ứng nhanh. Edtech: spike phòng tình huống <strong>mở đăng ký khóa hot / giờ thi đồng loạt</strong> (autoscale kịp không, hàng đợi có tràn không); stress phòng tình huống <strong>tăng trưởng dần chạm trần hạ tầng</strong>." },
    ],
    lab: `<span class="tag">Lab · vòng lặp</span><p style="margin-top:8px">Viết kịch bản k6 mô phỏng hành trình: login → list khóa → xem chi tiết → enroll. Chạy load test tăng dần VU. Ghi p95/p99/RPS/error tại mỗi mức. Khi thấy p99 gãy: xác định bottleneck (thường DB pool hoặc 1 endpoint), sửa (thêm index/cache/nới pool đúng cách), test lại. Lặp tới khi đạt RPS mục tiêu với p99 &lt; SLA. Bonus: chạy soak 2h tìm memory leak.</p>`,
    links: [
      { t: "k6 — Test types (load/stress/spike/soak)", u: "grafana.com/docs/k6/latest/testing-guides/test-types" },
      { t: "k6 — docs", u: "grafana.com/docs/k6/latest" },
      { t: "Gatling — documentation", u: "docs.gatling.io" },
      { t: "Locust — documentation", u: "docs.locust.io" },
    ],
  },
  {
    id: "SYN-A", tier: 5, xp: 200, prereq: ["CSH-04", "SHD-05", "CQR-07"], synth: true,
    title: "⚙ Tổng hợp: Thiết kế Read-Path",
    sum: "Ghép Cache + Sharding + CQRS thành đường đọc chịu tải cho feed/dashboard.",
    theory: `<p>Node này mở khi bạn đã nắm Cache, Sharding, CQRS — giờ học <b>lắp ghép</b>. Bài toán: dashboard 'tiến độ + hoạt động' của học viên, đọc cực nhiều, dữ liệu trải nhiều bảng/shard.</p>
 <p><b>Đường đọc lý tưởng:</b> ghi vào write model (Postgres, có thể sharded theo user_id) → phát <b>event</b> → cập nhật <b>read model denormalized</b> (CQRS) đã gom sẵn theo user → phục vụ qua <b>cache</b> (Redis, TTL + jitter) → CDN cho phần tĩnh. Đọc 1 key thay vì JOIN nhiều bảng xuyên shard.</p>
 <p>Mấu chốt: read model được tổ chức theo <b>đúng cách đọc</b> (per-user), nên tránh scatter-gather; cache chặn phần lớn tải; CQRS cho phép read model scale độc lập write.</p>`,
    whenUse: `<p>Khi có màn hình đọc-nặng, tổng hợp nhiều nguồn, cần &lt;100ms ở quy mô lớn — và bạn chấp nhận eventual consistency vài giây.</p>`,
    pros: ["Đọc siêu nhanh, né JOIN xuyên shard", "Mỗi tầng (read model, cache) scale độc lập"],
    cons: ["Nhiều bản sao dữ liệu → phức tạp đồng bộ + eventual consistency", "Nhiều thành phần hơn để vận hành & monitor"],
    questions: [
      { q: "Vì sao read model per-user giải quyết được vấn đề scatter-gather của sharding?",
        a: "Sharding theo user_id làm query tổng hợp phải hỏi nhiều shard NẾU đọc theo chiều khác. Nhưng read model được <strong>precompute và lưu theo đúng khóa đọc (per-user)</strong> — khi hiển thị dashboard chỉ cần <strong>1 lần đọc theo user_id</strong> (single-shard/1 key cache), không JOIN, không gom nhiều shard. Ta 'trả giá' bằng công cập nhật read model lúc ghi (qua event), đổi lấy đọc rẻ." },
      { q: "Nếu event cập nhật read model bị mất/chậm, dashboard sai. Giảm rủi ro thế nào?",
        a: "Dùng <strong>event bus bền vững (Kafka)</strong> + consumer <strong>idempotent</strong> + theo dõi <strong>consumer lag</strong> (KEDA scale nếu tụt). Có <strong>job đối soát/rebuild</strong> read model từ write model (nhờ CQRS/ES có thể replay). Hiển thị mốc 'cập nhật lúc…' và cho phép <strong>read-your-own-writes</strong> cho hành động vừa làm để trải nghiệm không thấy trễ." },
    ],
    lab: `<span class="tag">Lab tổng hợp</span><p style="margin-top:8px">Ghép mini end-to-end: Postgres (write) → phát event (Kafka/Redis stream) → consumer cập nhật read model (bảng denormalized per-user) → API đọc phục vụ qua Redis cache. Đo p99 đường đọc và so với đọc 'JOIN trực tiếp'. Rồi tắt consumer vài giây để thấy eventual consistency, và bật lại xem tự đuổi kịp.</p>`,
    links: [
      { t: "Microsoft — Materialized View pattern", u: "learn.microsoft.com/azure/architecture/patterns/materialized-view" },
      { t: "Microsoft — CQRS pattern", u: "learn.microsoft.com/azure/architecture/patterns/cqrs" },
      { t: "AWS — Caching best practices", u: "aws.amazon.com/caching/best-practices" },
    ],
  },
  {
    id: "SYN-B", tier: 5, xp: 200, prereq: ["FLT-09", "TST-11", "INF-10"], synth: true,
    title: "⚙ Tổng hợp: Design for Failure",
    sum: "Ghép Resilience + Load test + Hạ tầng thành hệ chịu lỗi đã kiểm chứng.",
    theory: `<p>Mở khi bạn đã có Resilience, Testing, Hạ tầng. Bài học: 'chịu lỗi cao' không phải niềm tin — phải <b>kiểm chứng bằng thực nghiệm</b>.</p>
 <p><b>Quy trình khép kín:</b> (1) Thiết kế redundancy (multi-AZ, ≥2 bản, DB auto-failover) — bỏ SPOF. (2) Bọc mọi lời gọi bằng timeout/retry/circuit breaker/bulkhead. (3) <b>Load test</b> tới điểm gãy + <b>chaos test</b> (giết pod/DB, tăng latency mạng) để xác nhận hệ 'hỏng một phần' chứ không sập. (4) Thiết lập <b>SLO + alert</b> dựa trên p99/error rate/saturation. (5) Runbook cho sự cố.</p>`,
    whenUse: `<p>Trước mỗi lần launch tính năng quan trọng, và định kỳ (game day chaos). Đây là 'bằng chứng' để tự tin đưa hệ ra 10M user.</p>`,
    pros: ["Niềm tin chịu lỗi dựa trên số liệu, không phải hy vọng", "Phát hiện điểm yếu ẩn trước khi user gặp"],
    cons: ["Tốn công dựng môi trường giống prod + văn hóa game day", "Chaos ẩu có thể gây sự cố thật nếu thiếu kiểm soát"],
    questions: [
      { q: "'Hệ chịu lỗi cao' — làm sao CHỨNG MINH thay vì chỉ tuyên bố?",
        a: "Bằng <strong>thực nghiệm có kiểm soát</strong>: chaos engineering chủ động <strong>giết node/DB/thêm latency</strong> trong lúc chạy load test và <strong>đo</strong> hệ có giữ SLA (p99, error rate) không, auto-failover có chạy, có bị cascading không. Kết quả pass/fail + số liệu là 'bằng chứng'; kiến trúc đẹp trên giấy không phải bằng chứng." },
      { q: "Load test qua nhưng production vẫn sập lúc peak. Ba lý do phổ biến?",
        a: "(1) <strong>Môi trường test khác prod</strong> (data nhỏ hơn, ít shard, cấu hình khác) → kết quả không đại diện. (2) <strong>Chưa test đúng kịch bản</strong> (chỉ test 1 endpoint, bỏ hành trình thật/soak/spike → bỏ sót leak & autoscale trễ). (3) <strong>Phụ thuộc ẩn</strong> không nằm trong test (bên thứ 3, cross-AZ, cold cache lúc deploy). Bài học: test sát prod + phủ đủ 5 loại test." },
    ],
    lab: `<span class="tag">Lab tổng hợp · game day</span><p style="margin-top:8px">Trên cụm k3s: deploy service + DB có replica. Chạy k6 ở tải ~70%. Trong lúc đó dùng Chaos Mesh: (a) kill pod app → xem HPA/self-heal; (b) kill DB primary → xem failover + đo downtime; (c) inject 500ms network latency → xem circuit breaker + degradation. Ghi lại: SLA có giữ không, mất bao lâu để hồi, điểm nào cần vá.</p>`,
    links: [
      { t: "AWS Well-Architected — Reliability Pillar", u: "docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html" },
      { t: "Principles of Chaos Engineering", u: "principlesofchaos.org" },
      { t: "Google SRE Book — Addressing Cascading Failures", u: "sre.google/sre-book/addressing-cascading-failures" },
    ],
  },
  {
    id: "BOSS", tier: 5, xp: 500,
    prereq: ["LNG-01", "DB-02", "CAP-03", "CSH-04", "SHD-05", "GTW-06", "CQR-07", "K8S-08", "FLT-09", "INF-10", "TST-11", "SYN-A", "SYN-B"],
    boss: true,
    title: "★ BOSS: Thiết kế Edtech 10M users",
    sum: "Capstone: lắp toàn bộ mảnh ghép thành 1 kiến trúc bảo vệ được.",
    theory: `<p>Bài cuối: tự thiết kế và <b>bảo vệ</b> kiến trúc edtech đầy đủ cho 10M user, dùng mọi thứ đã học.</p>
 <p><b>Yêu cầu MVP + scale:</b> Auth/Identity · Catalog khóa học · Upload ảnh/video · Enrollment · Tiến độ học · Tìm kiếm · Notification · Analytics. Chia microservices hợp lý, mỗi service chọn ngôn ngữ + DB có lý do; đường đọc dùng cache/CQRS; DB nào cần shard và shard key gì; Gateway + resilience + K8s autoscale; chạy được on-prem lẫn AWS; và một kế hoạch load/chaos test để chứng minh.</p>`,
    whenUse: `<p>Khi 13 node kia đã clear. Đây là bài luyện 'kể chuyện kiến trúc' — kỹ năng phỏng vấn & thực chiến của SA.</p>`,
    pros: ["Tổng hợp toàn bộ tư duy thành 1 sản phẩm bảo vệ được", "Chuẩn bị trực tiếp cho phỏng vấn System Design & vai trò SA"],
    cons: ["Không có đáp án 'đúng duy nhất' — điểm nằm ở chất lượng trade-off", "Đòi kỷ luật viết ra + tự phản biện"],
    questions: [
      { q: "Vẽ kiến trúc tổng và chỉ ra 3 SPOF tiềm ẩn + cách loại bỏ.",
        a: "Không có đáp án cố định — chấm theo tiêu chí: mỗi tầng (Gateway, DB, cache, message bus) có ≥2 bản/multi-AZ? DB có failover? Cache chết có graceful degradation? Trình bày được <strong>vì sao</strong> mỗi lựa chọn, không chỉ vẽ hộp. Gợi ý 3 SPOF hay bị bỏ sót: <strong>single DB primary</strong> (→ replica+failover), <strong>1 Gateway/LB</strong> (→ nhiều bản đa AZ), <strong>1 broker Kafka/1 Redis node</strong> (→ cluster/replica)." },
      { q: "Ngân sách giới hạn: đâu là 3 thứ bạn KHÔNG làm ở ngày đầu (chống over-engineering)?",
        a: "Chấm theo tư duy FND-00. Ứng viên tốt thường hoãn: <strong>sharding</strong> (dùng Postgres + replica + partition trước), <strong>service mesh</strong> (Gateway + resilience lib đủ), <strong>event sourcing toàn hệ</strong> (chỉ ES cho payment/chứng chỉ), <strong>polyglot 5 ngôn ngữ</strong> (gom 1–2). Mấu chốt: kiến trúc phải <strong>tiến hóa được</strong>, không phức tạp sẵn." },
      { q: "Làm sao chứng minh với sếp rằng hệ chịu được ngày tựu trường (spike ×20)?",
        a: "Đưa <strong>số liệu từ spike test + chaos test</strong>: đồ thị RPS/p99/error khi bơm tải ×20 đột ngột, thời gian autoscale phản ứng, và kết quả khi giết node giữa peak (SLA có giữ). Kèm kế hoạch dự phòng: pre-scale trước sự kiện, queue chịu tải, degradation cho tính năng phụ. Bằng chứng thực nghiệm, không phải lời hứa." },
    ],
    lab: `<span class="tag">Capstone</span><p style="margin-top:8px">Viết 1 tài liệu kiến trúc 3–5 trang cho edtech 10M user: (1) sơ đồ tổng + danh sách service (ngôn ngữ + DB + lý do); (2) đường đọc & đường ghi cho 'xem khóa' và 'enroll'; (3) bảng sizing (RPS→instance/pool, từ CAP-03); (4) chiến lược DB (khi nào shard, shard key); (5) resilience + SPOF removal; (6) mapping on-prem↔AWS; (7) kế hoạch load+chaos test với chỉ số pass/fail. Rồi tự đóng vai interviewer chất vấn từng lựa chọn.</p>`,
    links: [
      { t: "System Design Primer", u: "github.com/donnemartin/system-design-primer" },
      { t: "AWS Well-Architected Framework", u: "aws.amazon.com/architecture/well-architected" },
      { t: "Microsoft — Azure Architecture Center (patterns)", u: "learn.microsoft.com/azure/architecture/patterns" },
    ],
  },
];
