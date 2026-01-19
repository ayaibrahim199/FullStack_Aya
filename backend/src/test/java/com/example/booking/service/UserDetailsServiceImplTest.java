package com.example.booking.service;

import com.example.booking.model.User;
import com.example.booking.model.Role;
import com.example.booking.repository.UserRepository;
import com.example.booking.repository.RoleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashSet;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class UserDetailsServiceImplTest {

    @Autowired
    private UserDetailsServiceImpl userDetailsService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    public void setUp() {
        userRepository.deleteAll();

        // Create roles if they don't exist
        if (roleRepository.findByName("ROLE_STUDENT").isEmpty()) {
            Role studentRole = new Role();
            studentRole.setName("ROLE_STUDENT");
            roleRepository.save(studentRole);
        }

        if (roleRepository.findByName("ROLE_TEACHER").isEmpty()) {
            Role teacherRole = new Role();
            teacherRole.setName("ROLE_TEACHER");
            roleRepository.save(teacherRole);
        }
    }

    @Test
    public void testLoadUserByUsername_Success() {
        // Create a test user
        User user = new User();
        user.setUsername("testuser");
        user.setPassword(passwordEncoder.encode("password123"));
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_STUDENT").get());
        user.setRoles(roles);
        userRepository.save(user);

        // Load user by username
        UserDetails userDetails = userDetailsService.loadUserByUsername("testuser");

        assertNotNull(userDetails);
        assertEquals("testuser", userDetails.getUsername());
        assertTrue(userDetails.getAuthorities().size() > 0);
    }

    @Test
    public void testLoadUserByUsername_UserNotFound() {
        assertThrows(UsernameNotFoundException.class, () -> {
            userDetailsService.loadUserByUsername("nonexistentuser");
        });
    }

    @Test
    public void testLoadUserByUsername_WithTeacherRole() {
        // Create a teacher user
        User user = new User();
        user.setUsername("teacher");
        user.setPassword(passwordEncoder.encode("password123"));
        Set<Role> roles = new HashSet<>();
        roles.add(roleRepository.findByName("ROLE_TEACHER").get());
        user.setRoles(roles);
        userRepository.save(user);

        // Load user by username
        UserDetails userDetails = userDetailsService.loadUserByUsername("teacher");

        assertNotNull(userDetails);
        assertEquals("teacher", userDetails.getUsername());
        assertTrue(userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_TEACHER")));
    }
}
