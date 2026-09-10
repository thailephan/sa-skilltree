-- Chạy trên coordinator: đăng ký worker, tạo bảng distributed, seed 1M dòng.

-- 1) Gắn các node vào cluster (hostname resolve trong mạng compose).
SELECT citus_set_coordinator_host('coordinator', 5432);
SELECT citus_add_node('worker1', 5432);
SELECT citus_add_node('worker2', 5432);
SELECT nodename, nodeport, isactive FROM pg_dist_node;

-- 2) Bảng enrollment. Distribution column PHẢI nằm trong PK/unique → dùng PK ghép (user_id, id).
DROP TABLE IF EXISTS enrollments;
CREATE TABLE enrollments (
  id         bigserial,
  user_id    bigint  NOT NULL,
  school_id  int     NOT NULL,
  course_id  bigint  NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

-- Shard theo user_id (B2C access pattern).
SELECT create_distributed_table('enrollments', 'user_id');

-- 3) Seed 1,000,000 dòng (mất ~30–60s).
INSERT INTO enrollments (user_id, school_id, course_id)
SELECT (random() * 1e6)::bigint,
       (random() * 500)::int + 1,
       (random() * 2000)::bigint + 1
FROM generate_series(1, 1000000);

ANALYZE enrollments;

-- 4) So sánh 2 kiểu query:
--    (A) SINGLE-SHARD — lọc theo distribution key (user_id): chỉ hỏi 1 shard → nhanh.
EXPLAIN ANALYZE SELECT count(*) FROM enrollments WHERE user_id = 123456;

--    (B) SCATTER-GATHER — lọc theo cột KHÔNG phải distribution key (school_id):
--        phải hỏi MỌI shard rồi gộp → chậm hơn. Đây là bài học "shard key = access pattern".
EXPLAIN ANALYZE SELECT count(*) FROM enrollments WHERE school_id = 42;

-- Thử nghiệm thêm: nếu truy vấn theo trường là phổ biến, distribute theo school_id sẽ đổi kết quả (B) thành single-shard.
