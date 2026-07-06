package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.Supplier;
import com.pharmadesk.backend.model.SupplierPerformance;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.SupplierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Supplier>>> getAllSuppliers() {
        List<Supplier> suppliers = supplierService.getAllSuppliers();
        return ResponseEntity.ok(ApiResponse.success(suppliers, "Suppliers fetched successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Supplier>> getSupplier(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getById(id), "Supplier found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<Supplier>> createSupplier(@Valid @RequestBody Supplier supplier) {
        Supplier createdSupplier = supplierService.createSupplier(supplier);
        return ResponseEntity.ok(ApiResponse.success(createdSupplier, "Supplier created successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<Supplier>> updateSupplier(@PathVariable Long id, @Valid @RequestBody Supplier supplier) {
        Supplier updatedSupplier = supplierService.updateSupplier(id, supplier);
        return ResponseEntity.ok(ApiResponse.success(updatedSupplier, "Supplier updated successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<Void>> deleteSupplier(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier deleted successfully"));
    }

    @GetMapping("/{id}/performance")
    public ResponseEntity<ApiResponse<List<SupplierPerformance>>> getPerformance(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.getPerformanceHistory(id), "Performance history"));
    }

    @PostMapping("/{id}/performance")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<SupplierPerformance>> savePerformance(
            @PathVariable Long id, @RequestBody SupplierPerformance performance) {
        return ResponseEntity.ok(ApiResponse.success(supplierService.savePerformanceScore(id, performance), "Performance saved"));
    }
}