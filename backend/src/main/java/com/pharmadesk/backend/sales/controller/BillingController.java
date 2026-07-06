package com.pharmadesk.backend.sales.controller;

import com.pharmadesk.backend.model.*;
import com.pharmadesk.backend.sales.model.*;

import com.pharmadesk.backend.sales.model.PharmacyBill;
import com.pharmadesk.backend.sales.repository.PharmacyBillRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/bills")
public class BillingController {

    private final PharmacyBillRepository billRepository;

    public BillingController(PharmacyBillRepository billRepository) {
        this.billRepository = billRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<PharmacyBill>>> getBills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<PharmacyBill> bills = billRepository.searchBills(type, status, from, to, pageable);
        return ResponseEntity.ok(ApiResponse.success(bills, "Bills fetched successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PharmacyBill>> createBill(@RequestBody PharmacyBill bill) {
        // Implementation for bill creation
        return ResponseEntity.ok(ApiResponse.success(billRepository.save(bill), "Bill created successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PharmacyBill>> getBill(@PathVariable Long id) {
        return billRepository.findById(id)
                .map(bill -> ResponseEntity.ok(ApiResponse.success(bill, "Bill fetched successfully")))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PharmacyBill>> cancelBill(@PathVariable Long id) {
        return billRepository.findById(id).map(bill -> {
            bill.setStatus("CANCELLED");
            return ResponseEntity.ok(ApiResponse.success(billRepository.save(bill), "Bill cancelled successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/payment")
    public ResponseEntity<ApiResponse<PharmacyBill>> updatePaymentStatus(@PathVariable Long id, @RequestBody String newStatus) {
        return billRepository.findById(id).map(bill -> {
            bill.setStatus(newStatus);
            return ResponseEntity.ok(ApiResponse.success(billRepository.save(bill), "Payment status updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }
}
