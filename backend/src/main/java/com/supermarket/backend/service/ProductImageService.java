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
import java.util.HashSet;
import java.util.List;

@Service
public class ProductImageService {

    public static final int MAX_IMAGES_PER_PRODUCT = 5;
    private static final long MAX_FILE_SIZE_BYTES = 5L * 1024 * 1024; // 5 MB

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;

    public ProductImageService(ProductRepository productRepository, ProductImageRepository productImageRepository) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
    }

    @Transactional
    public List<Long> addImage(Long productId, MultipartFile file) {
        Product product = findProductOrThrow(productId);

        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("No file was uploaded");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new InvalidImageException("Image must be 5 MB or smaller");
        }
        if (productImageRepository.countByProductId(productId) >= MAX_IMAGES_PER_PRODUCT) {
            throw new InvalidImageException("A product can have at most " + MAX_IMAGES_PER_PRODUCT + " images");
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

        ProductImage image = new ProductImage();
        image.setProduct(product);
        image.setImageData(bytes);
        image.setContentType(detectedType);
        image.setSortOrder(productImageRepository.findMaxSortOrder(productId) + 1);
        productImageRepository.save(image);

        if (!product.isHasImage()) {
            product.setHasImage(true);
            productRepository.save(product);
        }

        return productImageRepository.findIdsByProductId(productId);
    }

    @Transactional(readOnly = true)
    public ProductImage getPrimaryImage(Long productId) {
        return productImageRepository.findFirstByProductIdOrderBySortOrderAscIdAsc(productId)
                .orElseThrow(() -> new ResourceNotFoundException("No image for product " + productId));
    }

    @Transactional(readOnly = true)
    public ProductImage getImage(Long productId, Long imageId) {
        return productImageRepository.findByIdAndProductId(imageId, productId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Image " + imageId + " not found for product " + productId));
    }

    @Transactional
    public List<Long> deleteImage(Long productId, Long imageId) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id " + productId);
        }

        int removed = productImageRepository.deleteImage(imageId, productId);
        if (removed == 0) {
            throw new ResourceNotFoundException("Image " + imageId + " not found for product " + productId);
        }

        List<Long> remaining = productImageRepository.findIdsByProductId(productId);

        Product product = findProductOrThrow(productId);
        product.setHasImage(!remaining.isEmpty());
        productRepository.save(product);

        return remaining;
    }

    @Transactional
    public List<Long> reorder(Long productId, List<Long> orderedIds) {
        if (!productRepository.existsById(productId)) {
            throw new ResourceNotFoundException("Product not found with id " + productId);
        }

        List<Long> current = productImageRepository.findIdsByProductId(productId);
        boolean valid = orderedIds != null
                && orderedIds.size() == current.size()
                && new HashSet<>(orderedIds).size() == orderedIds.size()
                && new HashSet<>(orderedIds).equals(new HashSet<>(current));
        if (!valid) {
            throw new InvalidImageException("The order must list each of the product's images exactly once");
        }

        for (int position = 0; position < orderedIds.size(); position++) {
            productImageRepository.updateSortOrder(orderedIds.get(position), productId, position);
        }

        return productImageRepository.findIdsByProductId(productId);
    }

    private Product findProductOrThrow(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + productId));
    }
}