package com.pharmadesk.backend.pharmacy.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class MedicineDTO {
    private Long id;
    private String name;
    private String genericName;
    private String manufacturer;
    private String category;
    private String hsnCode;
    private BigDecimal taxPercentage;
    private BigDecimal gstPercent;
    private String unit;
    private Integer currentStock;
    private Integer reorderLevel;
    private Integer reorderQuantity;
    
    private String medicineCode;
    private String supplierVendor;
    private Long supplierId;
    private String supplierAddress;
    private String supplierGstin;
    private String supplierContact;
    private String productType;
    private String packSize;
    private Integer unitsPerPack;
    private BigDecimal mrp;
    private BigDecimal purchasePrice;
    private BigDecimal salePrice;
    private String drugClass;
    private String storageConditions;
    private String schedule;
    private String substitutes;
    private String barcode;

    private String medicineName;   // alias used by LowStockAlerts.jsx
    private String supplierName;   // alias used by LowStockAlerts.jsx
    private String lastUpdated;    // alias used by LowStockAlerts.jsx
    private LocalDateTime createdAt;

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getMedicineName()  { return medicineName; }
    public void setMedicineName(String medicineName) { this.medicineName = medicineName; }

    public String getSupplierName()  { return supplierName; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }

    public String getLastUpdated()   { return lastUpdated; }
    public void setLastUpdated(String lastUpdated) { this.lastUpdated = lastUpdated; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getGenericName() { return genericName; }
    public void setGenericName(String genericName) { this.genericName = genericName; }
    public String getManufacturer() { return manufacturer; }
    public void setManufacturer(String manufacturer) { this.manufacturer = manufacturer; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getHsnCode() { return hsnCode; }
    public void setHsnCode(String hsnCode) { this.hsnCode = hsnCode; }
    public BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }
    public BigDecimal getGstPercent() { return gstPercent; }
    public void setGstPercent(BigDecimal gstPercent) { this.gstPercent = gstPercent; }
    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }
    public Integer getCurrentStock() { return currentStock; }
    public void setCurrentStock(Integer currentStock) { this.currentStock = currentStock; }
    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }
    public Integer getReorderQuantity() { return reorderQuantity; }
    public void setReorderQuantity(Integer reorderQuantity) { this.reorderQuantity = reorderQuantity; }

    public String getMedicineCode() { return medicineCode; }
    public void setMedicineCode(String medicineCode) { this.medicineCode = medicineCode; }
    public String getSupplierVendor() { return supplierVendor; }
    public void setSupplierVendor(String supplierVendor) { this.supplierVendor = supplierVendor; }
    public Long getSupplierId() { return supplierId; }
    public void setSupplierId(Long supplierId) { this.supplierId = supplierId; }
    public String getSupplierAddress() { return supplierAddress; }
    public void setSupplierAddress(String supplierAddress) { this.supplierAddress = supplierAddress; }
    public String getSupplierGstin() { return supplierGstin; }
    public void setSupplierGstin(String supplierGstin) { this.supplierGstin = supplierGstin; }
    public String getSupplierContact() { return supplierContact; }
    public void setSupplierContact(String supplierContact) { this.supplierContact = supplierContact; }
    public String getProductType() { return productType; }
    public void setProductType(String productType) { this.productType = productType; }
    public String getPackSize() { return packSize; }
    public void setPackSize(String packSize) { this.packSize = packSize; }
    public Integer getUnitsPerPack() { return unitsPerPack; }
    public void setUnitsPerPack(Integer unitsPerPack) { this.unitsPerPack = unitsPerPack; }
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
    public String getBarcode() { return barcode; }
    public void setBarcode(String barcode) { this.barcode = barcode; }
}

class StockDTO {
    private Long id;
    private String batchNumber;
    private LocalDate expiryDate;
    private Integer quantityAvailable;
    private BigDecimal sellingRate;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }
    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }
    public Integer getQuantityAvailable() { return quantityAvailable; }
    public void setQuantityAvailable(Integer quantityAvailable) { this.quantityAvailable = quantityAvailable; }
    public BigDecimal getSellingRate() { return sellingRate; }
    public void setSellingRate(BigDecimal sellingRate) { this.sellingRate = sellingRate; }
}
