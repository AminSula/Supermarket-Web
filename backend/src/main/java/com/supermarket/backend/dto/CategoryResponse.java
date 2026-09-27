package com.supermarket.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CategoryResponse {

    private Long id;
    private List<CategoryTranslationDto> translations;
    private LocalDateTime createdAt;

    public CategoryResponse() {
    }

    public CategoryResponse(Long id, List<CategoryTranslationDto> translations, LocalDateTime createdAt) {
        this.id = id;
        this.translations = translations;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<CategoryTranslationDto> getTranslations() {
        return translations;
    }

    public void setTranslations(List<CategoryTranslationDto> translations) {
        this.translations = translations;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}