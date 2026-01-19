package com.example.booking.controller;

import com.example.booking.model.AvailableSlot;
import com.example.booking.model.Booking;
import com.example.booking.repository.AvailableSlotRepository;
import com.example.booking.repository.BookingRepository;
import com.example.booking.repository.UserRepository;
import com.example.booking.model.User;
import com.example.booking.dto.SlotResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/slots")
public class SlotController {

    @Autowired
    private AvailableSlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all available slots
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableSlots() {
        List<AvailableSlot> slots = slotRepository.findByStatus("AVAILABLE");
        List<SlotResponse> slotResponses = slots.stream()
                .map(SlotResponse::new)
                .toList();
        return ResponseEntity.ok(slotResponses);
    }

    // Get all slots for a specific teacher
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getTeacherSlots(@PathVariable Long teacherId) {
        List<AvailableSlot> slots = slotRepository.findAll();
        List<SlotResponse> slotResponses = slots.stream()
                .filter(slot -> slot.getTeacher() != null && slot.getTeacher().getId().equals(teacherId))
                .map(SlotResponse::new)
                .toList();
        return ResponseEntity.ok(slotResponses);
    }

    // Create a new available slot (for teachers)
    @PostMapping("/create")
    public ResponseEntity<?> createSlot(
            @RequestParam Long teacherId,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));

            AvailableSlot slot = new AvailableSlot();
            slot.setTeacher(teacher);
            slot.setStartTime(LocalDateTime.parse(startTime));
            slot.setEndTime(LocalDateTime.parse(endTime));
            slot.setStatus("AVAILABLE");

            AvailableSlot savedSlot = slotRepository.save(slot);
            SlotResponse slotResponse = new SlotResponse(savedSlot);
            return ResponseEntity.ok(slotResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating slot: " + e.getMessage());
        }
    }

    // Update a slot
    @PutMapping("/{slotId}")
    public ResponseEntity<?> updateSlot(
            @PathVariable Long slotId,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            AvailableSlot slot = slotRepository.findById(slotId)
                    .orElseThrow(() -> new RuntimeException("Slot not found"));

            slot.setStartTime(LocalDateTime.parse(startTime));
            slot.setEndTime(LocalDateTime.parse(endTime));

            AvailableSlot updatedSlot = slotRepository.save(slot);
            SlotResponse slotResponse = new SlotResponse(updatedSlot);
            return ResponseEntity.ok(slotResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error updating slot: " + e.getMessage());
        }
    }

    // Delete a slot
    @DeleteMapping("/{slotId}")
    public ResponseEntity<?> deleteSlot(@PathVariable Long slotId) {
        try {
            slotRepository.deleteById(slotId);
            return ResponseEntity.ok("Slot deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting slot: " + e.getMessage());
        }
    }
}
