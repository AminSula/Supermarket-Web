package com.supermarket.backend.repository;

import com.supermarket.backend.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    Optional<ProductImage> findByProductId(Long productId);

    void deleteByProductId(Long productId);
}