package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.dto.analytics.AnalyticsDashboardDTO;
import com.pharmadesk.backend.pharmacy.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard-summary")
    public ResponseEntity<ApiResponse<AnalyticsDashboardDTO>> getDashboardSummary(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        AnalyticsDashboardDTO summary = analyticsService.getDashboardSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(summary, "Dashboard summary retrieved successfully"));
    }

    @GetMapping("/abc-analysis")
    public ResponseEntity<ApiResponse<java.util.List<com.pharmadesk.backend.pharmacy.dto.analytics.ABCAnalysisDTO>>> getAbcAnalysis(
            @RequestParam("startDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam("endDate") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        
        java.util.List<com.pharmadesk.backend.pharmacy.dto.analytics.ABCAnalysisDTO> data = analyticsService.getAbcAnalysis(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success(data, "ABC Analysis retrieved successfully"));
    }

    @GetMapping("/mom-comparison")
    public ResponseEntity<ApiResponse<com.pharmadesk.backend.pharmacy.dto.analytics.MonthOverMonthDTO>> getMonthOverMonthComparison(
            @RequestParam("monthAStart") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime monthAStart,
            @RequestParam("monthAEnd") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime monthAEnd,
            @RequestParam("monthBStart") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime monthBStart,
            @RequestParam("monthBEnd") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime monthBEnd) {
        
        com.pharmadesk.backend.pharmacy.dto.analytics.MonthOverMonthDTO data = analyticsService.getMonthOverMonthComparison(monthAStart, monthAEnd, monthBStart, monthBEnd);
        return ResponseEntity.ok(ApiResponse.success(data, "Month over Month comparison retrieved successfully"));
    }

    @GetMapping("/stocks/movement")
    public ResponseEntity<ApiResponse<com.pharmadesk.backend.pharmacy.dto.analytics.StockMovementInsightsDTO>> getStockMovementInsights(
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        
        if (endDate == null) endDate = LocalDateTime.now();
        if (startDate == null) startDate = endDate.minusDays(30);

        com.pharmadesk.backend.pharmacy.dto.analytics.StockMovementInsightsDTO dto = new com.pharmadesk.backend.pharmacy.dto.analytics.StockMovementInsightsDTO();
        
        java.util.List<com.pharmadesk.backend.pharmacy.dto.analytics.MedicineStatsDTO> topMoving = analyticsService.getFastMovingMedicines(startDate, endDate, limit);
        java.util.List<com.pharmadesk.backend.pharmacy.dto.analytics.MedicineStatsDTO> topNonMoving = analyticsService.getSlowMovingMedicines(startDate, endDate, limit);
        
        dto.setTopMoving(topMoving);
        dto.setTopNonMoving(topNonMoving);
        
        java.math.BigDecimal movingVal = topMoving.stream()
                .map(com.pharmadesk.backend.pharmacy.dto.analytics.MedicineStatsDTO::getStockValueLocked)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                
        java.math.BigDecimal nonMovingVal = topNonMoving.stream()
                .map(com.pharmadesk.backend.pharmacy.dto.analytics.MedicineStatsDTO::getStockValueLocked)
                .filter(java.util.Objects::nonNull)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                
        dto.setMovingValue(movingVal);
        dto.setNonMovingValue(nonMovingVal);

        return ResponseEntity.ok(ApiResponse.success(dto, "Stock movement insights retrieved successfully"));
    }
}
