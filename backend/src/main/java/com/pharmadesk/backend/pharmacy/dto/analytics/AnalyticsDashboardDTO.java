package com.pharmadesk.backend.pharmacy.dto.analytics;

import java.math.BigDecimal;
import java.util.List;

public class AnalyticsDashboardDTO {
    private KPIDTO totalSalesRevenue;
    private KPIDTO totalUnitsDispensed;
    private KPIDTO totalTransactions;
    private KPIDTO averageTransactionValue;
    private KPIDTO totalReturnsValue;
    private KPIDTO netRevenue;
    private KPIDTO totalPurchases;
    private KPIDTO estimatedProfitMargin;

    private List<MedicineStatsDTO> fastMovingMedicines;
    private List<MedicineStatsDTO> slowMovingMedicines;
    private List<TrendDataDTO> revenueTrend;

    // Getters and Setters
    public KPIDTO getTotalSalesRevenue() { return totalSalesRevenue; }
    public void setTotalSalesRevenue(KPIDTO totalSalesRevenue) { this.totalSalesRevenue = totalSalesRevenue; }

    public KPIDTO getTotalUnitsDispensed() { return totalUnitsDispensed; }
    public void setTotalUnitsDispensed(KPIDTO totalUnitsDispensed) { this.totalUnitsDispensed = totalUnitsDispensed; }

    public KPIDTO getTotalTransactions() { return totalTransactions; }
    public void setTotalTransactions(KPIDTO totalTransactions) { this.totalTransactions = totalTransactions; }

    public KPIDTO getAverageTransactionValue() { return averageTransactionValue; }
    public void setAverageTransactionValue(KPIDTO averageTransactionValue) { this.averageTransactionValue = averageTransactionValue; }

    public KPIDTO getTotalReturnsValue() { return totalReturnsValue; }
    public void setTotalReturnsValue(KPIDTO totalReturnsValue) { this.totalReturnsValue = totalReturnsValue; }

    public KPIDTO getNetRevenue() { return netRevenue; }
    public void setNetRevenue(KPIDTO netRevenue) { this.netRevenue = netRevenue; }

    public List<MedicineStatsDTO> getFastMovingMedicines() { return fastMovingMedicines; }
    public void setFastMovingMedicines(List<MedicineStatsDTO> fastMovingMedicines) { this.fastMovingMedicines = fastMovingMedicines; }

    public List<MedicineStatsDTO> getSlowMovingMedicines() { return slowMovingMedicines; }
    public void setSlowMovingMedicines(List<MedicineStatsDTO> slowMovingMedicines) { this.slowMovingMedicines = slowMovingMedicines; }

    public List<TrendDataDTO> getRevenueTrend() { return revenueTrend; }
    public void setRevenueTrend(List<TrendDataDTO> revenueTrend) { this.revenueTrend = revenueTrend; }

    public KPIDTO getTotalPurchases() { return totalPurchases; }
    public void setTotalPurchases(KPIDTO totalPurchases) { this.totalPurchases = totalPurchases; }

    public KPIDTO getEstimatedProfitMargin() { return estimatedProfitMargin; }
    public void setEstimatedProfitMargin(KPIDTO estimatedProfitMargin) { this.estimatedProfitMargin = estimatedProfitMargin; }
}
