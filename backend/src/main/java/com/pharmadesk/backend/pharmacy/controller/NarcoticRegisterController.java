package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.NarcoticRegister;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.repository.NarcoticRegisterRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.repository.PatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/pharmacy/narcotic-register")
public class NarcoticRegisterController {

    private final NarcoticRegisterRepository narcoticRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;
    private final PatientRepository patientRepository;

    public NarcoticRegisterController(NarcoticRegisterRepository narcoticRepository,
                                      MedicineRepository medicineRepository,
                                      MedicineStockRepository stockRepository,
                                      PatientRepository patientRepository) {
        this.narcoticRepository = narcoticRepository;
        this.medicineRepository = medicineRepository;
        this.stockRepository = stockRepository;
        this.patientRepository = patientRepository;
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_AUDIT_COMPLIANCE','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<List<NarcoticRegister>>> getRegister(
            @RequestParam Long medicineId,
            @RequestParam String from,
            @RequestParam String to) {
        LocalDateTime start = LocalDate.parse(from).atStartOfDay();
        LocalDateTime end = LocalDate.parse(to).atTime(23, 59, 59);
        List<NarcoticRegister> entries = narcoticRepository.findByMedicineIdAndEntryDateBetween(medicineId, start, end);
        return ResponseEntity.ok(ApiResponse.success(entries, "Narcotic register entries fetched"));
    }

    @PostMapping("/entry")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_SUPERVISOR','ROLE_PHARMACY_STAFF')")
    public ResponseEntity<ApiResponse<NarcoticRegister>> createEntry(@Valid @RequestBody NarcoticRegister entry) {
        // Validation and opening/closing balance calculation
        var medicine = medicineRepository.findById(entry.getMedicine().getId())
                .orElseThrow(() -> new RuntimeException("Medicine not found"));
        var stock = stockRepository.findById(entry.getBatch().getId())
                .orElseThrow(() -> new RuntimeException("Stock batch not found"));

        int latestClosingBalance = narcoticRepository.findLatestEntry(medicine.getId())
                .map(NarcoticRegister::getClosingBalance)
                .orElse(stock.getQuantityAvailable() + entry.getQuantityDispensed()); // default to current stock plus dispensed if first entry

        entry.setSerialNumber("NAR-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        entry.setOpeningBalance(latestClosingBalance);
        entry.setClosingBalance(latestClosingBalance - entry.getQuantityDispensed());
        entry.setMedicine(medicine);
        entry.setBatch(stock);

        if (entry.getQuantityDispensed() > entry.getQuantityPrescribed()) {
            entry.setDiscrepancyFlag(true);
        }

        NarcoticRegister saved = narcoticRepository.save(entry);
        return ResponseEntity.ok(ApiResponse.success(saved, "Narcotic register entry recorded successfully"));
    }

    @GetMapping("/monthly-reconciliation")
    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_AUDIT_COMPLIANCE','ROLE_SUPERVISOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMonthlyReconciliation(
            @RequestParam Long medicineId,
            @RequestParam int month,
            @RequestParam int year) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime start = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime end = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        List<NarcoticRegister> entries = narcoticRepository.findByMedicineIdAndEntryDateBetween(medicineId, start, end);

        int totalDispensed = entries.stream().mapToInt(NarcoticRegister::getQuantityDispensed).sum();
        int discrepancies = (int) entries.stream().filter(NarcoticRegister::isDiscrepancyFlag).count();

        Map<String, Object> summary = new HashMap<>();
        summary.put("entries", entries);
        summary.put("totalDispensed", totalDispensed);
        summary.put("discrepanciesCount", discrepancies);
        summary.put("month", month);
        summary.put("year", year);

        return ResponseEntity.ok(ApiResponse.success(summary, "Monthly reconciliation fetched"));
    }
}