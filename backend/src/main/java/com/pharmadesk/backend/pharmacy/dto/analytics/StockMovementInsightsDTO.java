package com.pharmadesk.backend.pharmacy.dto.analytics;

import java.math.BigDecimal;
import java.util.List;

public class StockMovementInsightsDTO {
    private List<MedicineStatsDTO> topMoving;
    private List<MedicineStatsDTO> topNonMoving;
    private BigDecimal movingValue;
    private BigDecimal nonMovingValue;

    public List<MedicineStatsDTO> getTopMoving() {
        return topMoving;
    }

    public void setTopMoving(List<MedicineStatsDTO> topMoving) {
        this.topMoving = topMoving;
    }

    public List<MedicineStatsDTO> getTopNonMoving() {
        return topNonMoving;
    }

    public void setTopNonMoving(List<MedicineStatsDTO> topNonMoving) {
        this.topNonMoving = topNonMoving;
    }

    public BigDecimal getMovingValue() {
        return movingValue;
    }

    public void setMovingValue(BigDecimal movingValue) {
        this.movingValue = movingValue;
    }

    public BigDecimal getNonMovingValue() {
        return nonMovingValue;
    }

    public void setNonMovingValue(BigDecimal nonMovingValue) {
        this.nonMovingValue = nonMovingValue;
    }
}
