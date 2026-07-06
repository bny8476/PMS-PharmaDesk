package com.pharmadesk.backend.sales.dto;

import com.pharmadesk.backend.pharmacy.enums.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class SaleRequestDTO {

    private Long prescriptionId;
    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

    private String patientName;
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }

    private Long patientId;
    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    private String doctorName;
    public String getDoctorName() { return doctorName; }
    public void setDoctorName(String doctorName) { this.doctorName = doctorName; }

    private Long doctorId;
    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    @NotEmpty(message = "Sale must have at least one item")
    @Valid
    private List<SaleItemDTO> items;
    public List<SaleItemDTO> getItems() { return items; }
    public void setItems(List<SaleItemDTO> items) { this.items = items; }

    @NotNull(message = "Payment mode is required")
    private PaymentMode paymentMode;
    public PaymentMode getPaymentMode() { return paymentMode; }
    public void setPaymentMode(PaymentMode paymentMode) { this.paymentMode = paymentMode; }

    private BigDecimal discountAmount = BigDecimal.ZERO;
    public BigDecimal getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }

    private BigDecimal amountPaid = BigDecimal.ZERO;
    public BigDecimal getAmountPaid() { return amountPaid; }
    public void setAmountPaid(BigDecimal amountPaid) { this.amountPaid = amountPaid; }

    private boolean useAdvance = false;
    public boolean isUseAdvance() { return useAdvance; }
    public void setUseAdvance(boolean useAdvance) { this.useAdvance = useAdvance; }

    private String billType;
    public String getBillType() { return billType; }
    public void setBillType(String billType) { this.billType = billType; }
}
