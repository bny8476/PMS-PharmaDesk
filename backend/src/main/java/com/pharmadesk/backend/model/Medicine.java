package com.pharmadesk.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;

@Entity
@Table(name = "medicines")
@SQLDelete(sql = "UPDATE medicines SET is_deleted = true WHERE id=?")
@SQLRestriction("is_deleted=false")
public class Medicine extends BaseEntity {

    @NotBlank(message = "Medicine name is required")
    @Column(nullable = false)
    private String name;

    @Column(unique = true)
    private String barcode;

    @Column(name = "generic_name")
    private String genericName;

    private String manufacturer;
    private String category;
    private String unit;

    @Column(name = "hsn_code")
    private String hsnCode;

    @NotNull(message = "Tax percentage is required")
    @Column(name = "tax_percentage")
    private BigDecimal taxPercentage = BigDecimal.ZERO;

    @Column(name = "reorder_level")
    @JsonProperty("reorderLevel")
    private Integer reorderLevel = 10;

    @Column(name = "reorder_quantity")
    private Integer reorderQuantity = 50;

    @Column(name = "medicine_code", unique = true)
    private String medicineCode;

    @Column(name = "supplier_vendor")
    private String supplierVendor;

    @Column(name = "pack_size")
    private String packSize;

    private BigDecimal mrp;

    @Column(name = "purchase_price")
    private BigDecimal purchasePrice;

    @Column(name = "sale_price")
    private BigDecimal salePrice;

    @Column(name = "drug_class")
    private String drugClass;

    @Column(name = "storage_conditions")
    private String storageConditions;

    private String schedule;

    @Column(name = "substitutes")
    private String substitutes; // Comma separated list of medicine IDs

    @Column(name = "units_per_pack", columnDefinition = "INT DEFAULT 1")
    private Integer unitsPerPack = 1;

    @Column(name = "product_type", length = 50)
    private String productType = "MEDICINE";

    @jakarta.persistence.ManyToOne
    @jakarta.persistence.JoinColumn(name = "supplier_id")
    private Supplier supplier;


    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
    public Integer getReorderQuantity() { return reorderQuantity; }
    public void setReorderQuantity(Integer reorderQuantity) { this.reorderQuantity = reorderQuantity; }
    public String getMedicineCode() { return medicineCode; }
    public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
    public String getSupplierVendor() { return supplierVendor; }
    public void setSupplierVendor(String supplierVendor) { this.supplierVendor = supplierVendor; }
    public String getPackSize() { return packSize; }
    public void setPackSize(String packSize) { this.packSize = packSize; }
    public BigDecimal getMrp() { return mrp; }
    public void setMrp(BigDecimal mrp) { this.mrp = mrp; }
    public BigDecimal getPurchasePrice() { return purchasePrice; }
    public void setPurchasePrice(BigDecimal purchasePrice) { this.purchasePrice = purchasePrice; }
    public BigDecimal getSalePrice() { return salePrice; }
    public void setSalePrice(BigDecimal salePrice) { this.salePrice = salePrice; }
    public String getDrugClass() { return drugClass; }
    public void setDrugClass(String drugClass) { this.drugClass = drugClass; }
    public String getStorageConditions() { return storageConditions; }
    public void setStorageConditions(String storageConditions) { this.storageConditions = storageConditions; }
    public String getSchedule() { return schedule; }
    public void setSchedule(String schedule) { this.schedule = schedule; }
    public String getSubstitutes() { return substitutes; }
    public void setSubstitutes(String substitutes) { this.substitutes = substitutes; }
    public Integer getUnitsPerPack() { return unitsPerPack; }
    public void setUnitsPerPack(Integer unitsPerPack) { this.unitsPerPack = unitsPerPack; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public Supplier getSupplier() { return supplier; }
    public void setSupplier(Supplier supplier) { this.supplier = supplier; }
}
