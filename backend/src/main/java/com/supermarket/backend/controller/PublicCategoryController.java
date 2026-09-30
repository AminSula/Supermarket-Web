package com.supermarket.backend.controller;

import com.supermarket.backend.dto.CategoryPublicResponse;
import com.supermarket.backend.model.Language;
import com.supermarket.backend.service.CategoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class PublicCategoryController {

    private final CategoryService categoryService;

    public PublicCategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryPublicResponse> list(@RequestParam(defaultValue = "AL") Language lang) {
        return categoryService.listCategoriesPublic(lang);
    }
}