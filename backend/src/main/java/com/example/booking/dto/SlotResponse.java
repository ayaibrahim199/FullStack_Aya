package com.example.booking.dto;

import com.example.booking.model.AvailableSlot;
import com.example.booking.model.Booking;

import java.time.LocalDateTime;
import java.util.Comparator;

public class SlotResponse {
    private Long id;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private Long teacherId;
    private String teacherName;
    private String teacherEmail;
    private String teacherFirstName;
    private String teacherLastName;
    private BookingSummary currentBooking;

    public SlotResponse() {}

    public SlotResponse(AvailableSlot slot) {
        this.id = slot.getId();
        this.startTime = slot.getStartTime();
        this.endTime = slot.getEndTime();
        this.status = slot.getStatus();
        if (slot.getTeacher() != null) {
            this.teacherId = slot.getTeacher().getId();
            this.teacherName = slot.getTeacher().getDisplayName();
            this.teacherEmail = slot.getTeacher().getUsername();
            this.teacherFirstName = slot.getTeacher().getFirstName();
            this.teacherLastName = slot.getTeacher().getLastName();
        }

        var bookings = slot.getBookings() != null ? slot.getBookings() : java.util.Collections.<Booking>emptyList();
        this.currentBooking = bookings.stream()
                .filter(booking -> booking.getStatus() != null && !"CANCELLED".equalsIgnoreCase(booking.getStatus()))
                .max(Comparator.comparing(booking -> {
                    LocalDateTime bookingDate = booking.getBookingDate();
                    return bookingDate != null ? bookingDate : LocalDateTime.MIN;
                })).map(BookingSummary::new)
                .orElse(null);
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(Long teacherId) {
        this.teacherId = teacherId;
    }

    public String getTeacherName() {
        return teacherName;
    }

    public void setTeacherName(String teacherName) {
        this.teacherName = teacherName;
    }

    public String getTeacherEmail() {
        return teacherEmail;
    }

    public void setTeacherEmail(String teacherEmail) {
        this.teacherEmail = teacherEmail;
    }

    public String getTeacherFirstName() {
        return teacherFirstName;
    }

    public void setTeacherFirstName(String teacherFirstName) {
        this.teacherFirstName = teacherFirstName;
    }

    public String getTeacherLastName() {
        return teacherLastName;
    }

    public void setTeacherLastName(String teacherLastName) {
        this.teacherLastName = teacherLastName;
    }

    public BookingSummary getCurrentBooking() {
        return currentBooking;
    }

    public void setCurrentBooking(BookingSummary currentBooking) {
        this.currentBooking = currentBooking;
    }

    public static class BookingSummary {
        private Long id;
        private String studentName;
        private Long studentId;
        private String status;
        private String studentEmail;

        public BookingSummary(Booking booking) {
            this.id = booking.getId();
            this.status = booking.getStatus();
            if (booking.getStudent() != null) {
                this.studentId = booking.getStudent().getId();
                this.studentName = booking.getStudent().getDisplayName();
                this.studentEmail = booking.getStudent().getUsername();
            }
        }

        public Long getId() {
            return id;
        }

        public String getStudentName() {
            return studentName;
        }

        public Long getStudentId() {
            return studentId;
        }

        public String getStatus() {
            return status;
        }

        public String getStudentEmail() {
            return studentEmail;
        }
    }
}
