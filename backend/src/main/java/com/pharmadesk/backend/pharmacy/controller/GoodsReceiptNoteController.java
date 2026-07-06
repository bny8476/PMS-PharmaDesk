package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.GoodsReceiptNote;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.service.GoodsReceiptNoteService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import com.pharmadesk.backend.pharmacy.dto.common.PageResponse;
import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/grns")
public class GoodsReceiptNoteController {

    private final GoodsReceiptNoteService grnService;

    public GoodsReceiptNoteController(GoodsReceiptNoteService grnService) {
        this.grnService = grnService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<GoodsReceiptNote>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String[] sort) {
        Sort.Direction dir = sort[1].equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(dir, sort[0]));
        return ResponseEntity.ok(ApiResponse.success(grnService.getAll(pageRequest), "GRNs fetched"));
    }

    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<List<GoodsReceiptNote>>> getBySupplier(@PathVariable Long supplierId) {
        return ResponseEntity.ok(ApiResponse.success(grnService.getBySupplier(supplierId), "GRNs fetched"));
    }

    @GetMapping("/po/{poId}")
    public ResponseEntity<ApiResponse<List<GoodsReceiptNote>>> getByPo(@PathVariable String poId) {
        return ResponseEntity.ok(ApiResponse.success(grnService.getByPo(poId), "GRNs fetched"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GoodsReceiptNote>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(grnService.getById(id), "GRN found"));
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<GoodsReceiptNote>> create(@Valid @RequestBody GoodsReceiptNote grn) {
        return ResponseEntity.ok(ApiResponse.success(grnService.createGrn(grn), "GRN created"));
    }

    @PostMapping("/{id}/confirm")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<GoodsReceiptNote>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(grnService.confirmGrn(id), "GRN confirmed and stock updated"));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER')")
    public ResponseEntity<ApiResponse<GoodsReceiptNote>> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.success(grnService.updateStatus(id, status), "Status updated"));
    }
}