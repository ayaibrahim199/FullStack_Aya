package com.example.booking.config;

import com.example.booking.model.Role;
import com.example.booking.model.User;
import com.example.booking.repository.RoleRepository;
import com.example.booking.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
public class DataInitializer {
    
    @Bean
    CommandLineRunner initData(RoleRepository roleRepository, UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Initialize roles
            Role teacherRole;
            Role studentRole;
            
            if (roleRepository.findByName("ROLE_TEACHER").isEmpty()) {
                teacherRole = new Role();
                teacherRole.setName("ROLE_TEACHER");
                roleRepository.save(teacherRole);
            } else {
                teacherRole = roleRepository.findByName("ROLE_TEACHER").get();
            }
            
            if (roleRepository.findByName("ROLE_STUDENT").isEmpty()) {
                studentRole = new Role();
                studentRole.setName("ROLE_STUDENT");
                roleRepository.save(studentRole);
            } else {
                studentRole = roleRepository.findByName("ROLE_STUDENT").get();
            }
            
            // Initialize demo users
            userRepository.findByUsername("teacher@example.com").ifPresentOrElse(existing -> {
                boolean needsUpdate = false;
                if (existing.getFirstName() == null || existing.getFirstName().isBlank()) {
                    existing.setFirstName("Aya");
                    needsUpdate = true;
                }
                if (existing.getLastName() == null || existing.getLastName().isBlank()) {
                    existing.setLastName("Hassan");
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    userRepository.save(existing);
                }
            }, () -> {
                User teacher = new User();
                teacher.setUsername("teacher@example.com");
                teacher.setPassword(passwordEncoder.encode("teacher123"));
                teacher.setFirstName("Aya");
                teacher.setLastName("Hassan");
                teacher.setRoles(Set.of(teacherRole));
                userRepository.save(teacher);
            });
            
            userRepository.findByUsername("student@example.com").ifPresentOrElse(existing -> {
                boolean needsUpdate = false;
                if (existing.getFirstName() == null || existing.getFirstName().isBlank()) {
                    existing.setFirstName("Ali");
                    needsUpdate = true;
                }
                if (existing.getLastName() == null || existing.getLastName().isBlank()) {
                    existing.setLastName("Khalid");
                    needsUpdate = true;
                }
                if (needsUpdate) {
                    userRepository.save(existing);
                }
            }, () -> {
                User student = new User();
                student.setUsername("student@example.com");
                student.setPassword(passwordEncoder.encode("student123"));
                student.setFirstName("Ali");
                student.setLastName("Khalid");
                student.setRoles(Set.of(studentRole));
                userRepository.save(student);
            });
        };
    }
}