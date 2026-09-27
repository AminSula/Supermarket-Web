package com.supermarket.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public class CategoryRequest {

    @NotEmpty(message = "At least one translation is required")
    @Valid
    private List<CategoryTranslationDto> translations;

    public CategoryRequest() {
    }

    public List<CategoryTranslationDto> getTranslations() {
        return translations;
    }

    public void setTranslations(List<CategoryTranslationDto> translations) {
        this.translations = translations;
    }
}