-- Optional cleanup script to collapse duplicate slots per teacher/timeslot
-- This keeps the oldest slot per (teacher_id, start_time, end_time) and deletes newer duplicates.
-- Review and adjust before running in production.
WITH ranked_slots AS (
    SELECT
        id,
        teacher_id,
        start_time,
        end_time,
        MIN(id) OVER (PARTITION BY teacher_id, start_time, end_time) AS keeper_id,
        ROW_NUMBER() OVER (
            PARTITION BY teacher_id, start_time, end_time
            ORDER BY id
        ) AS slot_rank
    FROM available_slot
),
reassigned_bookings AS (
    UPDATE booking b
    SET slot_id = rs.keeper_id
    FROM ranked_slots rs
    WHERE b.slot_id = rs.id
      AND rs.slot_rank > 1
    RETURNING b.id
)
DELETE FROM available_slot a
USING ranked_slots rs
WHERE a.id = rs.id
  AND rs.slot_rank > 1;
