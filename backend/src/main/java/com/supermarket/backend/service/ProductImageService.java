package com.supermarket.backend.service;

import com.supermarket.backend.exception.InvalidImageException;
import com.supermarket.backend.exception.ResourceNotFoundException;
import com.supermarket.backend.model.Product;
import com.supermarket.backend.model.ProductImage;
import com.supermarket.backend.repository.ProductImageRepository;
import com.supermarket.backend.repository.ProductRepository;
import com.supermarket.backend.util.ImageTypeDetector;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Service
public class ProductImageService {

    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    public ProductImageService(ProductRepository productRepository, ProductImageRepository productImageRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
    }

    @Transactional
    public void uploadImage(Long productId, MultipartFile file) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));

        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("No file was uploaded");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidImageException("Image must be 5 MB or smaller");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidImageException("Could not read the uploaded file");
        }

        String detectedType = ImageTypeDetector.detect(bytes);
        if (detectedType == null) {
            throw new InvalidImageException("File must be a JPEG, PNG, or WebP image");
        }

        ProductImage image = productImageRepository.findByProductId(productId)
                .orElseGet(() -> {
                    ProductImage created = new ProductImage();
                    created.setProduct(product);
                    return created;
                });

        image.setImageData(bytes);
        image.setContentType(detectedType);
        productImageRepository.save(image);

        product.setHasImage(true);
        productRepository.save(product);
    }

    public ProductImage getImage(Long productId) {
        return productImageRepository.findByProductId(productId)
                .orElseThrow(() -> new ResourceNotFoundException("No image for product " + productId));
    }

    @Transactional
    public void deleteImage(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));

        productImageRepository.deleteByProductId(productId);
        product.setHasImage(false);
        productRepository.save(product);
    }
}