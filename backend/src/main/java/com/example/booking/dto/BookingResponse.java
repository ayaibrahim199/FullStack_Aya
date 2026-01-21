package com.example.booking.dto;

import com.example.booking.model.Booking;
import java.time.LocalDateTime;

public class BookingResponse {
    private Long id;
    private LocalDateTime bookingDate;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private SlotResponse slot;
    private String status;
    private String teacherComment;
    private LocalDateTime lastUpdated;

    public BookingResponse() {}

    public BookingResponse(Booking booking) {
        this.id = booking.getId();
        this.bookingDate = booking.getBookingDate();
        if (booking.getStudent() != null) {
            this.studentId = booking.getStudent().getId();
            this.studentName = booking.getStudent().getDisplayName();
            this.studentEmail = booking.getStudent().getUsername();
        }
        if (booking.getSlot() != null) {
            this.slot = new SlotResponse(booking.getSlot());
        }
        this.status = booking.getStatus() != null ? booking.getStatus() : "PENDING";
        this.teacherComment = booking.getTeacherComment();
        this.lastUpdated = booking.getLastUpdated();
    }

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

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public SlotResponse getSlot() {
        return slot;
    }

    public void setSlot(SlotResponse slot) {
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
