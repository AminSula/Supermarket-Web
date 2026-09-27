package com.supermarket.backend.repository;

import com.supermarket.backend.model.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductRepository extends JpaRepository<Product, Long> {

    // Public browsing query: only active products, optionally filtered by
    // category and/or a case-insensitive name search. Either filter can be
    // omitted (null) — the (:param IS NULL OR ...) pattern lets one query
    // cover "no filters", "category only", "search only", and "both".
    @Query("SELECT p FROM Product p WHERE p.active = true " +
            "AND (:categoryId IS NULL OR p.category.id = :categoryId) " +
            "AND (:search IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Product> searchActive(
            @Param("categoryId") Long categoryId,
            @Param("search") String search,
            Pageable pageable
    );
}