package com.pharmadesk.backend.model;

import com.pharmadesk.backend.sales.model.*;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "insurance_claims")
public class InsuranceClaim {

    @Id
    @Column(name = "claim_id", length = 36)
    private String claimId = java.util.UUID.randomUUID().toString();

    @Column(name = "claim_number", nullable = false, unique = true, length = 30)
    private String claimNumber;

    @Column(name = "claim_date", nullable = false)
    private LocalDate claimDate = LocalDate.now();

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bill_id")
    private PharmacyBill bill;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id")
    private Patient patient;

    @Column(name = "patient_name", nullable = false, length = 100)
    private String patientName;

    @Column(name = "patient_uhid", length = 30)
    private String patientUhid;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "insurance_provider_id", nullable = false)
    private InsuranceProvider provider;

    @Column(name = "insurance_policy_number", nullable = false, length = 60)
    private String insurancePolicyNumber;

    @Column(name = "tpa_name", length = 100)
    private String tpaName;

    @Column(name = "total_bill_amount", nullable = false)
    private BigDecimal totalBillAmount;

    @Column(name = "covered_amount", nullable = false)
    private BigDecimal coveredAmount;

    @Column(name = "non_covered_amount", nullable = false)
    private BigDecimal nonCoveredAmount;

    @Column(name = "claimed_amount", nullable = false)
    private BigDecimal claimedAmount;

    @Column(name = "approved_amount")
    private BigDecimal approvedAmount;

    @Column(name = "rejected_amount")
    private BigDecimal rejectedAmount;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "claim_status", length = 30)
    private String claimStatus = "draft";

    @Column(name = "submission_date")
    private LocalDate submissionDate;

    @Column(name = "approval_date")
    private LocalDate approvalDate;

    @Column(name = "settlement_date")
    private LocalDate settlementDate;

    @Column(name = "settlement_reference", length = 60)
    private String settlementReference;

    @Column(name = "claim_document_url", columnDefinition = "TEXT")
    private String claimDocumentUrl;

    @Column(name = "created_by", nullable = false)
    private Long createdBy;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();

    @OneToMany(mappedBy = "insuranceClaim", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<InsuranceClaimLineItem> lineItems = new ArrayList<>();

    // Getters and Setters
    public String getClaimId() { return claimId; }
    public void setClaimId(String claimId) { this.claimId = claimId; }

    public String getClaimNumber() { return claimNumber; }
    public void setClaimNumber(String claimNumber) { this.claimNumber = claimNumber; }

    public LocalDate getClaimDate() { return claimDate; }
    public void setClaimDate(LocalDate claimDate) { this.claimDate = claimDate; }

    public PharmacyBill getBill() { return bill; }
    public void setBill(PharmacyBill bill) { this.bill = bill; }

    public Patient getPatient() { return patient; }
    public void setPatient(Patient patient) { this.patient = patient; }

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    public String getPatientUhid() { return patientUhid; }
    public void setPatientUhid(String patientUhid) { this.patientUhid = patientUhid; }

    public InsuranceProvider getProvider() { return provider; }
    public void setProvider(InsuranceProvider provider) { this.provider = provider; }

    public String getInsurancePolicyNumber() { return insurancePolicyNumber; }
    public void setInsurancePolicyNumber(String insurancePolicyNumber) { this.insurancePolicyNumber = insurancePolicyNumber; }

    public String getTpaName() { return tpaName; }
    public void setTpaName(String tpaName) { this.tpaName = tpaName; }

    public BigDecimal getTotalBillAmount() { return totalBillAmount; }
    public void setTotalBillAmount(BigDecimal totalBillAmount) { this.totalBillAmount = totalBillAmount; }

    public BigDecimal getCoveredAmount() { return coveredAmount; }
    public void setCoveredAmount(BigDecimal coveredAmount) { this.coveredAmount = coveredAmount; }

    public BigDecimal getNonCoveredAmount() { return nonCoveredAmount; }
    public void setNonCoveredAmount(BigDecimal nonCoveredAmount) { this.nonCoveredAmount = nonCoveredAmount; }

    public BigDecimal getClaimedAmount() { return claimedAmount; }
    public void setClaimedAmount(BigDecimal claimedAmount) { this.claimedAmount = claimedAmount; }

    public BigDecimal getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(BigDecimal approvedAmount) { this.approvedAmount = approvedAmount; }

    public BigDecimal getRejectedAmount() { return rejectedAmount; }
    public void setRejectedAmount(BigDecimal rejectedAmount) { this.rejectedAmount = rejectedAmount; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public String getClaimStatus() { return claimStatus; }
    public void setClaimStatus(String claimStatus) { this.claimStatus = claimStatus; }

    public LocalDate getSubmissionDate() { return submissionDate; }
    public void setSubmissionDate(LocalDate submissionDate) { this.submissionDate = submissionDate; }

    public LocalDate getApprovalDate() { return approvalDate; }
    public void setApprovalDate(LocalDate approvalDate) { this.approvalDate = approvalDate; }

    public LocalDate getSettlementDate() { return settlementDate; }
    public void setSettlementDate(LocalDate settlementDate) { this.settlementDate = settlementDate; }

    public String getSettlementReference() { return settlementReference; }
    public void setSettlementReference(String settlementReference) { this.settlementReference = settlementReference; }

    public String getClaimDocumentUrl() { return claimDocumentUrl; }
    public void setClaimDocumentUrl(String claimDocumentUrl) { this.claimDocumentUrl = claimDocumentUrl; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }

    public List<InsuranceClaimLineItem> getLineItems() { return lineItems; }
    public void setLineItems(List<InsuranceClaimLineItem> lineItems) { this.lineItems = lineItems; }
}
