package com.example.booking.dto;

public class JwtResponse {
    private String token;
    private String type = "Bearer";
    private String username;
    private Long id;
    private String role;
    private String displayName;
    private String firstName;
    private String lastName;

    public JwtResponse(String token, String username) {
        this.token = token;
        this.username = username;
    }

    public JwtResponse(String token, String username, Long id, String role) {
        this.token = token;
        this.username = username;
        this.id = id;
        this.role = role;
    }

    public JwtResponse(String token, String username, Long id, String role, String displayName, String firstName, String lastName) {
        this.token = token;
        this.username = username;
        this.id = id;
        this.role = role;
        this.displayName = displayName;
        this.firstName = firstName;
        this.lastName = lastName;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
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
}