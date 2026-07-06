package com.pharmadesk.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "doctors")
@SQLDelete(sql = "UPDATE doctors SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class Doctor extends BaseEntity {

    @Column(nullable = false)
    private String name;

    private String specialization;
    
    @Column(name = "contact_number")
    private String contactNumber;
    
    @Column(name = "registration_number")
    private String registrationNumber;
    
    @Column(name = "clinic_address", columnDefinition = "TEXT")
    private String clinicAddress;

    // Getters and Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getClinicAddress() { return clinicAddress; }
    public void setClinicAddress(String clinicAddress) { this.clinicAddress = clinicAddress; }
}
