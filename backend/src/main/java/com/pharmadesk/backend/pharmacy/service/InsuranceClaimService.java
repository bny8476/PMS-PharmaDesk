package com.pharmadesk.backend.pharmacy.service;

import com.pharmadesk.backend.model.InsuranceClaim;
import com.pharmadesk.backend.model.InsuranceClaimLineItem;
import com.pharmadesk.backend.model.InsuranceProvider;
import com.pharmadesk.backend.pharmacy.repository.InsuranceClaimRepository;
import com.pharmadesk.backend.pharmacy.repository.InsuranceProviderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.pharmadesk.backend.pharmacy.dto.common.PageResponse;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class InsuranceClaimService {

    private final InsuranceClaimRepository claimRepository;
    private final InsuranceProviderRepository providerRepository;
    private final com.pharmadesk.backend.repository.UserRepository userRepository;

    public InsuranceClaimService(InsuranceClaimRepository claimRepository,
                                 InsuranceProviderRepository providerRepository,
                                 com.pharmadesk.backend.repository.UserRepository userRepository) {
        this.claimRepository = claimRepository;
        this.providerRepository = providerRepository;
        this.userRepository = userRepository;
    }

    public PageResponse<InsuranceClaim> getAllClaims(Pageable pageable) {
        Page<InsuranceClaim> pageResult = claimRepository.findAll(pageable);
        return new PageResponse<>(pageResult);
    }

    public InsuranceClaim getClaimById(String id) {
        return claimRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Claim not found: " + id));
    }

    @Transactional
    public InsuranceClaim createClaim(InsuranceClaim claim) {
        claim.setClaimId(UUID.randomUUID().toString());
        claim.setClaimNumber("CLM-" + (System.currentTimeMillis() % 100000));
        claim.setClaimDate(LocalDate.now());
        claim.setClaimStatus("draft");
        claim.setCreatedBy(getCurrentUserId());

        if (claim.getCoveredAmount() == null) {
            java.math.BigDecimal total = claim.getTotalBillAmount() != null ? claim.getTotalBillAmount() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal nonCovered = claim.getNonCoveredAmount() != null ? claim.getNonCoveredAmount() : java.math.BigDecimal.ZERO;
            claim.setCoveredAmount(total.subtract(nonCovered));
        }

        if (claim.getLineItems() != null) {
            claim.getLineItems().forEach(item -> {
                item.setClaimLineId(UUID.randomUUID().toString());
                item.setInsuranceClaim(claim);
            });
        }
        return claimRepository.save(claim);
    }

    private Long getCurrentUserId() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !(auth instanceof org.springframework.security.authentication.AnonymousAuthenticationToken)) {
                String username = auth.getName();
                return userRepository.findByUsername(username)
                        .map(com.pharmadesk.backend.model.User::getId)
                        .orElse(1L);
            }
        } catch (Exception e) {}
        return 1L; // Fallback
    }

    @Transactional
    public InsuranceClaim updateClaimStatus(String claimId, String status) {
        InsuranceClaim claim = getClaimById(claimId);
        claim.setClaimStatus(status);
        if ("approved".equalsIgnoreCase(status)) {
            claim.setApprovalDate(LocalDate.now());
        } else if ("settled".equalsIgnoreCase(status)) {
            claim.setSettlementDate(LocalDate.now());
        }
        return claimRepository.save(claim);
    }

    public PageResponse<InsuranceProvider> getAllProviders(Pageable pageable) {
        Page<InsuranceProvider> pageResult = providerRepository.findAll(pageable);
        return new PageResponse<>(pageResult);
    }

    @Transactional
    public InsuranceProvider createProvider(InsuranceProvider provider) {
        provider.setProviderId(UUID.randomUUID().toString());
        return providerRepository.save(provider);
    }
}
