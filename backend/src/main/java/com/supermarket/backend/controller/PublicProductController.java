package com.supermarket.backend.controller;

import com.supermarket.backend.dto.PageResponse;
import com.supermarket.backend.dto.ProductPublicResponse;
import com.supermarket.backend.model.Language;
import com.supermarket.backend.service.ProductService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/products")
public class PublicProductController {

    private final ProductService productService;

    public PublicProductController(ProductService productService) {
        this.productService = productService;
    }

    // e.g. GET /api/products?categoryId=1&search=milk&lang=en&page=0&size=20
    @GetMapping
    public PageResponse<ProductPublicResponse> list(
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "AL") Language lang,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return productService.listPublicProducts(categoryId, search, lang, page, size);
    }

    @GetMapping("/{id}")
    public ProductPublicResponse get(
            @PathVariable Long id,
            @RequestParam(defaultValue = "AL") Language lang
    ) {
        return productService.getPublicProduct(id, lang);
    }
}