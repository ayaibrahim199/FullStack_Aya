package com.example.booking.repository;

import com.example.booking.model.Booking;
import com.example.booking.model.AvailableSlot;
import com.example.booking.model.User;
import com.example.booking.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class BookingRepositoryTest {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private AvailableSlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User teacherUser;
    private User studentUser;
    private AvailableSlot slot;

    @BeforeEach
    public void setUp() {
        bookingRepository.deleteAll();
        slotRepository.deleteAll();
        userRepository.deleteAll();

        // Create roles if they don't exist
        if (roleRepository.findByName("ROLE_TEACHER").isEmpty()) {
            Role teacherRole = new Role();
            teacherRole.setName("ROLE_TEACHER");
            roleRepository.save(teacherRole);
        }

        if (roleRepository.findByName("ROLE_STUDENT").isEmpty()) {
            Role studentRole = new Role();
            studentRole.setName("ROLE_STUDENT");
            roleRepository.save(studentRole);
        }

        // Create teacher user
        teacherUser = new User();
        teacherUser.setUsername("teacher");
        teacherUser.setPassword("teacher123");
        Set<Role> teacherRoles = new HashSet<>();
        teacherRoles.add(roleRepository.findByName("ROLE_TEACHER").get());
        teacherUser.setRoles(teacherRoles);
        teacherUser = userRepository.save(teacherUser);

        // Create student user
        studentUser = new User();
        studentUser.setUsername("student");
        studentUser.setPassword("student123");
        Set<Role> studentRoles = new HashSet<>();
        studentRoles.add(roleRepository.findByName("ROLE_STUDENT").get());
        studentUser.setRoles(studentRoles);
        studentUser = userRepository.save(studentUser);

        // Create a slot
        slot = new AvailableSlot();
        slot.setTeacher(teacherUser);
        slot.setStartTime(LocalDateTime.now().plusHours(1));
        slot.setEndTime(LocalDateTime.now().plusHours(2));
        slot.setStatus("AVAILABLE");
        slot = slotRepository.save(slot);
    }

    @Test
    public void testSaveBooking() {
        Booking booking = new Booking();
        booking.setStudent(studentUser);
        booking.setSlot(slot);

        Booking savedBooking = bookingRepository.save(booking);

        assertNotNull(savedBooking.getId());
        assertEquals(studentUser.getId(), savedBooking.getStudent().getId());
        assertEquals(slot.getId(), savedBooking.getSlot().getId());
    }

    @Test
    public void testFindBookingById() {
        // Create and save booking
        Booking booking = new Booking();
        booking.setStudent(studentUser);
        booking.setSlot(slot);
        Booking savedBooking = bookingRepository.save(booking);

        // Find booking
        var foundBooking = bookingRepository.findById(savedBooking.getId());

        assertTrue(foundBooking.isPresent());
        assertEquals(studentUser.getId(), foundBooking.get().getStudent().getId());
    }

    @Test
    public void testDeleteBooking() {
        // Create and save booking
        Booking booking = new Booking();
        booking.setStudent(studentUser);
        booking.setSlot(slot);
        Booking savedBooking = bookingRepository.save(booking);

        // Delete booking
        bookingRepository.delete(savedBooking);

        // Verify deletion
        assertTrue(bookingRepository.findById(savedBooking.getId()).isEmpty());
    }

    @Test
    public void testMultipleBookingsForSameSlot() {
        // Create another student
        User anotherStudent = new User();
        anotherStudent.setUsername("student2");
        anotherStudent.setPassword("student123");
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_STUDENT").get());
        anotherStudent.setRoles(roles);
        anotherStudent = userRepository.save(anotherStudent);

        // Create bookings
        Booking booking1 = new Booking();
        booking1.setStudent(studentUser);
        booking1.setSlot(slot);
        bookingRepository.save(booking1);

        Booking booking2 = new Booking();
        booking2.setStudent(anotherStudent);
        booking2.setSlot(slot);
        bookingRepository.save(booking2);

        // Verify both bookings exist
        var allBookings = bookingRepository.findAll();
        assertEquals(2, allBookings.size());
    }
}
