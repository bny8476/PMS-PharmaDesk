package com.pharmadesk.backend.controller;

import com.pharmadesk.backend.model.Role;
import com.pharmadesk.backend.repository.RoleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;

import java.util.List;

@RestController
@RequestMapping("/api/auth/roles")
public class RoleController {

    private final RoleRepository roleRepository;

    public RoleController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<Role>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success(roleRepository.findAll(), "Roles fetched successfully"));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Role>> createRole(@RequestBody Role role) {
        if (role.getIsSystemDefault() == null) {
            role.setIsSystemDefault(false);
        }
        return ResponseEntity.ok(ApiResponse.success(roleRepository.save(role), "Role created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Role>> updateRole(@PathVariable Long id, @RequestBody Role updatedRole) {
        return roleRepository.findById(id).map(role -> {
            role.setName(updatedRole.getName());
            role.setColor(updatedRole.getColor());
            role.setPermissionsJson(updatedRole.getPermissionsJson());
            return ResponseEntity.ok(ApiResponse.success(roleRepository.save(role), "Role updated successfully"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable Long id) {
        return roleRepository.findById(id).map(role -> {
            if (Boolean.TRUE.equals(role.getIsSystemDefault())) {
                return ResponseEntity.badRequest().body(ApiResponse.<Void>error("Cannot delete system default role"));
            }
            roleRepository.delete(role);
            return ResponseEntity.ok(ApiResponse.<Void>success(null, "Role deleted successfully"));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}
