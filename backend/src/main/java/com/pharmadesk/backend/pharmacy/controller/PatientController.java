package com.pharmadesk.backend.pharmacy.controller;
import jakarta.validation.Valid;

import com.pharmadesk.backend.model.Patient;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.pharmacy.repository.PatientRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pharmacy/patients")
public class PatientController {

    private final PatientRepository patientRepository;

    public PatientController(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<Patient>>> getAllPatients() {
        return ResponseEntity.ok(ApiResponse.success(patientRepository.findAll(), "Patients fetched"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<java.util.List<Patient>>> searchPatients(@RequestParam String query) {
        java.util.List<Patient> patients = patientRepository.findByNameContainingIgnoreCaseOrUhidContainingIgnoreCase(query, query);
        return ResponseEntity.ok(ApiResponse.success(patients, "Patients fetched"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Patient>> createPatient(@Valid @RequestBody Patient patient) {
        // Save first to get ID for UHID generation
        patient.setUhid("PENDING");
        Patient saved = patientRepository.save(patient);
        
        // Generate UHID: UHID-000001
        String uhid = "UHID-" + String.format("%06d", saved.getId());
        saved.setUhid(uhid);
        
        return ResponseEntity.ok(ApiResponse.success(patientRepository.save(saved), "Patient registered"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Patient>> updatePatient(@PathVariable Long id, @Valid @RequestBody Patient patientDetails) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        patient.setName(patientDetails.getName());
        patient.setDob(patientDetails.getDob());
        patient.setGender(patientDetails.getGender());
        patient.setPhone(patientDetails.getPhone());
        patient.setAddress(patientDetails.getAddress());
        patient.setInsuranceId(patientDetails.getInsuranceId());
        patient.setPreferredDelivery(patientDetails.getPreferredDelivery());
        patient.setDeliveryAddress(patientDetails.getDeliveryAddress());
        
        return ResponseEntity.ok(ApiResponse.success(patientRepository.save(patient), "Patient updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePatient(@PathVariable Long id) {
        Patient patient = patientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        patient.setDeleted(true);
        patientRepository.save(patient);
        return ResponseEntity.ok(ApiResponse.success(null, "Patient deleted"));
    }
}