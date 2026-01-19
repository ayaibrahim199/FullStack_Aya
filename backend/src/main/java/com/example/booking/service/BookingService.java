package com.example.booking.service;

import com.example.booking.model.Booking;
import com.example.booking.repository.BookingRepository;
import com.example.booking.repository.AvailableSlotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AvailableSlotRepository slotRepository;

    public Booking createBooking(Booking booking) {
        // Validation: Check if slot is still available [cite: 21]
        if (!"AVAILABLE".equals(booking.getSlot().getStatus())) {
            throw new RuntimeException("This slot is already booked!"); // Prevent double booking [cite: 12]
        }
        
        // Update slot status to booked [cite: 20]
        booking.getSlot().setStatus("BOOKED");
        return bookingRepository.save(booking);
    }
}