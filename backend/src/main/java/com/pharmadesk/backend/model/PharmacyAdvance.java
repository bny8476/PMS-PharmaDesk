package com.pharmadesk.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.Filter;

@Entity
@Table(name = "pharmacy_advances")
@SQLDelete(sql = "UPDATE pharmacy_advances SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class PharmacyAdvance extends BaseEntity {

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    @Column(name = "branch_id", nullable = false)
    private Long branchId = 1L;

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    @Column(name = "patient_id")
    private Long patientId;

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "balance_amount", nullable = false)
    private BigDecimal balanceAmount;

    @Column(name = "advance_date", nullable = false)
    private LocalDateTime advanceDate;

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public BigDecimal getBalanceAmount() { return balanceAmount; }
    public void setBalanceAmount(BigDecimal balanceAmount) { this.balanceAmount = balanceAmount; }
    public LocalDateTime getAdvanceDate() { return advanceDate; }
    public void setAdvanceDate(LocalDateTime advanceDate) { this.advanceDate = advanceDate; }
}
