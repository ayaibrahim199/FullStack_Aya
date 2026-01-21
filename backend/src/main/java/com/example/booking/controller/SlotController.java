package com.example.booking.controller;

import com.example.booking.model.AvailableSlot;
import com.example.booking.repository.AvailableSlotRepository;
import com.example.booking.repository.UserRepository;
import com.example.booking.model.User;
import com.example.booking.dto.SlotResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/slots")
public class SlotController {

    @Autowired
    private AvailableSlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    // Get the current calendar view for students (includes statuses so they understand whether a slot is pending/confirmed)
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableSlots() {
        Comparator<AvailableSlot> byStartTime = Comparator.comparing(AvailableSlot::getStartTime,
            Comparator.nullsLast(Comparator.naturalOrder()));

        List<SlotResponse> slotResponses = slotRepository.findAll().stream()
            .filter(slot -> slot.getStatus() == null || !"DISABLED".equalsIgnoreCase(slot.getStatus()))
            .sorted(byStartTime)
            .map(SlotResponse::new)
            .toList();
        return ResponseEntity.ok(slotResponses);
    }

    // Get all slots for a specific teacher
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getTeacherSlots(@PathVariable Long teacherId) {
        try {
            userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

            List<SlotResponse> slotResponses = slotRepository.findByTeacher_IdOrderByStartTimeAsc(teacherId).stream()
                .map(SlotResponse::new)
                .toList();
            return ResponseEntity.ok(slotResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching slots: " + e.getMessage());
        }
    }

    // Create a new available slot (for teachers)
    @PostMapping("/create")
    public ResponseEntity<?> createSlot(
            @RequestParam Long teacherId,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        try {
            System.out.println("DEBUG: Creating slot for teacherId: " + teacherId);
            System.out.println("DEBUG: Start time: " + startTime + ", End time: " + endTime);
            
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found with ID: " + teacherId + ". Please make sure you're logged in with a teacher account."));
            
            System.out.println("DEBUG: Found teacher: " + teacher.getUsername());
            
            // Verify user has teacher role
            boolean isTeacher = teacher.getRoles().stream()
                    .anyMatch(role -> role.getName().equals("ROLE_TEACHER"));
            
            if (!isTeacher) {
                return ResponseEntity.badRequest()
                        .body("Error: User " + teacher.getUsername() + " does not have teacher role. Please sign up as a teacher.");
            }

            LocalDateTime start = parseFlexibleDateTime(startTime);
            LocalDateTime end = parseFlexibleDateTime(endTime);

            if (!start.isBefore(end)) {
                return ResponseEntity.badRequest().body("End time must be after start time");
            }

            AvailableSlot slot = new AvailableSlot();
            slot.setTeacher(teacher);
            slot.setStartTime(start);
            slot.setEndTime(end);
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

            if (isLockedStatus(slot.getStatus())) {
                return ResponseEntity.badRequest().body("Cannot edit slot while a booking is pending or confirmed");
            }

            LocalDateTime start = parseFlexibleDateTime(startTime);
            LocalDateTime end = parseFlexibleDateTime(endTime);

            if (!start.isBefore(end)) {
                return ResponseEntity.badRequest().body("End time must be after start time");
            }

            slot.setStartTime(start);
            slot.setEndTime(end);

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
            AvailableSlot slot = slotRepository.findById(slotId)
                    .orElseThrow(() -> new RuntimeException("Slot not found"));

            if (isLockedStatus(slot.getStatus())) {
                return ResponseEntity.badRequest().body("Cannot delete a slot with an active or pending booking");
            }

            slotRepository.delete(slot);
            return ResponseEntity.ok("Slot deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error deleting slot: " + e.getMessage());
        }
    }

    @PostMapping("/{slotId}/enable")
    public ResponseEntity<?> enableSlot(@PathVariable Long slotId) {
        try {
            AvailableSlot slot = slotRepository.findById(slotId)
                    .orElseThrow(() -> new RuntimeException("Slot not found"));

            if (isLockedStatus(slot.getStatus())) {
                return ResponseEntity.badRequest().body("Cannot enable a slot that has an active booking");
            }

            slot.setStatus("AVAILABLE");
            AvailableSlot updatedSlot = slotRepository.save(slot);
            return ResponseEntity.ok(new SlotResponse(updatedSlot));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error enabling slot: " + e.getMessage());
        }
    }

    @PostMapping("/{slotId}/disable")
    public ResponseEntity<?> disableSlot(@PathVariable Long slotId) {
        try {
            AvailableSlot slot = slotRepository.findById(slotId)
                    .orElseThrow(() -> new RuntimeException("Slot not found"));

            if (isLockedStatus(slot.getStatus())) {
                return ResponseEntity.badRequest().body("Cannot disable a slot while a booking is in progress");
            }

            slot.setStatus("DISABLED");
            AvailableSlot updatedSlot = slotRepository.save(slot);
            return ResponseEntity.ok(new SlotResponse(updatedSlot));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error disabling slot: " + e.getMessage());
        }
    }

    private boolean isLockedStatus(String status) {
        if (status == null) {
            return false;
        }
        String normalized = status.toUpperCase();
        return normalized.equals("BOOKED") || normalized.equals("PENDING") || normalized.equals("CHANGES_REQUESTED");
    }

    private LocalDateTime parseFlexibleDateTime(String isoString) {
        if (isoString == null || isoString.isBlank()) {
            throw new IllegalArgumentException("Timestamp value is required");
        }

        try {
            return OffsetDateTime.parse(isoString).toLocalDateTime();
        } catch (DateTimeParseException offsetException) {
            try {
                return LocalDateTime.parse(isoString);
            } catch (DateTimeParseException localException) {
                throw new IllegalArgumentException(
                        "Unable to parse timestamp: " + isoString + " (expected ISO-8601 format)");
            }
        }
    }
}
