// TST-11 load test: bơm tải tăng dần vào GET /courses/:id.
// Chạy KHÔNG cache:  docker compose run --rm k6 run /scripts/course-load.js
// Rồi bật cache (USE_CACHE=1, up -d api) và chạy lại — so p95/p99.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://api:8080";

export const options = {
  stages: [
    { duration: "30s", target: 50 },
    { duration: "1m", target: 200 },
    { duration: "1m", target: 500 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<200", "p(99)<500"], // SLA mẫu — quan sát nó "gãy" ở đâu
    http_req_failed: ["rate<0.01"],
  },
};

export default function () {
  const id = Math.floor(Math.random() * 2000) + 1;
  const res = http.get(`${BASE}/courses/${id}`);
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(0.1);
}
