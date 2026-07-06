package com.pharmadesk.backend.service;

import com.pharmadesk.backend.dto.CreateUserRequest;
import com.pharmadesk.backend.dto.UserRequestDto;
import com.pharmadesk.backend.dto.UserResponseDTO;
import com.pharmadesk.backend.model.Role;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.repository.RoleRepository;
import com.pharmadesk.backend.repository.UserRepository;
import com.pharmadesk.backend.mapper.UserMapper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service layer for all User management operations.
 * Extracted from AuthController to enforce the single-responsibility principle.
 */
@Service
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(UserRepository userRepository,
                       RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder,
                       UserMapper userMapper) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    /** Returns all non-deleted users mapped to response DTOs. */
    @Transactional(readOnly = true)
    public List<UserResponseDTO> getAllUsers() {
        return userRepository.findAll()
                .stream()
                .map(userMapper::toResponseDto)
                .collect(Collectors.toList());
    }

    /** Creates a new user and returns the saved DTO. */
    public UserResponseDTO createUser(CreateUserRequest dto) {
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username already exists: " + dto.getUsername());
        }

        User user = userMapper.toEntity(dto);
        user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        user.setMustChangePassword(true);

        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            user.setRoles(resolveRoles(dto.getRoles()));
        }

        return userMapper.toResponseDto(userRepository.save(user));
    }

    /** Updates a user's profile (name, email, phone, branch, shift). */
    public UserResponseDTO updateProfile(Long id, String name, String email,
                                         String phone, String branch, String shift) {
        User user = findUserById(id);
        if (name   != null) user.setName(name);
        if (email  != null) user.setEmail(email);
        if (phone  != null) user.setPhone(phone);
        if (branch != null) user.setBranch(branch);
        if (shift  != null) user.setShift(shift);
        return userMapper.toResponseDto(userRepository.save(user));
    }

    /** Full admin update: roles, password, status etc. */
    public UserResponseDTO updateUser(Long id, UserRequestDto dto) {
        User user = findUserById(id);
        
        CreateUserRequest mappedRequest = new CreateUserRequest();
        mappedRequest.setName(dto.getName());
        mappedRequest.setEmail(dto.getEmail());
        mappedRequest.setPhone(dto.getPhone());
        mappedRequest.setBranch(dto.getBranch());
        mappedRequest.setShift(dto.getShift());
        
        userMapper.updateEntityFromRequest(mappedRequest, user);
        user.setStatus(dto.getStatus());

        if (dto.getPassword() != null && !dto.getPassword().isEmpty()) {
            user.setPasswordHash(passwordEncoder.encode(dto.getPassword()));
        }

        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            Set<Role> roles = resolveRoles(
                dto.getRoles().stream()
                   .filter(r -> r != null && !r.isBlank())
                   .collect(Collectors.toList())
            );
            if (!roles.isEmpty()) {
                user.setRoles(roles);
            }
        }

        return userMapper.toResponseDto(userRepository.save(user));
    }

    /** Toggles between ACTIVE and SUSPENDED. */
    public UserResponseDTO toggleStatus(Long id) {
        User user = findUserById(id);
        String newStatus = "ACTIVE".equals(user.getStatus()) ? "SUSPENDED" : "ACTIVE";
        user.setStatus(newStatus);
        return userMapper.toResponseDto(userRepository.save(user));
    }

    /**
     * Resets password to a system-generated temporary value and flags
     * {@code mustChangePassword = true}.
     *
     * @return Map with keys {@code username}, {@code temporaryPassword}, {@code name}.
     */
    public java.util.Map<String, String> resetPassword(Long id) {
        User user = findUserById(id);

        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        StringBuilder temp = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 8; i++) {
            temp.append(chars.charAt(random.nextInt(chars.length())));
        }
        String rawPassword = "Ph@" + temp;

        user.setPasswordHash(passwordEncoder.encode(rawPassword));
        user.setMustChangePassword(true);
        userRepository.save(user);

        java.util.Map<String, String> result = new java.util.HashMap<>();
        result.put("username",          user.getUsername());
        result.put("temporaryPassword", rawPassword);
        result.put("name",              user.getName());
        return result;
    }

    /** Soft-deletes a user. */
    public void deleteUser(Long id) {
        User user = findUserById(id);
        user.setDeleted(true);
        userRepository.save(user);
    }

    /** Changes user's own password and clears the {@code mustChangePassword} flag. */
    public void changePassword(String username, String newPassword) {
        if (newPassword == null || newPassword.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters");
        }
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setMustChangePassword(false);
        userRepository.save(user);
    }

    /** Updates the last-login timestamp asynchronously. */
    public void recordLastLogin(Long id) {
        userRepository.findById(id).ifPresent(user -> {
            userRepository.updateLastLogin(id, LocalDateTime.now());
        });
    }

    /** Updates the last-logout timestamp. */
    public void recordLastLogout(String username) {
        userRepository.findByUsername(username).ifPresent(user -> {
            user.setLastLogout(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private User findUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private Set<Role> resolveRoles(List<String> roleNames) {
        return roleNames.stream()
                .map(name -> roleRepository.findByName(name)
                        .orElseThrow(() -> new RuntimeException(
                                "Role not found: " + name + ". Valid roles: " +
                                roleRepository.findAll().stream()
                                        .map(Role::getName)
                                        .collect(Collectors.joining(", "))
                        )))
                .collect(Collectors.toSet());
    }
}
