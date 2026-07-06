package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.ReportSchedule;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.repository.ReportScheduleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/report-schedules")
public class ReportScheduleController {

    private final ReportScheduleRepository repo;

    public ReportScheduleController(ReportScheduleRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReportSchedule>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(repo.findAll(), "Schedules fetched"));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<ReportSchedule>>> getActive() {
        return ResponseEntity.ok(ApiResponse.success(repo.findByActiveTrue(), "Active schedules"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReportSchedule>> getById(@PathVariable Long id) {
        return repo.findById(id)
                .map(s -> ResponseEntity.ok(ApiResponse.success(s, "Schedule found")))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ReportSchedule>> create(@Valid @RequestBody ReportSchedule schedule) {
        return ResponseEntity.ok(ApiResponse.success(repo.save(schedule), "Schedule created"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ReportSchedule>> update(@PathVariable Long id, @RequestBody ReportSchedule details) {
        return repo.findById(id).map(s -> {
            s.setScheduleName(details.getScheduleName());
            s.setReportType(details.getReportType());
            s.setReportCategory(details.getReportCategory());
            s.setFrequency(details.getFrequency());
            s.setCronExpression(details.getCronExpression());
            s.setDeliveryTime(details.getDeliveryTime());
            s.setChannels(details.getChannels());
            s.setEmailRecipients(details.getEmailRecipients());
            s.setWhatsappNumbers(details.getWhatsappNumbers());
            s.setFileFormats(details.getFileFormats());
            s.setReportParams(details.getReportParams());
            s.setActive(details.isActive());
            return ResponseEntity.ok(ApiResponse.success(repo.save(s), "Schedule updated"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<ReportSchedule>> toggle(@PathVariable Long id) {
        return repo.findById(id).map(s -> {
            s.setActive(!s.isActive());
            return ResponseEntity.ok(ApiResponse.success(repo.save(s), "Toggled"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Schedule deleted"));
    }
}