package com.supermarket.backend.controller;

import com.supermarket.backend.dto.PageResponse;
import com.supermarket.backend.dto.ProductPublicResponse;
import com.supermarket.backend.model.Language;
import com.supermarket.backend.model.ProductImage;
import com.supermarket.backend.service.ProductImageService;
import com.supermarket.backend.service.ProductService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;

import java.time.Duration;

@RestController
@RequestMapping("/api/products")
public class PublicProductController {

    private final ProductService productService;
    private final ProductImageService productImageService;

    public PublicProductController(ProductService productService, ProductImageService productImageService) {
        this.productService = productService;
        this.productImageService = productImageService;
    }

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

    @GetMapping("/{id}/image")
    public ResponseEntity<byte[]> getImage(@PathVariable Long id, WebRequest webRequest) {
        ProductImage image = productImageService.getImage(id);

        String etag = "\"" + id + "-" + image.getUpdatedAt().toString().hashCode() + "\"";
        if (webRequest.checkNotModified(etag)) {
            return null; // WebRequest already set the 304 response for us
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.getContentType()))
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .eTag(etag)
                .body(image.getImageData());
    }
}