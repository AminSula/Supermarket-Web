package com.supermarket.backend.service;

import com.supermarket.backend.dto.PageResponse;
import com.supermarket.backend.dto.ProductCreateRequest;
import com.supermarket.backend.dto.ProductPublicResponse;
import com.supermarket.backend.dto.ProductResponse;
import com.supermarket.backend.exception.ResourceNotFoundException;
import com.supermarket.backend.model.Category;
import com.supermarket.backend.model.Language;
import com.supermarket.backend.model.Product;
import com.supermarket.backend.repository.CategoryRepository;
import com.supermarket.backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          CategoryService categoryService) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
    }

    public ProductResponse createProduct(ProductCreateRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());

        Product product = new Product();
        applyRequest(product, request, category);
        // active defaults to true in the entity

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    // Admin listing — unlike the public one, this includes inactive
    // (soft-deleted) products too, so the owner can still see/manage them.
    public List<ProductResponse> listAdminProducts() {
        return productRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public ProductResponse getProduct(Long id) {
        Product product = findProductOrThrow(id);
        return toResponse(product);
    }

    public ProductResponse updateProduct(Long id, ProductCreateRequest request) {
        Product product = findProductOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());

        applyRequest(product, request, category);

        Product saved = productRepository.save(product);
        return toResponse(saved);
    }

    // Soft delete: sets active = false rather than removing the row, so
    // past OrderItems referencing this product still resolve correctly.
    // The product simply stops appearing in public browsing/detail results.
    public void deleteProduct(Long id) {
        Product product = findProductOrThrow(id);
        product.setActive(false);
        productRepository.save(product);
    }

    // Public storefront browsing: active products only, optional category
    // filter + text search, paginated.
    public PageResponse<ProductPublicResponse> listPublicProducts(
            Long categoryId, String search, Language language, int page, int size) {

        Page<Product> result = productRepository.searchActive(
                categoryId, search, PageRequest.of(page, size));

        Page<ProductPublicResponse> mapped = result.map(product -> toPublicResponse(product, language));
        return PageResponse.from(mapped);
    }

    // Public product detail — 404s if the product doesn't exist OR has been
    // soft-hidden (active = false), so a removed item isn't reachable by
    // guessing its old URL.
    public ProductPublicResponse getPublicProduct(Long id, Language language) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));

        return toPublicResponse(product, language);
    }

    private Product findProductOrThrow(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + categoryId));
    }

    private void applyRequest(Product product, ProductCreateRequest request, Category category) {
        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setCategory(category);
    }

    private ProductPublicResponse toPublicResponse(Product product, Language language) {
        String categoryName = categoryService.resolveName(product.getCategory(), language);

        return new ProductPublicResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory().getId(),
                categoryName
        );
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory().getId(),
                product.isActive(),
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}