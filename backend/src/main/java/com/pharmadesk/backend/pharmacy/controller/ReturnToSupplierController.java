package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.ReturnToSupplier;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.ReturnToSupplierService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/supplier-returns")
public class ReturnToSupplierController {

    private final ReturnToSupplierService returnService;

    public ReturnToSupplierController(ReturnToSupplierService returnService) {
        this.returnService = returnService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReturnToSupplier>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(returnService.getAll(), "Returns fetched"));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<List<ReturnToSupplier>>> getBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(ApiResponse.success(returnService.getBySupplier(supplierId), "Returns fetched"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnToSupplier>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(returnService.getById(id), "Return found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<ReturnToSupplier>> create(@Valid @RequestBody ReturnToSupplier returnToSupplier) {
        return ResponseEntity.ok(ApiResponse.success(returnService.createReturn(returnToSupplier), "Return initiated and stock deducted"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<ReturnToSupplier>> updateStatus(
            @PathVariable Long id,
            @RequestParam String status,
            @RequestParam(required = false) String creditNoteNumber,
            @RequestParam(required = false) BigDecimal actualCreditValue) {
        return ResponseEntity.ok(ApiResponse.success(
                returnService.updateStatus(id, status, creditNoteNumber, actualCreditValue), "Status updated"));
    }
}