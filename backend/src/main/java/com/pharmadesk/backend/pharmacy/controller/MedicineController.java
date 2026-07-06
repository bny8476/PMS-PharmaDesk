package com.pharmadesk.backend.pharmacy.controller;

import com.pharmadesk.backend.model.Medicine;
import com.pharmadesk.backend.model.MedicineStock;
import com.pharmadesk.backend.pharmacy.repository.MedicineRepository;
import com.pharmadesk.backend.pharmacy.repository.MedicineStockRepository;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.dto.MedicineDTO;
import com.pharmadesk.backend.pharmacy.mapper.MedicineMapper;
import com.pharmadesk.backend.model.StockAdjustment;
import com.pharmadesk.backend.model.PurchaseOrder;
import com.pharmadesk.backend.model.PurchaseOrderItem;
import com.pharmadesk.backend.pharmacy.repository.StockAdjustmentRepository;
import com.pharmadesk.backend.pharmacy.repository.PurchaseOrderRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy")
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final MedicineStockRepository stockRepository;
    private final MedicineMapper medicineMapper;
    private final com.pharmadesk.backend.service.EmailService emailService;
    private final com.pharmadesk.backend.repository.UserRepository userRepository;
    private final StockAdjustmentRepository stockAdjustmentRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;

    public MedicineController(MedicineRepository medicineRepository, 
                              MedicineStockRepository stockRepository, 
                              MedicineMapper medicineMapper,
                              com.pharmadesk.backend.service.EmailService emailService,
                              com.pharmadesk.backend.repository.UserRepository userRepository,
                              StockAdjustmentRepository stockAdjustmentRepository,
                              PurchaseOrderRepository purchaseOrderRepository) {
        this.medicineRepository = medicineRepository;
        this.stockRepository = stockRepository;
        this.medicineMapper = medicineMapper;
        this.emailService = emailService;
        this.userRepository = userRepository;
        this.stockAdjustmentRepository = stockAdjustmentRepository;
        this.purchaseOrderRepository = purchaseOrderRepository;
    }

    @GetMapping("/medicines")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getAllMedicines() {
        List<Medicine> medicines = medicineRepository.findAll();
        List<Object[]> stockSummary = stockRepository.getStockQuantitiesGroupByMedicine();
        java.util.Map<Long, Integer> stockMap = stockSummary.stream()
                .filter(arr -> arr[0] != null && arr[1] != null)
                .collect(java.util.stream.Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> ((Number) arr[1]).intValue()
                ));

        List<MedicineDTO> dtos = medicines.stream()
                .map(medicine -> {
                    MedicineDTO dto = medicineMapper.toDto(medicine);
                    dto.setCurrentStock(stockMap.getOrDefault(medicine.getId(), 0));
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(ApiResponse.success(dtos, "Medicines fetched successfully"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PHARMACY_STAFF')")
    @PostMapping("/medicines")
    public ResponseEntity<ApiResponse<MedicineDTO>> createMedicine(@Valid @RequestBody Medicine medicine) {
        boolean autoGenerateCode = medicine.getMedicineCode() == null || medicine.getMedicineCode().trim().isEmpty();
        if (autoGenerateCode) {
            medicine.setMedicineCode(null);
        }
        if (medicine.getBarcode() != null && medicine.getBarcode().trim().isEmpty()) {
            medicine.setBarcode(null);
        }
        
        Medicine saved = medicineRepository.save(medicine);
        
        if (autoGenerateCode) {
            saved.setMedicineCode(String.format("MED-%05d", saved.getId()));
            saved = medicineRepository.save(saved);
        }
        
        MedicineDTO dto = medicineMapper.toDto(saved);
        dto.setCurrentStock(0);
        return ResponseEntity.ok(ApiResponse.success(dto, "Medicine added successfully"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PHARMACY_STAFF')")
    @PutMapping("/medicines/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> updateMedicine(@PathVariable Long id, @Valid @RequestBody Medicine medicineData) {
        return medicineRepository.findById(id).map(medicine -> {
            medicine.setName(medicineData.getName());
            medicine.setGenericName(medicineData.getGenericName());
            medicine.setManufacturer(medicineData.getManufacturer());
            medicine.setCategory(medicineData.getCategory());
            medicine.setUnit(medicineData.getUnit());
            medicine.setHsnCode(medicineData.getHsnCode());
            medicine.setTaxPercentage(medicineData.getTaxPercentage());
            medicine.setReorderLevel(medicineData.getReorderLevel());
            medicine.setReorderQuantity(medicineData.getReorderQuantity());
            medicine.setBarcode((medicineData.getBarcode() != null && medicineData.getBarcode().trim().isEmpty()) ? null : medicineData.getBarcode());
            medicine.setSupplierVendor(medicineData.getSupplierVendor());
            medicine.setSupplier(medicineData.getSupplier());
            medicine.setProductType(medicineData.getProductType());
            medicine.setPackSize(medicineData.getPackSize());
            medicine.setMrp(medicineData.getMrp());
            medicine.setPurchasePrice(medicineData.getPurchasePrice());
            medicine.setSalePrice(medicineData.getSalePrice());
            medicine.setDrugClass(medicineData.getDrugClass());
            medicine.setStorageConditions(medicineData.getStorageConditions());
            medicine.setSchedule(medicineData.getSchedule());
            medicine.setSubstitutes(medicineData.getSubstitutes());
            
            Medicine updated = medicineRepository.save(medicine);
            
            MedicineDTO dto = medicineMapper.toDto(updated);
            dto.setCurrentStock(stockRepository.findByMedicineId(updated.getId()).stream()
                    .mapToInt(MedicineStock::getQuantityAvailable)
                    .sum());
            
            return ResponseEntity.ok(ApiResponse.success(dto, "Medicine updated successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PHARMACY_STAFF')")
    @DeleteMapping("/medicines/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable Long id) {
        return medicineRepository.findById(id).map(medicine -> {
            medicine.setDeleted(true);
            medicineRepository.save(medicine);
            return ResponseEntity.ok(ApiResponse.<Void>success(null, "Medicine deleted successfully"));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/medicines/search")
    public ResponseEntity<List<MedicineDTO>> searchMedicines(@RequestParam String name) {
        List<Medicine> medicines = medicineRepository.findByNameContainingIgnoreCase(name);
        if (medicines.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        List<Long> medicineIds = medicines.stream().map(Medicine::getId).toList();
        List<Object[]> stockSummary = stockRepository.getStockQuantitiesGroupByMedicineIds(medicineIds);
        java.util.Map<Long, Integer> stockMap = stockSummary.stream()
                .filter(arr -> arr[0] != null && arr[1] != null)
                .collect(java.util.stream.Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> ((Number) arr[1]).intValue()
                ));

        List<MedicineDTO> dtos = medicines.stream()
                .map(medicine -> {
                    MedicineDTO dto = medicineMapper.toDto(medicine);
                    dto.setCurrentStock(stockMap.getOrDefault(medicine.getId(), 0));
                    return dto;
                })
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER','ROLE_PHARMACY_STAFF','ROLE_SUPERVISOR')")
    @GetMapping("/stocks/search")
    public ResponseEntity<List<MedicineStock>> searchStocks(@RequestParam String name) {
        return ResponseEntity.ok(stockRepository.findByMedicineNameContainingIgnoreCaseWithMedicineAndSupplier(name));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER','ROLE_PHARMACY_STAFF','ROLE_SUPERVISOR')")
    @GetMapping("/stocks/barcode/{barcode}")
    public ResponseEntity<ApiResponse<MedicineStock>> getStockByBarcode(@PathVariable String barcode) {
        return medicineRepository.findByBarcode(barcode)
                .flatMap(medicine -> stockRepository.findByMedicineId(medicine.getId()).stream()
                        .filter(s -> s.getQuantityAvailable() > 0)
                        .findFirst())
                .map(stock -> ResponseEntity.ok(ApiResponse.success(stock, "Stock found")))
                .orElse(ResponseEntity.notFound().build());
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER','ROLE_PHARMACY_STAFF','ROLE_SUPERVISOR')")
    @GetMapping("/stocks")
    public ResponseEntity<ApiResponse<List<MedicineStock>>> getAllStocks() {
        return ResponseEntity.ok(ApiResponse.success(stockRepository.findAllActiveWithMedicineAndSupplier(), "Stocks fetched successfully"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PHARMACY_STAFF','ROLE_STOREKEEPER')")
    @PostMapping("/stocks")
    public ResponseEntity<ApiResponse<MedicineStock>> addStock(@Valid @RequestBody MedicineStock stock) {
        // Ensure medicine is linked
        if (stock.getMedicine() != null && stock.getMedicine().getId() != null) {
            Medicine medicine = medicineRepository.findById(stock.getMedicine().getId())
                    .orElseThrow(() -> new RuntimeException("Medicine not found"));
            stock.setMedicine(medicine);
        }
        MedicineStock saved = stockRepository.save(stock);
        return ResponseEntity.ok(ApiResponse.success(saved, "Stock updated successfully"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PHARMACY_STAFF','ROLE_STOREKEEPER')")
    @PostMapping("/stocks/adjust")
    public ResponseEntity<ApiResponse<StockAdjustment>> adjustStock(@Valid @RequestBody StockAdjustment adjustment) {
        MedicineStock stock = stockRepository.findById(adjustment.getMedicineStock().getId())
                .orElseThrow(() -> new RuntimeException("Stock not found"));
        
        stock.setQuantityAvailable(stock.getQuantityAvailable() + adjustment.getAdjustedQuantity());
        stockRepository.save(stock);
        
        // Also ensure medicine and batchId are set from stock
        adjustment.setMedicine(stock.getMedicine());
        adjustment.setBatchId(stock.getId());
        adjustment.setAdjustmentType(adjustment.getAdjustedQuantity() > 0 ? "ADDITION" : "DEDUCTION");
        
        String username = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        com.pharmadesk.backend.model.User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        adjustment.setAdjustedBy(user);
        
        StockAdjustment saved = stockAdjustmentRepository.save(adjustment);
        return ResponseEntity.ok(ApiResponse.success(saved, "Stock adjusted successfully"));
    }

    @GetMapping("/stocks/valuation")
    public ResponseEntity<ApiResponse<java.util.Map<String, java.math.BigDecimal>>> getStockValuation() {
        java.math.BigDecimal totalPurchaseValue = stockRepository.getTotalPurchaseValue();
        java.math.BigDecimal totalMrpValue = stockRepository.getTotalMrpValue();
        java.math.BigDecimal expiredValue = stockRepository.getExpiredValue();
        java.time.LocalDate threshold = java.time.LocalDate.now().plusDays(30);
        java.math.BigDecimal nearExpiryValue = stockRepository.getNearExpiryValue(threshold);

        java.util.Map<String, java.math.BigDecimal> valuation = new java.util.HashMap<>();
        valuation.put("totalPurchaseValue", totalPurchaseValue != null ? totalPurchaseValue : java.math.BigDecimal.ZERO);
        valuation.put("totalMrpValue", totalMrpValue != null ? totalMrpValue : java.math.BigDecimal.ZERO);
        valuation.put("nearExpiryValue", nearExpiryValue != null ? nearExpiryValue : java.math.BigDecimal.ZERO);
        valuation.put("expiredValue", expiredValue != null ? expiredValue : java.math.BigDecimal.ZERO);

        return ResponseEntity.ok(ApiResponse.success(valuation, "Valuation calculated"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_PHARMACY_STAFF','ROLE_STOREKEEPER','ROLE_PURCHASE_MANAGER')")
    @PostMapping("/purchase-orders/auto-generate")
    public ResponseEntity<ApiResponse<String>> autoGeneratePOs() {
        List<Medicine> medicines = medicineRepository.findAll();
        List<Object[]> stockSummary = stockRepository.getStockQuantitiesGroupByMedicine();
        java.util.Map<Long, Integer> stockMap = stockSummary.stream()
                .filter(arr -> arr[0] != null && arr[1] != null)
                .collect(java.util.stream.Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> ((Number) arr[1]).intValue()
                ));

        java.util.Map<Long, PurchaseOrder> supplierOrders = new java.util.HashMap<>();
        int generatedCount = 0;

        for (Medicine med : medicines) {
            int currentStock = stockMap.getOrDefault(med.getId(), 0);
            if (med.getReorderLevel() != null && currentStock <= med.getReorderLevel()) {
                // Find supplier (from latest stock or medicine's supplierVendor, here assuming basic logic)
                com.pharmadesk.backend.model.Supplier supplier = null;
                List<MedicineStock> latestStocks = stockRepository.findByMedicineId(med.getId());
                if (!latestStocks.isEmpty() && latestStocks.get(0).getSupplier() != null) {
                    supplier = latestStocks.get(0).getSupplier();
                }

                if (supplier != null) {
                    final com.pharmadesk.backend.model.Supplier finalSupplier = supplier;
                    PurchaseOrder po = supplierOrders.computeIfAbsent(supplier.getId(), sid -> {
                        PurchaseOrder newPo = new PurchaseOrder();
                        newPo.setSupplier(finalSupplier);
                        newPo.setStatus("DRAFT");
                        newPo.setPoNumber("PO-" + System.currentTimeMillis() + "-" + sid);
                        return newPo;
                    });

                    PurchaseOrderItem item = new PurchaseOrderItem();
                    item.setMedicine(med);
                    item.setQuantity(med.getReorderQuantity() != null ? med.getReorderQuantity() : 100);
                    item.setEstimatedUnitPrice(med.getPurchasePrice() != null ? med.getPurchasePrice() : java.math.BigDecimal.ZERO);
                    item.setPurchaseOrder(po);
                    po.getItems().add(item);
                    generatedCount++;
                }
            }
        }

        for (PurchaseOrder po : supplierOrders.values()) {
            purchaseOrderRepository.save(po);
        }

        return ResponseEntity.ok(ApiResponse.success("Generated " + supplierOrders.size() + " Purchase Orders covering " + generatedCount + " medicines.", "Auto PO Generation successful"));
    }

    @PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN','ROLE_STOREKEEPER','ROLE_PHARMACY_STAFF','ROLE_SUPERVISOR','ROLE_CASHIER','ROLE_BILLING_STAFF')")
    @GetMapping("/stocks/low-stock")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getLowStockMedicines() {
        List<Medicine> medicines = medicineRepository.findAll();
        List<Object[]> stockSummary = stockRepository.getStockQuantitiesGroupByMedicine();
        java.util.Map<Long, Integer> stockMap = stockSummary.stream()
                .filter(arr -> arr[0] != null && arr[1] != null)
                .collect(java.util.stream.Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> ((Number) arr[1]).intValue()
                ));

        List<Medicine> lowStockMedicines = medicines.stream()
                .filter(m -> {
                    int qty = stockMap.getOrDefault(m.getId(), 0);
                    int rlvl = m.getReorderLevel() != null ? m.getReorderLevel() : 0;
                    return rlvl > 0 && qty <= rlvl;
                })
                .toList();

        if (lowStockMedicines.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "Low stock medicines fetched"));
        }

        List<Long> lowStockMedIds = lowStockMedicines.stream().map(Medicine::getId).toList();
        List<Object[]> supplierInfo = stockRepository.findSupplierNamesByMedicineIds(lowStockMedIds);
        java.util.Map<Long, String> supplierMap = supplierInfo.stream()
                .filter(arr -> arr[0] != null && arr[1] != null)
                .collect(java.util.stream.Collectors.toMap(
                        arr -> (Long) arr[0],
                        arr -> (String) arr[1],
                        (s1, s2) -> s1 // keep first if duplicates
                ));

        List<MedicineDTO> lowStock = lowStockMedicines.stream()
                .map(m -> {
                    MedicineDTO dto = medicineMapper.toDto(m);
                    int qty = stockMap.getOrDefault(m.getId(), 0);
                    dto.setCurrentStock(qty);
                    dto.setMedicineName(m.getName());

                    String supplierName = supplierMap.get(m.getId());
                    if (supplierName != null) {
                        dto.setSupplierVendor(supplierName);
                        dto.setSupplierName(supplierName);
                    }
                    dto.setLastUpdated(java.time.LocalDate.now().toString());

                    return dto;
                })
                .toList();

        return ResponseEntity.ok(ApiResponse.success(lowStock, "Low stock medicines fetched"));
    }
}
