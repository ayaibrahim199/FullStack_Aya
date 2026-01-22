package com.example.booking.repository;

import com.example.booking.model.AvailableSlot;
import com.example.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AvailableSlotRepository extends JpaRepository<AvailableSlot, Long> {
    // Find slots that aren't booked yet
    List<AvailableSlot> findByStatus(String status);

    // Find slots by teacher
    List<AvailableSlot> findByTeacher(User teacher);

    List<AvailableSlot> findByTeacher_IdOrderByStartTimeAsc(Long teacherId);

    boolean existsByTeacher_IdAndStartTimeAndEndTime(Long teacherId, LocalDateTime startTime, LocalDateTime endTime);

    Optional<AvailableSlot> findByTeacher_IdAndStartTimeAndEndTime(Long teacherId, LocalDateTime startTime, LocalDateTime endTime);
}