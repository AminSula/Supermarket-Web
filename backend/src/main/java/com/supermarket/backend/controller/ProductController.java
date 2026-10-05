package com.supermarket.backend.controller;

import com.supermarket.backend.dto.ImageOrderRequest;
import com.supermarket.backend.dto.ProductCreateRequest;
import com.supermarket.backend.dto.ProductDeleteResponse;
import com.supermarket.backend.dto.ProductResponse;
import com.supermarket.backend.service.ProductImageService;
import com.supermarket.backend.service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/products")
public class ProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;

    public ProductController(ProductService productService, ProductImageService productImageService) {
        this.productService = productService;
        this.productImageService = productImageService;
    }

    @PostMapping
    public ResponseEntity<ProductResponse> createProduct(@Valid @RequestBody ProductCreateRequest request) {
        ProductResponse response = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public List<ProductResponse> list() {
        return productService.listAdminProducts();
    }

    @GetMapping("/{id}")
    public ProductResponse get(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @PutMapping("/{id}")
    public ProductResponse update(@PathVariable Long id, @Valid @RequestBody ProductCreateRequest request) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    public ProductDeleteResponse delete(@PathVariable Long id) {
        return productService.deleteProduct(id);
    }

    @PostMapping("/{id}/restore")
    public ProductResponse restore(@PathVariable Long id) {
        return productService.restoreProduct(id);
    }

    @PostMapping("/{id}/images")
    public ResponseEntity<List<Long>> addImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        List<Long> imageIds = productImageService.addImage(id, file);
        return ResponseEntity.status(HttpStatus.CREATED).body(imageIds);
    }

    @DeleteMapping("/{id}/images/{imageId}")
    public List<Long> deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        return productImageService.deleteImage(id, imageId);
    }

    @PutMapping("/{id}/images/order")
    public List<Long> reorderImages(@PathVariable Long id, @Valid @RequestBody ImageOrderRequest request) {
        return productImageService.reorder(id, request.getImageIds());
    }
}