-- Seed cho demo API. Tự chạy khi Postgres khởi tạo lần đầu.

create table courses (
  id          serial primary key,
  title       text not null,
  description text,
  price       numeric(10,2) default 0,
  created_at  timestamptz default now()
);

-- 2000 khóa học giả (description dài ~200 ký tự để payload đủ "nặng").
insert into courses (title, description, price)
select 'Course ' || g,
       'Description for course ' || g || ' ' || repeat('x', 200),
       (g % 100) + 9.99
from generate_series(1, 2000) g;

create table enrollments (
  id         bigserial primary key,
  user_id    bigint not null,
  course_id  bigint not null,
  created_at timestamptz default now()
);
create index on enrollments (user_id);
create index on enrollments (course_id);

-- Bảng lưu idempotency key (FLT-09): retry cùng key không tạo enrollment mới.
create table idempotency (
  key           text primary key,
  enrollment_id bigint not null,
  created_at    timestamptz default now()
);
