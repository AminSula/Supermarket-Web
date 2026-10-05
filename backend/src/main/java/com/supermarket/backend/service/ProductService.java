package com.supermarket.backend.service;

import com.supermarket.backend.dto.PageResponse;
import com.supermarket.backend.dto.ProductDeleteResponse;
import com.supermarket.backend.dto.ProductCreateRequest;
import com.supermarket.backend.dto.ProductPublicResponse;
import com.supermarket.backend.dto.ProductResponse;
import com.supermarket.backend.exception.ResourceNotFoundException;
import com.supermarket.backend.model.Category;
import com.supermarket.backend.model.Language;
import com.supermarket.backend.model.Product;
import com.supermarket.backend.repository.CategoryRepository;
import com.supermarket.backend.repository.OrderItemRepository;
import com.supermarket.backend.repository.ProductImageIdView;
import com.supermarket.backend.repository.ProductImageRepository;
import com.supermarket.backend.repository.ProductRepository;
import com.supermarket.backend.repository.ProductSpecifications;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CategoryService categoryService;
    private final ProductImageRepository productImageRepository;
    private final OrderItemRepository orderItemRepository;

    public ProductService(ProductRepository productRepository,
                          CategoryRepository categoryRepository,
                          CategoryService categoryService,
                          ProductImageRepository productImageRepository,
                          OrderItemRepository orderItemRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.categoryService = categoryService;
        this.productImageRepository = productImageRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public ProductResponse createProduct(ProductCreateRequest request) {
        Category category = findCategoryOrThrow(request.getCategoryId());

        Product product = new Product();
        applyRequest(product, request, category);
        // active defaults to true in the entity

        Product saved = productRepository.save(product);
        return toResponse(saved, List.of(), false);
    }

    // Admin listing
    public List<ProductResponse> listAdminProducts() {
        List<Product> products = productRepository.findAll();
        List<Long> ids = products.stream().map(Product::getId).toList();
        Map<Long, List<Long>> imageIds = imageIdsByProduct(ids);
        Set<Long> ordered = new HashSet<>();
        if (!ids.isEmpty()) {
            ordered.addAll(orderItemRepository.findProductIdsWithOrders(ids));
        }

        return products.stream()
                .map(product -> toResponse(product, imageIds.getOrDefault(product.getId(), List.of()),
                        ordered.contains(product.getId())))
                .toList();
    }

    public ProductResponse getProduct(Long id) {
        Product product = findProductOrThrow(id);
        return toResponse(product, productImageRepository.findIdsByProductId(id),
                orderItemRepository.existsByProductId(id));
    }

    public ProductResponse updateProduct(Long id, ProductCreateRequest request) {
        Product product = findProductOrThrow(id);
        Category category = findCategoryOrThrow(request.getCategoryId());

        applyRequest(product, request, category);

        Product saved = productRepository.save(product);
        return toResponse(saved, productImageRepository.findIdsByProductId(saved.getId()),
                orderItemRepository.existsByProductId(saved.getId()));
    }

    // "Smart" delete/Archived
    @Transactional
    public ProductDeleteResponse deleteProduct(Long id) {
        Product product = findProductOrThrow(id);

        if (orderItemRepository.existsByProductId(id)) {
            product.setActive(false);
            productRepository.save(product);
            return new ProductDeleteResponse(true);
        }

        productImageRepository.deleteAllByProductId(id);
        productRepository.deleteById(id);
        return new ProductDeleteResponse(false);
    }

    // Brings an archived product back to the store.
    @Transactional
    public ProductResponse restoreProduct(Long id) {
        Product product = findProductOrThrow(id);
        product.setActive(true);

        Product saved = productRepository.save(product);
        return toResponse(saved, productImageRepository.findIdsByProductId(saved.getId()),
                orderItemRepository.existsByProductId(saved.getId()));
    }

    // Public storefront browsing
    public PageResponse<ProductPublicResponse> listPublicProducts(
            Long categoryId, String search, Language language, int page, int size) {

        Specification<Product> spec = Specification.where(ProductSpecifications.isActive())
                .and(ProductSpecifications.hasCategory(categoryId))
                .and(ProductSpecifications.nameContains(search));

        Page<Product> result = productRepository.findAll(spec, PageRequest.of(page, size));

        Map<Long, List<Long>> imageIds = imageIdsByProduct(
                result.getContent().stream().map(Product::getId).toList());

        Page<ProductPublicResponse> mapped = result.map(product ->
                toPublicResponse(product, language, imageIds.getOrDefault(product.getId(), List.of())));
        return PageResponse.from(mapped);
    }

    // Public product detail
    public ProductPublicResponse getPublicProduct(Long id, Language language) {
        Product product = productRepository.findById(id)
                .filter(Product::isActive)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));

        return toPublicResponse(product, language, productImageRepository.findIdsByProductId(id));
    }

    // Image ids for many products in a single query.
    private Map<Long, List<Long>> imageIdsByProduct(Collection<Long> productIds) {
        Map<Long, List<Long>> result = new HashMap<>();
        if (productIds.isEmpty()) {
            return result;
        }
        for (ProductImageIdView row : productImageRepository.findIdViewsByProductIds(productIds)) {
            result.computeIfAbsent(row.getProductId(), key -> new ArrayList<>()).add(row.getId());
        }
        return result;
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

    private ProductPublicResponse toPublicResponse(Product product, Language language, List<Long> imageIds) {
        String categoryName = categoryService.resolveName(product.getCategory(), language);

        return new ProductPublicResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory().getId(),
                categoryName,
                product.isHasImage(),
                imageIds
        );
    }

    private ProductResponse toResponse(Product product, List<Long> imageIds, boolean hasOrders) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getDescription(),
                product.getPrice(),
                product.getStock(),
                product.getCategory().getId(),
                product.isActive(),
                product.isHasImage(),
                imageIds,
                hasOrders,
                product.getCreatedAt(),
                product.getUpdatedAt()
        );
    }
}