package com.pharmadesk.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "prescriptions")
@SQLDelete(sql = "UPDATE prescriptions SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class Prescription extends BaseEntity {

    @Column(name = "patient_name", nullable = false)
    private String patientName;

    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    @Column(name = "doctor_name")
    private String doctorName;

    @jakarta.persistence.ManyToOne(fetch = jakarta.persistence.FetchType.LAZY)
    @jakarta.persistence.JoinColumn(name = "doctor_id")
    private Doctor doctor;

    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    @Column(name = "prescription_date", nullable = false)
    private LocalDateTime prescriptionDate;

    public LocalDateTime getPrescriptionDate() { return prescriptionDate; }
    public void setPrescriptionDate(LocalDateTime prescriptionDate) { this.prescriptionDate = prescriptionDate; }

    @Column(nullable = false)
    private String status; // PENDING, DISPENSED, CANCELLED

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    @Column(name = "verification_status", nullable = false)
    private String verificationStatus = "UNVERIFIED"; // UNVERIFIED, VERIFIED, REJECTED

    @Column(name = "verified_by")
    private String verifiedBy;

    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }

    public String getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(String verifiedBy) { this.verifiedBy = verifiedBy; }

    public LocalDateTime getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDateTime verifiedAt) { this.verifiedAt = verifiedAt; }
}
