package com.example.booking.controller;

import com.example.booking.dto.TeacherSummary;
import com.example.booking.model.User;
import com.example.booking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/teachers")
public class TeacherController {

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<TeacherSummary>> getTeachers() {
        List<TeacherSummary> teachers = userRepository.findDistinctByRoles_Name("ROLE_TEACHER").stream()
                .map(TeacherSummary::new)
                .sorted(Comparator.comparing(
                        TeacherSummary::getDisplayName,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .toList();
        return ResponseEntity.ok(teachers);
    }
}
