package com.pharmadesk.backend.service;

import com.pharmadesk.backend.dto.CreateUserRequest;
import com.pharmadesk.backend.dto.UserRequestDto;
import com.pharmadesk.backend.dto.UserResponseDTO;
import com.pharmadesk.backend.model.Role;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.repository.RoleRepository;
import com.pharmadesk.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link UserService}.
 * All dependencies are mocked — no Spring context required.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository  userRepository;
    @Mock RoleRepository  roleRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock com.pharmadesk.backend.mapper.UserMapper userMapper;

    @InjectMocks
    UserService userService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = new User();
        existingUser.setId(1L);
        existingUser.setUsername("john");
        existingUser.setName("John Doe");
        existingUser.setEmail("john@pharmacy.com");
        existingUser.setStatus("ACTIVE");
        existingUser.setMustChangePassword(false);
    }

    // ── createUser ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("createUser: happy path — new user is saved with mustChangePassword=true")
    void createUser_savesUserWithMustChangePassword() {
        CreateUserRequest dto = buildCreateRequest("newuser");
        when(userRepository.findByUsername("newuser")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pass123")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });

        UserResponseDTO mockResponse = new UserResponseDTO();
        when(userMapper.toEntity(dto)).thenReturn(new User());
        when(userMapper.toResponseDto(any())).thenReturn(mockResponse);

        UserResponseDTO result = userService.createUser(dto);

        assertThat(result).isNotNull();
        verify(userRepository).save(argThat(u -> u.isMustChangePassword() && "encoded".equals(u.getPasswordHash())));
    }

    @Test
    @DisplayName("createUser: duplicate username throws IllegalArgumentException")
    void createUser_duplicateUsername_throws() {
        CreateUserRequest dto = buildCreateRequest("john");
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(existingUser));

        assertThatThrownBy(() -> userService.createUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Username already exists");
    }

    // ── toggleStatus ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("toggleStatus: ACTIVE → SUSPENDED")
    void toggleStatus_activeToSuspended() {
        existingUser.setStatus("ACTIVE");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserResponseDTO mockResponse = new UserResponseDTO();
        mockResponse.status = "SUSPENDED";
        when(userMapper.toResponseDto(any())).thenReturn(mockResponse);

        UserResponseDTO result = userService.toggleStatus(1L);

        assertThat(result.status).isEqualTo("SUSPENDED");
    }

    @Test
    @DisplayName("toggleStatus: SUSPENDED → ACTIVE")
    void toggleStatus_suspendedToActive() {
        existingUser.setStatus("SUSPENDED");
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserResponseDTO mockResponse = new UserResponseDTO();
        mockResponse.status = "ACTIVE";
        when(userMapper.toResponseDto(any())).thenReturn(mockResponse);

        UserResponseDTO result = userService.toggleStatus(1L);

        assertThat(result.status).isEqualTo("ACTIVE");
    }

    // ── updateProfile ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateProfile: only non-null fields are updated")
    void updateProfile_partialUpdate() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserResponseDTO mockResponse = new UserResponseDTO();
        mockResponse.name = "Jane Doe";
        mockResponse.email = "jane@pharmacy.com";
        when(userMapper.toResponseDto(any())).thenReturn(mockResponse);

        // Update only name and email, leave rest null
        UserResponseDTO result = userService.updateProfile(1L, "Jane Doe", "jane@pharmacy.com", null, null, null);

        assertThat(result.name).isEqualTo("Jane Doe");
        assertThat(result.email).isEqualTo("jane@pharmacy.com");
        // Original email was john@pharmacy.com; phone etc. untouched
    }

    // ── changePassword ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("changePassword: short password throws IllegalArgumentException")
    void changePassword_shortPassword_throws() {
        assertThatThrownBy(() -> userService.changePassword("john", "abc"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("at least 6");
    }

    @Test
    @DisplayName("changePassword: valid password clears mustChangePassword flag")
    void changePassword_clearsMustChangePasswordFlag() {
        existingUser.setMustChangePassword(true);
        when(userRepository.findByUsername("john")).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("newpass1")).thenReturn("enc");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        userService.changePassword("john", "newpass1");

        verify(userRepository).save(argThat(u -> !u.isMustChangePassword()));
    }

    // ── deleteUser ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteUser: soft-deletes the user")
    void deleteUser_setsDeletedFlag() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));

        userService.deleteUser(1L);

        verify(userRepository).save(argThat(User::isDeleted));
    }

    @Test
    @DisplayName("deleteUser: throws when user not found")
    void deleteUser_notFound_throws() {
        when(userRepository.findById(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("User not found");
    }

    // ── updateUser (admin) ─────────────────────────────────────────────────────

    @Test
    @DisplayName("updateUser: new password is hashed when provided")
    void updateUser_passwordIsHashed() {
        UserRequestDto dto = new UserRequestDto();
        dto.setName("Jane"); dto.setEmail("j@j.com"); dto.setPhone("123");
        dto.setBranch("MAIN"); dto.setShift("DAY"); dto.setStatus("ACTIVE");
        dto.setPassword("newPass99");

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("newPass99")).thenReturn("hashed");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        doNothing().when(userMapper).updateEntityFromRequest(any(), any());
        when(userMapper.toResponseDto(any())).thenReturn(new UserResponseDTO());

        userService.updateUser(1L, dto);

        verify(passwordEncoder).encode("newPass99");
        verify(userRepository).save(argThat(u -> "hashed".equals(u.getPasswordHash())));
    }

    @Test
    @DisplayName("updateUser: password not touched when blank")
    void updateUser_blankPassword_notHashed() {
        UserRequestDto dto = new UserRequestDto();
        dto.setName("Jane"); dto.setEmail("j@j.com"); dto.setPhone("123");
        dto.setBranch("MAIN"); dto.setShift("DAY"); dto.setStatus("ACTIVE");
        dto.setPassword(""); // blank — should not re-hash

        when(userRepository.findById(1L)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        doNothing().when(userMapper).updateEntityFromRequest(any(), any());
        when(userMapper.toResponseDto(any())).thenReturn(new UserResponseDTO());

        userService.updateUser(1L, dto);

        verify(passwordEncoder, never()).encode(any());
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private CreateUserRequest buildCreateRequest(String username) {
        CreateUserRequest r = new CreateUserRequest();
        r.setUsername(username);
        r.setPassword("pass123");
        r.setName("Test User");
        r.setEmail("test@pharmacy.com");
        r.setPhone("9876543210");
        r.setBranch("MAIN");
        r.setShift("MORNING");
        return r;
    }
}
