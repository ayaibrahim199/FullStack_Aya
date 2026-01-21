package com.example.booking.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class Booking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime bookingDate;

    @Column(nullable = false)
    private String status = "PENDING"; // PENDING, CONFIRMED, REJECTED, CANCELLED, CHANGES_REQUESTED

    @Column(length = 1000)
    private String teacherComment;

    private LocalDateTime lastUpdated;

    @ManyToOne
    @JoinColumn(name = "student_id")
    private User student; // The user who booked [cite: 7]

    @ManyToOne
    @JoinColumn(name = "slot_id")
    private AvailableSlot slot; // The specific time slot [cite: 31]

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(LocalDateTime bookingDate) {
        this.bookingDate = bookingDate;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public AvailableSlot getSlot() {
        return slot;
    }

    public void setSlot(AvailableSlot slot) {
        this.slot = slot;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getTeacherComment() {
        return teacherComment;
    }

    public void setTeacherComment(String teacherComment) {
        this.teacherComment = teacherComment;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}