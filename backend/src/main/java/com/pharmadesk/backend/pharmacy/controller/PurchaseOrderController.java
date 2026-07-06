package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.PurchaseOrder;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.PurchaseOrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import com.pharmadesk.backend.pharmacy.dto.common.PageResponse;

@RestController
@RequestMapping({"/api/purchase-orders", "/api/pharmacy/purchase-orders"})
public class PurchaseOrderController {

    private final PurchaseOrderService service;

    public PurchaseOrderController(PurchaseOrderService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<PurchaseOrder>>> getPOs(
            @RequestParam(value = "status",     required = false) String status,
            @RequestParam(value = "searchTerm", required = false) String searchTerm,
            @RequestParam(value = "page",       defaultValue = "0")  int page,
            @RequestParam(value = "size",       defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {

        Sort.Direction dir = sort.length > 1 && sort[1].equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(dir, sort[0]));

        // TopNav badge call: ?status=PENDING&size=20 — return Page so frontend counts totalElements
        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("ALL")) {
            String dbStatus = switch (status.toUpperCase()) {
                case "PENDING"  -> "submitted";
                case "RECEIVED" -> "completed";
                default         -> status.toLowerCase();
            };
            java.util.List<String> valid = java.util.List.of(
                    "draft","submitted","approved","sent","partially_received","completed","cancelled");
            if (!valid.contains(dbStatus)) {
                return ResponseEntity.ok(ApiResponse.success(
                        new PageResponse<>(List.of(), 0, 0, 0, size), "No POs found"));
            }
            PageResponse<PurchaseOrder> poPage =
                    service.getPOsByStatusPaged(dbStatus, pageable);
            return ResponseEntity.ok(ApiResponse.success(poPage, "POs fetched"));
        }

        // Normal list call with optional searchTerm
        PageResponse<PurchaseOrder> poPage =
                (searchTerm != null && !searchTerm.isBlank())
                        ? service.searchPOs(searchTerm.trim(), pageable)
                        : service.getAllPosPaged(pageable);
        return ResponseEntity.ok(ApiResponse.success(poPage, "POs fetched"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseOrder>> getPO(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(service.getPoById(id), "PO details"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> create(@Valid @RequestBody PurchaseOrder po) {
        return ResponseEntity.ok(ApiResponse.success(service.createPO(po), "PO created successfully"));
    }

    @PutMapping("/{id}/submit")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> submit(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(service.submitForApproval(id), "PO submitted"));
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> approve(@PathVariable String id, @RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(service.approvePO(id, userId), "PO approved"));
    }

    @PutMapping("/{id}/send")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> send(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success(service.sendToSupplier(id), "PO sent to supplier"));
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PURCHASE_MANAGER')")
    public ResponseEntity<ApiResponse<PurchaseOrder>> cancel(@PathVariable String id, @RequestParam String reason, @RequestParam Long userId) {
        return ResponseEntity.ok(ApiResponse.success(service.cancelPO(id, reason, userId), "PO cancelled"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.deletePO(id);
        return ResponseEntity.ok(ApiResponse.success(null, "PO deleted successfully"));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary() {
        return ResponseEntity.ok(ApiResponse.success(service.getPoSummary(), "PO summary stats"));
    }
}