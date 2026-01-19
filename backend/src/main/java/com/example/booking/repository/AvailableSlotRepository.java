package com.example.booking.repository;

import com.example.booking.model.AvailableSlot;
import com.example.booking.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AvailableSlotRepository extends JpaRepository<AvailableSlot, Long> {
    // Find slots that aren't booked yet
    List<AvailableSlot> findByStatus(String status);

    // Find slots by teacher
    List<AvailableSlot> findByTeacher(User teacher);
}