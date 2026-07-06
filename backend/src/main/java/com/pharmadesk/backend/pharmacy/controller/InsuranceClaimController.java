package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.InsuranceClaim;
import com.pharmadesk.backend.model.InsuranceProvider;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.InsuranceClaimService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.pharmadesk.backend.pharmacy.dto.common.PageResponse;
import java.util.List;

@RestController
@RequestMapping("/api/insurance-claims")
public class InsuranceClaimController {

    private final InsuranceClaimService service;

    public InsuranceClaimController(InsuranceClaimService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<InsuranceClaim>>> getClaims(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        Sort.Direction dir = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, sort[0]));
        return ResponseEntity.ok(ApiResponse.success(service.getAllClaims(pageRequest), "Claims fetched"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<InsuranceClaim>> getClaim(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(service.getClaimById(id), "Claim details"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_BILLING_STAFF','ROLE_CASHIER')")
    public ResponseEntity<ApiResponse<InsuranceClaim>> create(@Valid @RequestBody InsuranceClaim claim) {
        return ResponseEntity.ok(ApiResponse.success(service.createClaim(claim), "Claim draft created successfully"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_ACCOUNTS_MANAGER','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<InsuranceClaim>> updateStatus(@PathVariable String id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(service.updateClaimStatus(id, status), "Claim status updated"));
    }

    @GetMapping("/providers")
    public ResponseEntity<ApiResponse<PageResponse<InsuranceProvider>>> getProviders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        Sort.Direction dir = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, sort[0]));
        return ResponseEntity.ok(ApiResponse.success(service.getAllProviders(pageRequest), "Insurance providers fetched"));
    }

    @PostMapping("/providers")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<InsuranceProvider>> createProvider(@Valid @RequestBody InsuranceProvider provider) {
        return ResponseEntity.ok(ApiResponse.success(service.createProvider(provider), "Insurance provider configured"));
    }
}