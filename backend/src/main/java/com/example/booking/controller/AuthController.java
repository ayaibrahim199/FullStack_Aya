package com.example.booking.controller;

import com.example.booking.model.*;
import com.example.booking.repository.*;
import com.example.booking.config.JwtUtils;
import com.example.booking.dto.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired AuthenticationManager authenticationManager;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired PasswordEncoder encoder;
    @Autowired JwtUtils jwtUtils;

    @PostMapping("/signin")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication.getName());
        
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        String role = user.getRoles().stream()
                .map(Role::getName)
                .findFirst()
                .orElse("ROLE_STUDENT");
        
        String displayName = user.getDisplayName();
        return ResponseEntity.ok(new JwtResponse(
            jwt,
            authentication.getName(),
            user.getId(),
            role,
            displayName,
            user.getFirstName(),
            user.getLastName()
        ));
    }

    @PostMapping("/signup")
    public ResponseEntity<?> registerUser(@RequestBody SignupRequest signUpRequest) {
        if (userRepository.findByUsername(signUpRequest.getUsername()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Username is already taken!");
        }

        User user = new User();
        user.setUsername(signUpRequest.getUsername());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));
        user.setFirstName(resolveFirstName(signUpRequest.getFirstName(), signUpRequest.getUsername()));
        user.setLastName(resolveOptionalName(signUpRequest.getLastName()));

        Set<String> strRoles = signUpRequest.getRole();
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            Role userRole = roleRepository.findByName("ROLE_STUDENT")
                    .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
            roles.add(userRole);
        } else {
            strRoles.forEach(role -> {
                switch (role) {
                    case "teacher":
                        Role adminRole = roleRepository.findByName("ROLE_TEACHER")
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(adminRole);
                        break;
                    default:
                        Role userRole = roleRepository.findByName("ROLE_STUDENT")
                                .orElseThrow(() -> new RuntimeException("Error: Role is not found."));
                        roles.add(userRole);
                }
            });
        }

        user.setRoles(roles);
        userRepository.save(user);
        return ResponseEntity.ok("User registered successfully!");
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok().body(Map.of("status", "OK", "timestamp", new Date()));
    }

    private String resolveFirstName(String rawValue, String usernameFallback) {
        if (rawValue != null) {
            String trimmed = rawValue.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }

        if (usernameFallback != null && !usernameFallback.isBlank()) {
            String candidate = usernameFallback;
            int atIndex = candidate.indexOf('@');
            if (atIndex > 0) {
                candidate = candidate.substring(0, atIndex);
            }
            candidate = candidate.replace('.', ' ').replace('_', ' ').trim();
            if (!candidate.isEmpty()) {
                return candidate;
            }
        }

        return "User";
    }

    private String resolveOptionalName(String rawValue) {
        if (rawValue != null) {
            String trimmed = rawValue.trim();
            if (!trimmed.isEmpty()) {
                return trimmed;
            }
        }
        return "";
    }
}