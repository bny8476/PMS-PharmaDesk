package com.pharmadesk.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDate;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.FilterDef;
import org.hibernate.annotations.ParamDef;

@Entity
@Table(name = "patients")
@SQLDelete(sql = "UPDATE patients SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
@FilterDef(name = "branchFilter", parameters = @ParamDef(name = "branchId", type = Long.class))
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class Patient extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String uhid;

    @Column(name = "branch_id", nullable = false)
    private Long branchId = 1L;

    public Long getBranchId() { return branchId; }
    public void setBranchId(Long branchId) { this.branchId = branchId; }

    @Column(nullable = false)
    private String name;

    private LocalDate dob;
    private String gender;
    private String phone;
    private String address;

    @Column(name = "insurance_id")
    private String insuranceId;

    public String getUhid() { return uhid; }
    public void setUhid(String uhid) { this.uhid = uhid; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }
    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getInsuranceId() { return insuranceId; }
    public void setInsuranceId(String insuranceId) { this.insuranceId = insuranceId; }

    @Column(name = "preferred_delivery")
    private Boolean preferredDelivery = false;

    @Column(name = "delivery_address", columnDefinition = "TEXT")
    private String deliveryAddress;

    public Boolean getPreferredDelivery() { return preferredDelivery; }
    public void setPreferredDelivery(Boolean preferredDelivery) { this.preferredDelivery = preferredDelivery; }
    public String getDeliveryAddress() { return deliveryAddress; }
    public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
}
