package com.example.booking.dto;

import com.example.booking.model.User;

/**
 * Lightweight representation of a teacher that can be safely shared with the frontend.
 */
public class TeacherSummary {
    private Long id;
    private String displayName;
    private String firstName;
    private String lastName;
    private String email;

    public TeacherSummary() {
    }

    public TeacherSummary(User user) {
        this.id = user.getId();
        this.displayName = user.getDisplayName();
        this.firstName = user.getFirstName();
        this.lastName = user.getLastName();
        this.email = user.getUsername();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
