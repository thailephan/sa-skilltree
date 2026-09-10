// TST-11 journey test: mô phỏng hành trình thật list → view → enroll.
// docker compose run --rm k6 run /scripts/journey.js
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://api:8080";

export const options = {
  vus: 50,
  duration: "1m",
  thresholds: { http_req_duration: ["p(99)<800"], http_req_failed: ["rate<0.02"] },
};

export default function () {
  http.get(`${BASE}/courses`); // list
  const id = Math.floor(Math.random() * 2000) + 1;
  http.get(`${BASE}/courses/${id}`); // view
  const uid = Math.floor(Math.random() * 1e6);
  const res = http.post(
    `${BASE}/enroll`,
    JSON.stringify({ user_id: uid, course_id: id }),
    { headers: { "Content-Type": "application/json" } }
  );
  check(res, { "enroll 201": (r) => r.status === 201 });
  sleep(0.5);
}
