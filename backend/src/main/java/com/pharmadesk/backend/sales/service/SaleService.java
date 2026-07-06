package com.pharmadesk.backend.sales.service;

import com.pharmadesk.backend.sales.dto.SaleItemDTO;
import com.pharmadesk.backend.sales.dto.SaleRequestDTO;
import com.pharmadesk.backend.model.*;
import com.pharmadesk.backend.sales.model.*;
import com.pharmadesk.backend.pharmacy.enums.PaymentMode;
import com.pharmadesk.backend.pharmacy.enums.PaymentStatus;
import com.pharmadesk.backend.pharmacy.exception.ExpiredStockException;
import com.pharmadesk.backend.pharmacy.exception.InsufficientStockException;
import com.pharmadesk.backend.pharmacy.exception.ResourceNotFoundException;
import com.pharmadesk.backend.pharmacy.repository.*;
import com.pharmadesk.backend.sales.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.Gauge;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class SaleService {

    private final MedicineStockRepository stockRepository;
    private final PharmacyBillRepository billRepository;
    private final CreditBillRepository creditBillRepository;
    private final PharmacyAdvanceRepository advanceRepository;
    private final MedicineRepository medicineRepository;
    private final com.pharmadesk.backend.service.StockAlertService alertService;
    private final MeterRegistry meterRegistry;
    private final com.pharmadesk.backend.pharmacy.repository.PrescriptionRepository prescriptionRepository;
    private final com.pharmadesk.backend.repository.DoctorRepository doctorRepository;

    public SaleService(MedicineStockRepository stockRepository, 
                       PharmacyBillRepository billRepository, 
                       CreditBillRepository creditBillRepository, 
                       PharmacyAdvanceRepository advanceRepository,
                       MedicineRepository medicineRepository,
                       com.pharmadesk.backend.service.StockAlertService alertService,
                       MeterRegistry meterRegistry,
                       com.pharmadesk.backend.pharmacy.repository.PrescriptionRepository prescriptionRepository,
                       com.pharmadesk.backend.repository.DoctorRepository doctorRepository) {
        this.stockRepository = stockRepository;
        this.billRepository = billRepository;
        this.creditBillRepository = creditBillRepository;
        this.advanceRepository = advanceRepository;
        this.medicineRepository = medicineRepository;
        this.alertService = alertService;
        this.meterRegistry = meterRegistry;
        this.prescriptionRepository = prescriptionRepository;
        this.doctorRepository = doctorRepository;
        
        Gauge.builder("pharmacy_stock_low_count", alertService, 
            svc -> svc.getLowStockCount())
            .description("Count of medicines currently below reorder level")
            .register(meterRegistry);
    }

    @Transactional
    public PharmacyBill processSale(SaleRequestDTO request) {
        Timer.Sample sample = Timer.start(meterRegistry);
        try {
            if (request.getPrescriptionId() != null) {
                com.pharmadesk.backend.model.Prescription p = prescriptionRepository.findById(request.getPrescriptionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Prescription not found"));
                if (!"VERIFIED".equals(p.getVerificationStatus())) {
                    throw new com.pharmadesk.backend.pharmacy.exception.UnverifiedPrescriptionException("Prescription must be VERIFIED before dispensing.");
                }
            }

            PharmacyBill bill = new PharmacyBill();
            bill.setBillNumber("BILL-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            bill.setBillingDate(LocalDateTime.now());
            bill.setPatientName(request.getPatientName());
            bill.setDoctorName(request.getDoctorName());
            if (request.getDoctorId() != null) {
                bill.setDoctor(doctorRepository.findById(request.getDoctorId()).orElse(null));
            }
            bill.setDiscountAmount(request.getDiscountAmount());

        BigDecimal subTotal = BigDecimal.ZERO;
        BigDecimal taxTotal = BigDecimal.ZERO;

        List<Long> medicineIds = request.getItems().stream()
                .filter(i -> i.getMedicineId() != null)
                .map(SaleItemDTO::getMedicineId)
                .distinct()
                .collect(Collectors.toList());

        Map<Long, List<MedicineStock>> batchesByMedicine = medicineIds.isEmpty() ? Collections.emptyMap() :
                stockRepository.findByMedicineIdInAndDeletedFalseOrderByExpiryDateAsc(medicineIds)
                        .stream()
                        .collect(Collectors.groupingBy(s -> s.getMedicine().getId()));

        for (SaleItemDTO itemDto : request.getItems()) {
            int quantityToDeduct = itemDto.getQuantity();

            if (itemDto.getStockId() != null) {
                // Deduct from specific stock batch (explicitly requested)
                MedicineStock stock = stockRepository.findByIdWithLock(itemDto.getStockId())
                        .orElseThrow(() -> new ResourceNotFoundException("Stock not found for ID: " + itemDto.getStockId()));

                if (stock.getQuantityAvailable() < quantityToDeduct) {
                    throw new InsufficientStockException("Insufficient stock for batch: " + stock.getBatchNumber());
                }

                if (stock.getExpiryDate().isBefore(LocalDate.now())) {
                    throw new ExpiredStockException(
                        "Batch " + stock.getBatchNumber() + " of " + stock.getMedicine().getName()
                        + " expired on " + stock.getExpiryDate() + ". Cannot dispense expired medicine."
                    );
                }

                stock.setQuantityAvailable(stock.getQuantityAvailable() - quantityToDeduct);
                stockRepository.save(stock);

                PharmacyBillItem billItem = new PharmacyBillItem();
                billItem.setBill(bill);
                billItem.setStock(stock);
                billItem.setQuantity(quantityToDeduct);
                billItem.setUnitPrice(stock.getSellingRate());
                
                BigDecimal lineTotal = stock.getSellingRate().multiply(BigDecimal.valueOf(quantityToDeduct));
                subTotal = subTotal.add(lineTotal);
                
                BigDecimal taxPercentage = stock.getMedicine().getTaxPercentage() != null ? stock.getMedicine().getTaxPercentage() : BigDecimal.ZERO;
                BigDecimal lineTax = lineTotal.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                taxTotal = taxTotal.add(lineTax);

                billItem.setTaxAmount(lineTax);
                billItem.setNetAmount(lineTotal.add(lineTax));
                bill.getItems().add(billItem);
            } else if (itemDto.getMedicineId() != null) {
                // Use pre-fetched batches (FEFO)
                List<MedicineStock> batches = batchesByMedicine.getOrDefault(itemDto.getMedicineId(), Collections.emptyList());

                int remainingToDeduct = quantityToDeduct;
                for (MedicineStock stock : batches) {
                    if (remainingToDeduct <= 0) break;
                    if (stock.getExpiryDate().isBefore(LocalDate.now())) continue; // Skip expired batches
                    if (stock.getQuantityAvailable() <= 0) continue;

                    int deductAmount = Math.min(stock.getQuantityAvailable(), remainingToDeduct);
                    stock.setQuantityAvailable(stock.getQuantityAvailable() - deductAmount);
                    stockRepository.save(stock);

                    PharmacyBillItem billItem = new PharmacyBillItem();
                    billItem.setBill(bill);
                    billItem.setStock(stock);
                    billItem.setQuantity(deductAmount);
                    billItem.setUnitPrice(stock.getSellingRate());
                    
                    BigDecimal lineTotal = stock.getSellingRate().multiply(BigDecimal.valueOf(deductAmount));
                    subTotal = subTotal.add(lineTotal);
                    
                    BigDecimal taxPercentage = stock.getMedicine().getTaxPercentage() != null ? stock.getMedicine().getTaxPercentage() : BigDecimal.ZERO;
                    BigDecimal lineTax = lineTotal.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                    taxTotal = taxTotal.add(lineTax);

                    billItem.setTaxAmount(lineTax);
                    billItem.setNetAmount(lineTotal.add(lineTax));
                    bill.getItems().add(billItem);

                    remainingToDeduct -= deductAmount;
                }

                if (remainingToDeduct > 0) {
                    throw new InsufficientStockException("Insufficient total stock available for medicine ID: " + itemDto.getMedicineId());
                }
            } else {
                throw new IllegalArgumentException("Either stockId or medicineId must be provided");
            }
        }

        bill.setSubTotal(subTotal);
        bill.setTaxAmount(taxTotal);
        BigDecimal netAmount = subTotal.add(taxTotal).subtract(request.getDiscountAmount());
        bill.setNetAmount(netAmount);

        // Handle Advance adjustment
        BigDecimal paidAmount = request.getAmountPaid();
        if (request.isUseAdvance()) {
            if (request.getPatientId() == null) {
                throw new IllegalArgumentException("patientId is required when useAdvance=true");
            }
            PharmacyAdvance advance = advanceRepository.findByPatientId(request.getPatientId())
                    .orElseThrow(() -> new ResourceNotFoundException("No advance found for patientId: " + request.getPatientId()));
            
            BigDecimal adjustment = advance.getBalanceAmount().min(netAmount);
            advance.setBalanceAmount(advance.getBalanceAmount().subtract(adjustment));
            advanceRepository.save(advance);
            paidAmount = paidAmount.add(adjustment);
        }

        bill.setPaidAmount(paidAmount);
        BigDecimal balance = netAmount.subtract(paidAmount);
        bill.setBalanceAmount(balance.compareTo(BigDecimal.ZERO) < 0 ? BigDecimal.ZERO : balance);
        bill.setPaymentMode(request.getPaymentMode().name());

        if (balance.compareTo(BigDecimal.ZERO) <= 0) {
            bill.setPaymentStatus(PaymentStatus.PAID);
            bill.setStatus("PAID");
            bill.setBillType(request.getBillType() != null ? request.getBillType() : "CASH");
        } else {
            bill.setBillType(request.getBillType() != null ? request.getBillType() : "CREDIT");
            if (paidAmount.compareTo(BigDecimal.ZERO) > 0) {
                bill.setPaymentStatus(PaymentStatus.PARTIAL);
                bill.setStatus("PENDING");
            } else {
                bill.setPaymentStatus(PaymentStatus.UNPAID);
                bill.setStatus("PENDING");
            }
        }

        PharmacyBill savedBill = billRepository.save(bill);

        // Create Credit Bill if balance exists
        if (bill.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
            CreditBill creditBill = new CreditBill();
            creditBill.setBill(savedBill);
            creditBill.setTotalAmount(savedBill.getNetAmount());
            creditBill.setPaidAmount(savedBill.getPaidAmount());
            creditBill.setBalanceAmount(savedBill.getBalanceAmount());
            creditBill.setStatus(savedBill.getPaymentStatus());
            creditBillRepository.save(creditBill);
        }

        // Trigger Stock Alerts after transaction commit
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (SaleItemDTO itemDto : request.getItems()) {
                    MedicineStock stock = stockRepository.findById(itemDto.getStockId()).orElse(null);
                    if (stock != null && stock.getMedicine() != null) {
                        alertService.checkAndAlert(stock.getMedicine().getId());
                    }
                }
            }
        });

        // Record the transaction in Prometheus metrics
        Counter.builder("pharmacy_sale_total")
               .description("Total number of pharmacy sales")
               .tag("payment_mode", request.getPaymentMode().name())
               .register(meterRegistry)
               .increment();

        return savedBill;
        } finally {
            sample.stop(Timer.builder("pharmacy_sale_duration_seconds")
                             .description("Time taken to process a pharmacy sale")
                             .register(meterRegistry));
        }
    }

    @Transactional
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyAuthority('ROLE_SYSTEM_ADMIN', 'ROLE_SUPERVISOR')")
    public void cancelSale(Long id) {
        PharmacyBill bill = billRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Bill not found"));

        // 1. Revert Stock
        for (PharmacyBillItem item : bill.getItems()) {
            MedicineStock stock = item.getStock();
            if (stock != null) {
                stock.setQuantityAvailable(stock.getQuantityAvailable() + item.getQuantity());
                stockRepository.save(stock);
                
            }
        }

        // 2. Clear Credit Record
        creditBillRepository.findByBillId(id).ifPresent(creditBillRepository::delete);

        // 3. Mark Bill as Deleted
        bill.setDeleted(true);
        billRepository.save(bill);
    }
}
