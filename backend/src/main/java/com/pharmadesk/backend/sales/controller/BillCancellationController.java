package com.pharmadesk.backend.sales.controller;

import com.pharmadesk.backend.sales.model.BillCancellationRequest;
import com.pharmadesk.backend.sales.service.BillCancellationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;

import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy/bills/cancellations")
public class BillCancellationController {

    private final BillCancellationService service;

    public BillCancellationController(BillCancellationService service) {
        this.service = service;
    }

    @PostMapping("/request")
    public ResponseEntity<ApiResponse<BillCancellationRequest>> requestCancellation(
            @RequestBody Map<String, Object> payload, Authentication auth) {
        Long billId = Long.valueOf(payload.get("billId").toString());
        String reason = payload.get("reason").toString();
        String requestedBy = auth.getName();
        return ResponseEntity.ok(ApiResponse.success(service.requestCancellation(billId, reason, requestedBy), "Cancellation requested"));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN', 'ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<BillCancellationRequest>> approveCancellation(
            @PathVariable Long id, Authentication auth) {
        String reviewedBy = auth.getName();
        return ResponseEntity.ok(ApiResponse.success(service.approveCancellation(id, reviewedBy), "Cancellation approved"));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN', 'ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<BillCancellationRequest>> rejectCancellation(
            @PathVariable Long id, @RequestBody Map<String, String> payload, Authentication auth) {
        String reason = payload.get("reason");
        String reviewedBy = auth.getName();
        return ResponseEntity.ok(ApiResponse.success(service.rejectCancellation(id, reason, reviewedBy), "Cancellation rejected"));
    }
}
