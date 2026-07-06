package com.pharmadesk.backend.repository;

import com.pharmadesk.backend.model.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    
    @Query("SELECT d FROM Doctor d WHERE " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(d.specialization) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(d.contactNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Doctor> searchDoctors(@Param("searchTerm") String searchTerm, Pageable pageable);
    
    @Query("SELECT d FROM Doctor d WHERE LOWER(d.name) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Doctor> searchByName(@Param("name") String name);
}
