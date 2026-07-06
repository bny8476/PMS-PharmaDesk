package com.pharmadesk.backend.sales.service;

import com.pharmadesk.backend.model.*;
import com.pharmadesk.backend.sales.dto.SaleItemDTO;
import com.pharmadesk.backend.sales.dto.SaleRequestDTO;
import com.pharmadesk.backend.sales.model.*;
import com.pharmadesk.backend.pharmacy.enums.PaymentMode;
import com.pharmadesk.backend.pharmacy.enums.PaymentStatus;
import com.pharmadesk.backend.pharmacy.exception.ExpiredStockException;
import com.pharmadesk.backend.pharmacy.exception.InsufficientStockException;
import com.pharmadesk.backend.pharmacy.repository.*;
import com.pharmadesk.backend.sales.repository.*;
import com.pharmadesk.backend.service.StockAlertService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import org.springframework.transaction.support.TransactionSynchronizationManager;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.micrometer.core.instrument.MeterRegistry;
import org.junit.jupiter.api.AfterEach;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class SaleServiceTest {

    @Mock
    private MedicineStockRepository stockRepository;

    @Mock
    private PharmacyBillRepository billRepository;

    @Mock
    private CreditBillRepository creditBillRepository;

    @Mock
    private PharmacyAdvanceRepository advanceRepository;

    @Mock
    private MedicineRepository medicineRepository;

    @Mock
    private StockAlertService alertService;

    @Mock
    private com.pharmadesk.backend.pharmacy.repository.PrescriptionRepository prescriptionRepository;

    private MeterRegistry meterRegistry = new SimpleMeterRegistry();

    private SaleService saleService;

    private Medicine testMedicine;
    private MedicineStock testStock;
    private SaleRequestDTO requestDTO;
    private SaleItemDTO itemDTO;

    @Mock
    private com.pharmadesk.backend.repository.DoctorRepository doctorRepository;

    @BeforeEach
    void setUp() {
        saleService = new SaleService(
            stockRepository, billRepository, creditBillRepository,
            advanceRepository, medicineRepository, alertService, meterRegistry, prescriptionRepository, doctorRepository
        );TransactionSynchronizationManager.initSynchronization();

        testMedicine = new Medicine();
        testMedicine.setId(10L);
        testMedicine.setName("Paracetamol");
        testMedicine.setTaxPercentage(BigDecimal.valueOf(10));

        testStock = new MedicineStock();
        testStock.setId(100L);
        testStock.setMedicine(testMedicine);
        testStock.setBatchNumber("BATCH1");
        testStock.setQuantityAvailable(50);
        testStock.setSellingRate(BigDecimal.valueOf(10.0));
        testStock.setExpiryDate(LocalDate.now().plusMonths(6));

        itemDTO = new SaleItemDTO();
        itemDTO.setStockId(100L);
        itemDTO.setQuantity(5);
        itemDTO.setMedicineId(10L);

        requestDTO = new SaleRequestDTO();
        requestDTO.setPatientName("John Doe");
        requestDTO.setItems(List.of(itemDTO));
        requestDTO.setPaymentMode(PaymentMode.CASH);
        requestDTO.setAmountPaid(BigDecimal.valueOf(55.0)); // 5 * 10 = 50 + 10% tax = 55
        requestDTO.setDiscountAmount(BigDecimal.ZERO);
    }

    @AfterEach
    void tearDown() {
        TransactionSynchronizationManager.clearSynchronization();
    }

    @Test
    void processSale_should_deduct_stock_fefo_and_return_saved_bill() {
        // Arrange
        when(stockRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testStock));
        when(billRepository.save(any(PharmacyBill.class))).thenAnswer(i -> {
            PharmacyBill b = i.getArgument(0);
            b.setId(1L);
            return b;
        });

        // Act
        PharmacyBill bill = saleService.processSale(requestDTO);

        // Assert
        assertEquals(45, testStock.getQuantityAvailable());
        verify(stockRepository).save(testStock);
        verify(billRepository).save(any(PharmacyBill.class));

        assertEquals(BigDecimal.valueOf(50.0).setScale(2), bill.getSubTotal().setScale(2));
        assertEquals(BigDecimal.valueOf(5.0).setScale(2), bill.getTaxAmount().setScale(2));
        assertEquals(BigDecimal.valueOf(55.0).setScale(2), bill.getNetAmount().setScale(2));
        assertEquals(PaymentStatus.PAID, bill.getPaymentStatus());
    }

    @Test
    void processSale_should_throw_InsufficientStockException_when_qty_exceeds_available() {
        itemDTO.setQuantity(60); // stock has 50
        when(stockRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testStock));

        assertThrows(InsufficientStockException.class, () -> saleService.processSale(requestDTO));
    }

    @Test
    void processSale_should_throw_ExpiredStockException_when_batch_is_expired() {
        testStock.setExpiryDate(LocalDate.now().minusDays(1)); // Expired yesterday
        when(stockRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testStock));

        assertThrows(ExpiredStockException.class, () -> saleService.processSale(requestDTO));
    }

    @Test
    void processSale_should_apply_advance_payment_and_reduce_advance_balance() {
        requestDTO.setUseAdvance(true);
        requestDTO.setPatientId(123L);
        requestDTO.setAmountPaid(BigDecimal.ZERO); // Paid 0 from pocket, will use advance

        PharmacyAdvance advance = new PharmacyAdvance();
        advance.setPatientId(123L);
        advance.setBalanceAmount(BigDecimal.valueOf(100.0));

        when(stockRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testStock));
        when(advanceRepository.findByPatientId(123L)).thenReturn(Optional.of(advance));
        when(billRepository.save(any(PharmacyBill.class))).thenAnswer(i -> i.getArgument(0));

        PharmacyBill bill = saleService.processSale(requestDTO);

        assertEquals(BigDecimal.valueOf(45.0).setScale(2), advance.getBalanceAmount().setScale(2));
        verify(advanceRepository).save(advance);
        assertEquals(BigDecimal.valueOf(55.0).setScale(2), bill.getPaidAmount().setScale(2));
        assertEquals(PaymentStatus.PAID, bill.getPaymentStatus());
    }

    @Test
    void processSale_should_create_credit_bill_when_balance_remains() {
        requestDTO.setAmountPaid(BigDecimal.valueOf(20.0)); // Total is 55, paying 20

        when(stockRepository.findByIdWithLock(100L)).thenReturn(Optional.of(testStock));
        when(billRepository.save(any(PharmacyBill.class))).thenAnswer(i -> {
            PharmacyBill b = i.getArgument(0);
            b.setId(99L);
            return b;
        });

        PharmacyBill bill = saleService.processSale(requestDTO);

        assertEquals(PaymentStatus.PARTIAL, bill.getPaymentStatus());
        assertEquals("CREDIT", bill.getBillType());

        ArgumentCaptor<CreditBill> creditCaptor = ArgumentCaptor.forClass(CreditBill.class);
        verify(creditBillRepository).save(creditCaptor.capture());

        CreditBill creditBill = creditCaptor.getValue();
        assertEquals(BigDecimal.valueOf(55.0).setScale(2), creditBill.getTotalAmount().setScale(2));
        assertEquals(BigDecimal.valueOf(20.0).setScale(2), creditBill.getPaidAmount().setScale(2));
        assertEquals(BigDecimal.valueOf(35.0).setScale(2), creditBill.getBalanceAmount().setScale(2));
    }

    @Test
    void cancelSale_should_restore_stock_and_delete_credit_bill() {
        PharmacyBill bill = new PharmacyBill();
        bill.setId(5L);
        bill.setDeleted(false);

        PharmacyBillItem billItem = new PharmacyBillItem();
        billItem.setQuantity(5);
        billItem.setStock(testStock);

        bill.setItems(new ArrayList<>(List.of(billItem)));

        when(billRepository.findById(5L)).thenReturn(Optional.of(bill));
        
        CreditBill creditBill = new CreditBill();
        when(creditBillRepository.findByBillId(5L)).thenReturn(Optional.of(creditBill));

        saleService.cancelSale(5L);

        // Stock should be 50 + 5 = 55
        assertEquals(55, testStock.getQuantityAvailable());
        verify(stockRepository).save(testStock);
        verify(creditBillRepository).delete(creditBill);
        verify(billRepository).save(bill);
        assertTrue(bill.isDeleted());
    }
}
