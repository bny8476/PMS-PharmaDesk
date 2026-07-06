package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.DrugInteraction;
import com.pharmadesk.backend.model.DrugInteractionCheck;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.DrugInteractionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.pharmadesk.backend.pharmacy.dto.common.PageResponse;
import java.util.List;

@RestController
@RequestMapping("/api/drug-interactions")
public class DrugInteractionController {

    private final DrugInteractionService service;

    public DrugInteractionController(DrugInteractionService service) {
        this.service = service;
    }

    @PostMapping("/check")
    public ResponseEntity<ApiResponse<List<DrugInteraction>>> check(@RequestBody List<Long> medicineIds) {
        return ResponseEntity.ok(ApiResponse.success(service.checkInteractions(medicineIds), "Interaction check complete"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<DrugInteraction>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "medicineAId,asc") String[] sort) {
        Sort.Direction dir = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, sort[0]));
        return ResponseEntity.ok(ApiResponse.success(service.getAllInteractions(pageRequest), "Interactions fetched"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR','ROLE_PHARMACY_OWNER')")
    public ResponseEntity<ApiResponse<DrugInteraction>> create(@RequestBody DrugInteraction interaction) {
        return ResponseEntity.ok(ApiResponse.success(service.createInteraction(interaction), "Adverse interaction rule added"));
    }

    @PostMapping("/log-check")
    public ResponseEntity<ApiResponse<DrugInteractionCheck>> logCheck(@Valid @RequestBody DrugInteractionCheck check) {
        return ResponseEntity.ok(ApiResponse.success(service.logInteractionCheck(check), "Interaction audit log recorded"));
    }

    @GetMapping("/incident-report")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_AUDIT_COMPLIANCE','ROLE_SUPERVISOR','ROLE_PHARMACY_OWNER','ROLE_PHARMACY_STAFF')")
    public ResponseEntity<ApiResponse<PageResponse<DrugInteractionCheck>>> getIncidents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "checkedAt,desc") String[] sort) {
        Sort.Direction dir = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, sort[0]));
        return ResponseEntity.ok(ApiResponse.success(service.getIncidentReport(pageRequest), "Interaction overrides and checks logged"));
    }
}