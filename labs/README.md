# SA Labs — môi trường thực hành

Bộ lab chạy bằng Docker để thực hành các node trong app. Cần **Docker Desktop đang chạy**.

```bash
cd labs
docker compose up -d          # Postgres + Redis + MinIO + demo API
docker compose ps             # kiểm tra trạng thái
curl localhost:8080/health    # {"ok":true,"cache":false}
```

Tắt: `docker compose down` (thêm `-v` để xóa cả dữ liệu).

---

## Bản đồ Lab ↔ Node

| Node | Lab | Lệnh |
|---|---|---|
| **CSH-04** Caching | Đo p99 khi có/không cache | xem *Lab 1* |
| **TST-11** Load test | k6 bơm tải, tìm điểm gãy | xem *Lab 2* |
| **FLT-09** Idempotency | Retry cùng key không tạo bản ghi kép | xem *Lab 3* |
| **SHD-05** Sharding | Citus: single-shard vs scatter-gather | xem *Lab 4* |
| **INF-10** On-prem/S3 | MinIO = S3-compatible | xem *Lab 5* |

---

### Lab 1 — CSH-04 Caching (cache-aside)
```bash
# (a) KHÔNG cache — đo baseline
docker compose run --rm k6 run /scripts/course-load.js

# (b) BẬT cache rồi chạy lại
#     sửa USE_CACHE: "1" trong docker-compose.yml, hoặc:
USE_CACHE=1 docker compose up -d api      # (biến trong compose ưu tiên; hoặc sửa file rồi up -d api)
docker compose run --rm k6 run /scripts/course-load.js
```
So sánh `http_req_duration p(95)/p(99)` giữa (a) và (b). Xem cache hit trực tiếp:
```bash
curl -i localhost:8080/courses/7 | grep -i x-cache   # MISS lần đầu, HIT lần sau
```
> Câu hỏi tự vấn: cache giảm p99 bao nhiêu %? Vì sao lần đầu vẫn MISS?

### Lab 2 — TST-11 Load test (tìm bottleneck)
```bash
docker compose run --rm k6 run /scripts/course-load.js   # tăng dần 50→500 VU
docker compose run --rm k6 run /scripts/journey.js        # hành trình list→view→enroll
```
Quan sát: khi VU tăng mà RPS phẳng + latency vọt → đã bão hòa. Thử hạ `PG_POOL` xuống `2` (trong compose, `up -d api`) để **thấy DB pool trở thành bottleneck**.

### Lab 3 — FLT-09 Idempotency
```bash
# Gửi 2 lần CÙNG Idempotency-Key → chỉ tạo 1 enrollment (lần 2 replay=true)
curl -s -XPOST localhost:8080/enroll -H 'Idempotency-Key: abc-123' \
  -H 'Content-Type: application/json' -d '{"user_id":1,"course_id":10}'
curl -s -XPOST localhost:8080/enroll -H 'Idempotency-Key: abc-123' \
  -H 'Content-Type: application/json' -d '{"user_id":1,"course_id":10}'
# lần 2 trả {"enrollment_id":<same>,"replay":true}
```
Bỏ header `Idempotency-Key` và gửi 2 lần → tạo **2** bản ghi (mô phỏng double-charge nếu thiếu idempotency).

### Lab 4 — SHD-05 Sharding (Citus)
```bash
cd sharding
docker compose up -d
sleep 5
docker compose exec -T coordinator psql -U sa -d edtech < setup.sql
```
Đọc `EXPLAIN ANALYZE`: query theo `user_id` (single-shard) nhanh hơn hẳn query theo `school_id` (scatter-gather mọi shard). Đúng bài học **shard key = access pattern**.

### Lab 5 — INF-10 On-prem ↔ S3 (MinIO)
- Console: <http://localhost:9001> (user/pass: `minioadmin`/`minioadmin`).
- Endpoint S3-compatible: `http://localhost:9000`. Trỏ AWS SDK/`aws --endpoint-url http://localhost:9000` vào đây — **cùng code như S3 thật**, chỉ khác endpoint → minh chứng "đổi hạ tầng, không đổi code".

---

## Ghi chú
- Thư mục `labs/` độc lập với app Next.js — không ảnh hưởng build/deploy Vercel.
- Kafka (cho CQRS/SYN-A) là tùy chọn: `docker compose --profile kafka up -d kafka`.
- Lần đầu `up`, service `api` sẽ `npm install` (pg, redis) — chờ ~10–20s rồi `curl /health`.
