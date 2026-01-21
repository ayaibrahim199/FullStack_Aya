package com.example.booking.dto;

/**
 * Simple DTO used when a teacher requests changes or leaves a note while taking an action on a booking.
 */
public class BookingDecisionRequest {
    private String note;

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
