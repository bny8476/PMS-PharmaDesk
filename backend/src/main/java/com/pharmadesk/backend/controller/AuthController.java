package com.pharmadesk.backend.controller;

import com.pharmadesk.backend.dto.CreateUserRequest;
import com.pharmadesk.backend.dto.UserRequestDto;
import com.pharmadesk.backend.dto.UserResponseDTO;
import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.security.CustomUserDetails;
import com.pharmadesk.backend.security.JwtUtils;
import com.pharmadesk.backend.dto.LoginRequest;
import com.pharmadesk.backend.repository.UserRepository;
import com.pharmadesk.backend.service.UserService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.redis.core.RedisTemplate;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;

import java.security.Principal;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * Handles authentication (login, logout, token refresh, OTP, password changes)
 * and user management CRUD. Business logic is delegated to {@link UserService}.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;
    private final UserService userService;
    private final UserRepository userRepository; // used only for JWT token lookups
    private final com.pharmadesk.backend.service.OtpService otpService;
    private final RedisTemplate<String, Object> redisTemplate;

    public AuthController(AuthenticationManager authenticationManager,
                          JwtUtils jwtUtils,
                          UserService userService,
                          UserRepository userRepository,
                          com.pharmadesk.backend.service.OtpService otpService,
                          RedisTemplate<String, Object> redisTemplate) {
        this.authenticationManager = authenticationManager;
        this.jwtUtils              = jwtUtils;
        this.userService           = userService;
        this.userRepository        = userRepository;
        this.otpService            = otpService;
        this.redisTemplate         = redisTemplate;
    }

    // ── OTP ───────────────────────────────────────────────────────────────────

    @PostMapping("/otp/send")
    public ResponseEntity<ApiResponse<Void>> sendOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email is required"));
        }
        otpService.sendOtp(email);
        return ResponseEntity.ok(ApiResponse.success(null, "OTP sent successfully to " + email));
    }

    @PostMapping("/otp/verify")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String code  = request.get("code");
        if (email == null || code == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Email and code are required"));
        }
        boolean verified = otpService.verifyOtp(email, code);
        return verified
                ? ResponseEntity.ok(ApiResponse.success(null, "OTP verified successfully"))
                : ResponseEntity.status(401).body(ApiResponse.error("Invalid or expired OTP code"));
    }

    // ── Login / Logout / Refresh ───────────────────────────────────────────────

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> authenticateUser(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletResponse response) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(), loginRequest.getPassword()));

            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = jwtUtils.generateJwtToken(authentication);
            setJwtCookie(response, jwt, 3600);

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            User user = userDetails.getUser();

            // Update last-login asynchronously — no need to block the response
            CompletableFuture.runAsync(() -> userService.recordLastLogin(user.getId()));

            List<String> roleNames = authentication.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .map(r -> r.replace("ROLE_", ""))
                    .collect(Collectors.toList());

            Map<String, Object> data = new HashMap<>();
            data.put("id",                user.getId());
            data.put("name",              user.getName());
            data.put("username",          user.getUsername());
            data.put("email",             user.getEmail());
            data.put("branch",            user.getBranch());
            data.put("roles",             roleNames);
            data.put("mustChangePassword", user.isMustChangePassword());
            data.put("token",             jwt);

            return ResponseEntity.ok(ApiResponse.success(data, "Login successful"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(401).body(ApiResponse.error("Invalid username or password"));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        String token = getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            String jti = jwtUtils.getJtiFromJwtToken(token);
            if (Boolean.TRUE.equals(redisTemplate.hasKey("jwt_blacklist:" + jti))) {
                return ResponseEntity.status(401).body(ApiResponse.error("Token has been revoked"));
            }
            String username = jwtUtils.getUserNameFromJwtToken(token);
            userRepository.findByUsername(username).ifPresent(user -> {
                Authentication auth = new UsernamePasswordAuthenticationToken(
                        user, null, jwtUtils.getAuthoritiesFromJwtToken(token));
                String newJwt = jwtUtils.generateJwtToken(auth);
                setJwtCookie(response, newJwt, 3600);
            });
            return ResponseEntity.ok(ApiResponse.success(null, "Token refreshed"));
        }
        return ResponseEntity.status(401).body(ApiResponse.error("Invalid or expired token"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logoutUser(
            HttpServletRequest request,
            HttpServletResponse response,
            Principal principal) {
        String token = getJwtFromCookies(request);
        if (token != null && jwtUtils.validateJwtToken(token)) {
            String jti  = jwtUtils.getJtiFromJwtToken(token);
            Date expiry = jwtUtils.getExpirationFromJwtToken(token);
            long ttl    = expiry.getTime() - System.currentTimeMillis();
            if (ttl > 0) {
                redisTemplate.opsForValue().set("jwt_blacklist:" + jti, "true", ttl, TimeUnit.MILLISECONDS);
            }
        }
        setJwtCookie(response, "", 0);
        if (principal != null) {
            userService.recordLastLogout(principal.getName());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out"));
    }

    // ── User CRUD (admin) ──────────────────────────────────────────────────────

    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponseDTO>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllUsers(), "Users fetched"));
    }

    @PostMapping("/users")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<UserResponseDTO>> createUser(@Valid @RequestBody CreateUserRequest dto) {
        try {
            UserResponseDTO created = userService.createUser(dto);
            return ResponseEntity.ok(ApiResponse.success(created, "Staff created"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/users/{id}/profile")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateProfile(
            @PathVariable Long id,
            @RequestBody Map<String, String> req,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        // Authorisation: users may only update their own profile
        userRepository.findById(id).ifPresent(u -> {
            if (!u.getUsername().equals(principal.getName())) {
                throw new RuntimeException("Access denied");
            }
        });
        try {
            UserResponseDTO updated = userService.updateProfile(
                    id,
                    req.get("name"),
                    req.get("email"),
                    req.get("phone"),
                    req.getOrDefault("branch", req.get("location")),
                    req.get("shift"));
            return ResponseEntity.ok(ApiResponse.success(updated, "Profile updated successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponseDTO>> updateUser(
            @PathVariable Long id,
            @RequestBody UserRequestDto dto) {
        UserResponseDTO updated = userService.updateUser(id, dto);
        return ResponseEntity.ok(ApiResponse.success(updated, "Staff updated"));
    }

    @PutMapping("/users/{id}/status")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponseDTO>> toggleUserStatus(@PathVariable Long id) {
        UserResponseDTO updated = userService.toggleStatus(id);
        String msg = "ACTIVE".equals(updated.status) ? "activated" : "suspended";
        return ResponseEntity.ok(ApiResponse.success(updated, "User " + msg + " successfully"));
    }

    @PostMapping("/users/{id}/reset-password")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, String>>> resetUserPassword(@PathVariable Long id) {
        Map<String, String> result = userService.resetPassword(id);
        return ResponseEntity.ok(ApiResponse.success(result, "Password reset successfully"));
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Staff deleted"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @RequestBody Map<String, String> request,
            Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        try {
            userService.changePassword(principal.getName(), request.get("newPassword"));
            return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String getJwtFromCookies(HttpServletRequest request) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("jwt".equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    private void setJwtCookie(HttpServletResponse response, String value, long maxAgeSecs) {
        ResponseCookie cookie = ResponseCookie.from("jwt", value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .maxAge(maxAgeSecs)
                .path("/")
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
