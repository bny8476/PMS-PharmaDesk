package com.pharmadesk.backend.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    
    @org.springframework.beans.factory.annotation.Value("${cors.allowed-origin}")
    private String allowedOrigin;

    private final JwtAuthenticationFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(10);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Authentication required\"}");
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    response.setStatus(jakarta.servlet.http.HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"success\":false,\"message\":\"Access denied: insufficient permissions\"}");
                })
            )
            .authorizeHttpRequests(auth -> auth
                // Allow CORS preflight
                .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                
                // Public endpoints
                .requestMatchers("/api/auth/login", "/api/auth/register", "/api/auth/logout", "/api/auth/otp/**", "/api/auth/refresh").permitAll()
                .requestMatchers("/api/system/**", "/api/config/public", "/api/lookups/bulk").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/actuator/**").hasAuthority("ROLE_SYSTEM_ADMIN")

                // Allow authenticated users to update their own profile
                .requestMatchers("/api/auth/users/*/profile").authenticated()

                // Admin-only endpoints
                .requestMatchers("/api/auth/users", "/api/auth/users/**").hasAuthority("ROLE_SYSTEM_ADMIN")
                .requestMatchers("/api/auth/roles", "/api/auth/roles/**").hasAuthority("ROLE_SYSTEM_ADMIN")

                // Analytics endpoints
                .requestMatchers("/api/analytics/**").authenticated()

                // Pharmacy endpoints
                .requestMatchers("/api/pharmacy/**").authenticated()
                .requestMatchers("/api/pharmacy/dashboard", "/api/pharmacy/dashboard/**").authenticated()
                
                // Other pharmacy sub-paths (advances, prescriptions, credit-bills, etc.)
                .requestMatchers("/api/pharmacy/**").authenticated()

                // All other /api/** endpoints
                .requestMatchers("/api/**").authenticated()
                .anyRequest().authenticated()
            );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        java.util.Set<String> origins = new java.util.LinkedHashSet<>();
        origins.add("http://localhost:5173");
        origins.add("http://127.0.0.1:5173");
        origins.add("http://localhost:5174");
        origins.add("http://127.0.0.1:5174");
        origins.add("https://pms-pharma-desk-bny2.vercel.app");
        origins.add("https://pms-pharma-desk.vercel.app");
        if (allowedOrigin != null && !allowedOrigin.isBlank()) {
            for (String origin : allowedOrigin.split(",")) {
                if (!origin.isBlank()) {
                    origins.add(origin.trim());
                }
            }
        }
        configuration.setAllowedOrigins(new java.util.ArrayList<>(origins));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
