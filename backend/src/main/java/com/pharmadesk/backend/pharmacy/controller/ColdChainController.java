package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.StorageUnit;
import com.pharmadesk.backend.model.TemperatureLog;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.ColdChainService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/temperature-logs")
public class ColdChainController {

    private final ColdChainService service;

    public ColdChainController(ColdChainService service) {
        this.service = service;
    }

    @GetMapping("/units")
    public ResponseEntity<ApiResponse<List<StorageUnit>>> getUnits() {
        return ResponseEntity.ok(ApiResponse.success(service.getStorageUnits(), "Storage units fetched"));
    }

    @PostMapping("/units")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<StorageUnit>> createUnit(@RequestBody StorageUnit unit) {
        return ResponseEntity.ok(ApiResponse.success(service.createStorageUnit(unit), "Storage unit created"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER','ROLE_PHARMACIST')")
    public ResponseEntity<ApiResponse<TemperatureLog>> record(@Valid @RequestBody TemperatureLog log) {
        return ResponseEntity.ok(ApiResponse.success(service.recordTemperature(log), "Temperature recorded successfully"));
    }

    @PutMapping("/{id}/corrective-action")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR','ROLE_PHARMACIST')")
    public ResponseEntity<ApiResponse<TemperatureLog>> correctiveAction(
            @PathVariable String id, @RequestParam String action, @RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(service.recordCorrectiveAction(id, action, userId), "Corrective action recorded"));
    }

    @GetMapping("/breaches")
    public ResponseEntity<ApiResponse<List<TemperatureLog>>> breaches() {
        return ResponseEntity.ok(ApiResponse.success(service.getBreachLogs(), "Cold chain breach logs fetched"));
    }

    @GetMapping("/chart/{unitId}")
    public ResponseEntity<ApiResponse<List<TemperatureLog>>> getChartLogs(@PathVariable String unitId) {
        return ResponseEntity.ok(ApiResponse.success(service.getLogsByUnit(unitId), "Unit logs fetched"));
    }
}