package com.pharmadesk.backend.security;

import com.pharmadesk.backend.model.User;
import com.pharmadesk.backend.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    public UserDetailsServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found: " + username));

        // Block SUSPENDED and INACTIVE users at the Spring Security layer
        boolean accountEnabled = user.getStatus() == null || "ACTIVE".equalsIgnoreCase(user.getStatus());

        List<SimpleGrantedAuthority> authorities = user.getRoles() == null
                ? new java.util.ArrayList<>()
                : user.getRoles().stream()
                    .filter(role -> role != null && role.getName() != null)
                    .map(role -> {
                        String name = role.getName().replace(" ", "_").toUpperCase();
                        if (!name.startsWith("ROLE_")) name = "ROLE_" + name;
                        return new SimpleGrantedAuthority(name);
                    })
                    .collect(Collectors.toList());

        // Fallback to legacy role column if user_roles set is empty
        if (authorities.isEmpty() && user.getLegacyRole() != null && !user.getLegacyRole().isBlank()) {
            String legacy = user.getLegacyRole().replace(" ", "_").toUpperCase();
            if ("ADMIN".equals(legacy)) legacy = "SYSTEM_ADMIN";
            if (!legacy.startsWith("ROLE_")) legacy = "ROLE_" + legacy;
            authorities.add(new SimpleGrantedAuthority(legacy));
        }

        // Default fallback role if both are missing to allow login
        if (authorities.isEmpty()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        return new CustomUserDetails(
                user,
                accountEnabled,   // enabled — false = login rejected for SUSPENDED/INACTIVE
                true,             // accountNonExpired
                true,             // credentialsNonExpired
                true,             // accountNonLocked
                authorities
        );
    }
}
