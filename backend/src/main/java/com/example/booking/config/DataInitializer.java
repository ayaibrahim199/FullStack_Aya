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
            if (userRepository.findByUsername("teacher@example.com").isEmpty()) {
                User teacher = new User();
                teacher.setUsername("teacher@example.com");
                teacher.setPassword(passwordEncoder.encode("teacher123"));
                teacher.setRoles(Set.of(teacherRole));
                userRepository.save(teacher);
            }
            
            if (userRepository.findByUsername("student@example.com").isEmpty()) {
                User student = new User();
                student.setUsername("student@example.com");
                student.setPassword(passwordEncoder.encode("student123"));
                student.setRoles(Set.of(studentRole));
                userRepository.save(student);
            }
        };
    }
}