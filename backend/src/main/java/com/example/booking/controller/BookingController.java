package com.example.booking.controller;

import com.example.booking.model.Booking;
import com.example.booking.model.AvailableSlot;
import com.example.booking.model.User;
import com.example.booking.repository.BookingRepository;
import com.example.booking.repository.AvailableSlotRepository;
import com.example.booking.repository.UserRepository;
import com.example.booking.service.BookingService;
import com.example.booking.dto.BookingResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AvailableSlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    // Get all bookings for a student
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentBookings(@PathVariable Long studentId) {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            List<BookingResponse> bookingResponses = bookings.stream()
                    .filter(b -> b.getStudent() != null && b.getStudent().getId().equals(studentId))
                    .map(BookingResponse::new)
                    .toList();
            return ResponseEntity.ok(bookingResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching bookings: " + e.getMessage());
        }
    }

    // Get all bookings for a teacher (view whose students booked)
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getTeacherBookings(@PathVariable Long teacherId) {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            List<BookingResponse> bookingResponses = bookings.stream()
                    .filter(b -> b.getSlot() != null && 
                           b.getSlot().getTeacher() != null && 
                           b.getSlot().getTeacher().getId().equals(teacherId))
                    .map(BookingResponse::new)
                    .toList();
            return ResponseEntity.ok(bookingResponses);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching bookings: " + e.getMessage());
        }
    }

    // Book an appointment
    @PostMapping("/book")
    public ResponseEntity<?> bookAppointment(
            @RequestParam Long studentId,
            @RequestParam Long slotId) {
        try {
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            AvailableSlot slot = slotRepository.findById(slotId)
                    .orElseThrow(() -> new RuntimeException("Slot not found"));

            // Check if slot is available
            if (!"AVAILABLE".equals(slot.getStatus())) {
                return ResponseEntity.badRequest().body("Slot is not available");
            }

            Booking booking = new Booking();
            booking.setStudent(student);
            booking.setSlot(slot);
            booking.setBookingDate(LocalDateTime.now());
            booking.setStatus("PENDING"); // Set initial status as PENDING

            // Don't change slot status to BOOKED yet - wait for teacher approval
            // slot.setStatus("BOOKED");
            // slotRepository.save(slot);

            Booking savedBooking = bookingRepository.save(booking);
            BookingResponse bookingResponse = new BookingResponse(savedBooking);
            return ResponseEntity.ok(bookingResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error booking appointment: " + e.getMessage());
        }
    }

    // Approve a booking (for teachers)
    @PostMapping("/{bookingId}/approve")
    public ResponseEntity<?> approveBooking(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (!"PENDING".equals(booking.getStatus())) {
                return ResponseEntity.badRequest().body("Booking is not in pending state");
            }

            // Update booking status to confirmed
            booking.setStatus("CONFIRMED");
            
            // Update slot status to booked
            AvailableSlot slot = booking.getSlot();
            if (slot != null) {
                slot.setStatus("BOOKED");
                slotRepository.save(slot);
            }

            Booking updatedBooking = bookingRepository.save(booking);
            BookingResponse bookingResponse = new BookingResponse(updatedBooking);
            return ResponseEntity.ok(bookingResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error approving booking: " + e.getMessage());
        }
    }

    // Reject a booking (for teachers)
    @PostMapping("/{bookingId}/reject")
    public ResponseEntity<?> rejectBooking(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            if (!"PENDING".equals(booking.getStatus())) {
                return ResponseEntity.badRequest().body("Booking is not in pending state");
            }

            // Update booking status to rejected
            booking.setStatus("REJECTED");
            
            // Keep slot as available since booking is rejected
            // No need to change slot status
            
            Booking updatedBooking = bookingRepository.save(booking);
            BookingResponse bookingResponse = new BookingResponse(updatedBooking);
            return ResponseEntity.ok(bookingResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error rejecting booking: " + e.getMessage());
        }
    }

    // Get pending bookings for a teacher
    @GetMapping("/teacher/{teacherId}/pending")
    public ResponseEntity<?> getPendingBookingsForTeacher(@PathVariable Long teacherId) {
        try {
            List<Booking> bookings = bookingRepository.findAll();
            List<BookingResponse> pendingBookings = bookings.stream()
                    .filter(b -> b.getSlot() != null && 
                           b.getSlot().getTeacher() != null && 
                           b.getSlot().getTeacher().getId().equals(teacherId) &&
                           "PENDING".equals(b.getStatus()))
                    .map(BookingResponse::new)
                    .toList();
            return ResponseEntity.ok(pendingBookings);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching pending bookings: " + e.getMessage());
        }
    }

    // Cancel a booking
    @PostMapping("/cancel/{bookingId}")
    public ResponseEntity<?> cancelBooking(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            // Update booking status to cancelled
            booking.setStatus("CANCELLED");

            // Free up the slot if it was confirmed
            AvailableSlot slot = booking.getSlot();
            if (slot != null && "BOOKED".equals(slot.getStatus())) {
                slot.setStatus("AVAILABLE");
                slotRepository.save(slot);
            }

            bookingRepository.save(booking);
            return ResponseEntity.ok("Booking cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error cancelling booking: " + e.getMessage());
        }
    }

    // Cancel a booking via DELETE (REST standard)
    @DeleteMapping("/{bookingId}")
    public ResponseEntity<?> deleteBooking(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));

            // Free up the slot
            AvailableSlot slot = booking.getSlot();
            if (slot != null) {
                slot.setStatus("AVAILABLE");
                slotRepository.save(slot);
            }

            bookingRepository.deleteById(bookingId);
            return ResponseEntity.ok("Booking cancelled successfully");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error cancelling booking: " + e.getMessage());
        }
    }

    // Get booking details
    @GetMapping("/{bookingId}")
    public ResponseEntity<?> getBooking(@PathVariable Long bookingId) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new RuntimeException("Booking not found"));
            BookingResponse bookingResponse = new BookingResponse(booking);
            return ResponseEntity.ok(bookingResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error fetching booking: " + e.getMessage());
        }
    }
}
