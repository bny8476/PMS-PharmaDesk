package com.pharmadesk.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pharmadesk.backend.dto.CreateUserRequest;
import com.pharmadesk.backend.dto.LoginRequest;
import com.pharmadesk.backend.dto.UserResponseDTO;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.repository.UserRepository;
import com.pharmadesk.backend.security.CustomUserDetails;
import com.pharmadesk.backend.security.JwtUtils;
import com.pharmadesk.backend.service.OtpService;
import com.pharmadesk.backend.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Unit tests for {@link AuthController}.
 * Mocks {@link UserService} so controller behaviour can be verified in isolation.
 */
@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock private AuthenticationManager authenticationManager;
    @Mock private JwtUtils              jwtUtils;
    @Mock private UserService           userService;
    @Mock private UserRepository        userRepository;   // kept for JWT refresh-endpoint lookup
    @Mock private OtpService            otpService;
    @Mock private RedisTemplate<String, Object> redisTemplate;

    @InjectMocks
    private AuthController authController;

    private final ObjectMapper mapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
    }

    // ── login ─────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — valid credentials return JWT cookie + 200")
    void login_validCredentials_returnsJwtAndOk() throws Exception {
        LoginRequest req = loginRequest("testuser", "password123");

        User user = new User();
        user.setId(1L);
        user.setUsername("testuser");
        user.setName("Test User");
        user.setMustChangePassword(false);

        Authentication auth = mock(Authentication.class);
        CustomUserDetails details = mock(CustomUserDetails.class);
        when(details.getUser()).thenReturn(user);
        when(auth.getPrincipal()).thenReturn(details);
        doReturn(Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER")))
                .when(auth).getAuthorities();

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(auth);
        when(jwtUtils.generateJwtToken(auth)).thenReturn("mock-jwt");
        doNothing().when(userService).recordLastLogin(anyLong());

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(header().exists("Set-Cookie"))
                .andExpect(header().string("Set-Cookie", org.hamcrest.Matchers.containsString("jwt=mock-jwt")))
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("mock-jwt"));
    }

    @Test
    @DisplayName("POST /api/auth/login — bad credentials return 401")
    void login_badCredentials_returns401() throws Exception {
        LoginRequest req = loginRequest("testuser", "wrongpass");
        when(authenticationManager.authenticate(any()))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    // ── createUser ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/users — valid request delegates to UserService and returns 200")
    void createUser_valid_returns200() throws Exception {
        CreateUserRequest req = createUserRequest("newuser");

        UserResponseDTO dto = new UserResponseDTO();
        dto.id       = 5L;
        dto.username = "newuser";
        dto.status   = "ACTIVE";

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(dto);

        mockMvc.perform(post("/api/auth/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.username").value("newuser"));
    }

    @Test
    @DisplayName("POST /api/auth/users — duplicate username returns 400 via service exception")
    void createUser_duplicateUsername_returns400() throws Exception {
        CreateUserRequest req = createUserRequest("existinguser");
        when(userService.createUser(any(CreateUserRequest.class)))
                .thenThrow(new IllegalArgumentException("Username already exists: existinguser"));

        mockMvc.perform(post("/api/auth/users")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── changePassword ────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/change-password — unauthenticated returns 401")
    void changePassword_unauthenticated_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/change-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"newpass1\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private LoginRequest loginRequest(String username, String password) {
        LoginRequest r = new LoginRequest();
        r.setUsername(username);
        r.setPassword(password);
        return r;
    }

    private CreateUserRequest createUserRequest(String username) {
        CreateUserRequest r = new CreateUserRequest();
        r.setUsername(username);
        r.setPassword("password123");
        r.setName("Test Name");
        r.setEmail("test@pharmacy.com");
        r.setPhone("9876543210");
        r.setBranch("MAIN");
        r.setShift("MORNING");
        r.setRoles(List.of("ROLE_PHARMACIST"));
        return r;
    }
}
