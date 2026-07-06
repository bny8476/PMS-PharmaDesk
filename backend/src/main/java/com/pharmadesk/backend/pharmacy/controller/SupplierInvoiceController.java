package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.SupplierInvoice;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.SupplierInvoiceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/supplier-invoices")
public class SupplierInvoiceController {

    private final SupplierInvoiceService invoiceService;

    public SupplierInvoiceController(SupplierInvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierInvoice>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getAll(), "Invoices fetched"));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<List<SupplierInvoice>>> getBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getBySupplier(supplierId), "Invoices fetched"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierInvoice>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getById(id), "Invoice found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> create(@Valid @RequestBody SupplierInvoice invoice) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.createInvoice(invoice), "Invoice created"));
    }

    @PostMapping("/{id}/match")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> performMatch(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.performMatching(id), "Matching completed"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<SupplierInvoice>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.updateStatus(id, status), "Status updated"));
    }

    @GetMapping("/supplier/{supplierId}/outstanding")
    public ResponseEntity<ApiResponse<BigDecimal>> getOutstanding(@PathVariable Long supplierId) {
        return ResponseEntity.ok(ApiResponse.success(invoiceService.getOutstandingBalance(supplierId), "Outstanding balance"));
    }
}