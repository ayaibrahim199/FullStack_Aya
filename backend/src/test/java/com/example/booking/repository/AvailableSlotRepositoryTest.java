package com.example.booking.repository;

import com.example.booking.model.AvailableSlot;
import com.example.booking.model.User;
import com.example.booking.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AvailableSlotRepositoryTest {

    @Autowired
    private AvailableSlotRepository slotRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    private User teacherUser;

    @BeforeEach
    public void setUp() {
        slotRepository.deleteAll();
        userRepository.deleteAll();

        // Create roles if they don't exist
        if (roleRepository.findByName("ROLE_TEACHER").isEmpty()) {
            Role teacherRole = new Role();
            teacherRole.setName("ROLE_TEACHER");
            roleRepository.save(teacherRole);
        }

        // Create a teacher user
        teacherUser = new User();
        teacherUser.setUsername("teacher");
        teacherUser.setPassword("teacher123");
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_TEACHER").get());
        teacherUser.setRoles(roles);
        teacherUser = userRepository.save(teacherUser);
    }

    @Test
    public void testFindByTeacher() {
        // Create slots
        AvailableSlot slot1 = new AvailableSlot();
        slot1.setTeacher(teacherUser);
        slot1.setStartTime(LocalDateTime.now().plusHours(1));
        slot1.setEndTime(LocalDateTime.now().plusHours(2));
        slot1.setStatus("AVAILABLE");
        slotRepository.save(slot1);

        AvailableSlot slot2 = new AvailableSlot();
        slot2.setTeacher(teacherUser);
        slot2.setStartTime(LocalDateTime.now().plusHours(3));
        slot2.setEndTime(LocalDateTime.now().plusHours(4));
        slot2.setStatus("AVAILABLE");
        slotRepository.save(slot2);

        // Find slots by teacher
        List<AvailableSlot> teacherSlots = slotRepository.findByTeacher(teacherUser);

        assertEquals(2, teacherSlots.size());
    }

    @Test
    public void testFindByTeacher_Empty() {
        // Create another user
        User anotherTeacher = new User();
        anotherTeacher.setUsername("another");
        anotherTeacher.setPassword("teacher123");
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_TEACHER").get());
        anotherTeacher.setRoles(roles);
        anotherTeacher = userRepository.save(anotherTeacher);

        // Find slots by teacher (should be empty)
        List<AvailableSlot> teacherSlots = slotRepository.findByTeacher(anotherTeacher);

        assertEquals(0, teacherSlots.size());
    }

    @Test
    public void testFindByStatus() {
        // Create slots with different statuses
        AvailableSlot slot1 = new AvailableSlot();
        slot1.setTeacher(teacherUser);
        slot1.setStartTime(LocalDateTime.now().plusHours(1));
        slot1.setEndTime(LocalDateTime.now().plusHours(2));
        slot1.setStatus("AVAILABLE");
        slotRepository.save(slot1);

        AvailableSlot slot2 = new AvailableSlot();
        slot2.setTeacher(teacherUser);
        slot2.setStartTime(LocalDateTime.now().plusHours(3));
        slot2.setEndTime(LocalDateTime.now().plusHours(4));
        slot2.setStatus("BOOKED");
        slotRepository.save(slot2);

        // Find available slots
        List<AvailableSlot> availableSlots = slotRepository.findByStatus("AVAILABLE");

        assertEquals(1, availableSlots.size());
        assertEquals("AVAILABLE", availableSlots.get(0).getStatus());
    }

    @Test
    public void testSaveSlot() {
        AvailableSlot slot = new AvailableSlot();
        slot.setTeacher(teacherUser);
        slot.setStartTime(LocalDateTime.now().plusHours(1));
        slot.setEndTime(LocalDateTime.now().plusHours(2));
        slot.setStatus("AVAILABLE");

        AvailableSlot savedSlot = slotRepository.save(slot);

        assertNotNull(savedSlot.getId());
        assertEquals(teacherUser.getId(), savedSlot.getTeacher().getId());
    }

    @Test
    public void testDeleteSlot() {
        // Create and save a slot
        AvailableSlot slot = new AvailableSlot();
        slot.setTeacher(teacherUser);
        slot.setStartTime(LocalDateTime.now().plusHours(1));
        slot.setEndTime(LocalDateTime.now().plusHours(2));
        slot.setStatus("AVAILABLE");
        AvailableSlot savedSlot = slotRepository.save(slot);

        // Delete the slot
        slotRepository.delete(savedSlot);

        // Verify deletion
        assertTrue(slotRepository.findById(savedSlot.getId()).isEmpty());
    }

    @Test
    public void testUpdateSlot() {
        // Create and save a slot
        AvailableSlot slot = new AvailableSlot();
        slot.setTeacher(teacherUser);
        slot.setStartTime(LocalDateTime.now().plusHours(1));
        slot.setEndTime(LocalDateTime.now().plusHours(2));
        slot.setStatus("AVAILABLE");
        AvailableSlot savedSlot = slotRepository.save(slot);

        // Update the slot
        savedSlot.setStatus("BOOKED");
        AvailableSlot updatedSlot = slotRepository.save(savedSlot);

        assertEquals("BOOKED", updatedSlot.getStatus());
    }
}
