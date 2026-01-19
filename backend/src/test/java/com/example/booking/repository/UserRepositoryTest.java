package com.example.booking.repository;

import com.example.booking.model.User;
import com.example.booking.model.Role;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @BeforeEach
    public void setUp() {
        userRepository.deleteAll();

        // Create roles if they don't exist
        if (roleRepository.findByName("ROLE_STUDENT").isEmpty()) {
            Role studentRole = new Role();
            studentRole.setName("ROLE_STUDENT");
            roleRepository.save(studentRole);
        }
    }

    @Test
    public void testFindByUsername_Success() {
        // Create a user
        User user = new User();
        user.setUsername("testuser");
        user.setPassword("password123");
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_STUDENT").get());
        user.setRoles(roles);
        userRepository.save(user);

        // Find the user
        Optional<User> foundUser = userRepository.findByUsername("testuser");

        assertTrue(foundUser.isPresent());
        assertEquals("testuser", foundUser.get().getUsername());
    }

    @Test
    public void testFindByUsername_NotFound() {
        Optional<User> foundUser = userRepository.findByUsername("nonexistentuser");
        assertFalse(foundUser.isPresent());
    }

    @Test
    public void testSaveUser() {
        User user = new User();
        user.setUsername("newuser");
        user.setPassword("password123");
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_STUDENT").get());
        user.setRoles(roles);

        User savedUser = userRepository.save(user);

        assertNotNull(savedUser.getId());
        assertEquals("newuser", savedUser.getUsername());
    }

    @Test
    public void testDeleteUser() {
        // Create and save a user
        User user = new User();
        user.setUsername("userToDelete");
        user.setPassword("password123");
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_STUDENT").get());
        user.setRoles(roles);
        User savedUser = userRepository.save(user);

        // Delete the user
        userRepository.delete(savedUser);

        // Verify deletion
        Optional<User> deletedUser = userRepository.findByUsername("userToDelete");
        assertFalse(deletedUser.isPresent());
    }
}
