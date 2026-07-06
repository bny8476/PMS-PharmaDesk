package com.pharmadesk.backend.service;

import com.pharmadesk.backend.model.Doctor;
import com.pharmadesk.backend.repository.DoctorRepository;
import com.pharmadesk.backend.pharmacy.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepository;

    public DoctorService(DoctorRepository doctorRepository) {
        this.doctorRepository = doctorRepository;
    }

    public Page<Doctor> getAllDoctors(String search, Pageable pageable) {
        if (search != null && !search.trim().isEmpty()) {
            return doctorRepository.searchDoctors(search, pageable);
        }
        return doctorRepository.findAll(pageable);
    }

    public List<Doctor> searchDoctorsByName(String name) {
        return doctorRepository.searchByName(name);
    }

    public Doctor getDoctorById(Long id) {
        return doctorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + id));
    }

    @Transactional
    public Doctor createDoctor(Doctor doctor) {
        return doctorRepository.save(doctor);
    }

    @Transactional
    public Doctor updateDoctor(Long id, Doctor doctorDetails) {
        Doctor doctor = getDoctorById(id);
        doctor.setName(doctorDetails.getName());
        doctor.setSpecialization(doctorDetails.getSpecialization());
        doctor.setContactNumber(doctorDetails.getContactNumber());
        doctor.setRegistrationNumber(doctorDetails.getRegistrationNumber());
        doctor.setClinicAddress(doctorDetails.getClinicAddress());
        return doctorRepository.save(doctor);
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = getDoctorById(id);
        doctorRepository.delete(doctor);
    }
}
