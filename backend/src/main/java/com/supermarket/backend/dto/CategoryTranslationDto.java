package com.supermarket.backend.dto;

import com.supermarket.backend.model.Language;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CategoryTranslationDto {

    @NotNull(message = "Language is required")
    private Language language;

    @NotBlank(message = "Name is required")
    private String name;

    public CategoryTranslationDto() {
    }

    public CategoryTranslationDto(Language language, String name) {
        this.language = language;
        this.name = name;
    }

    public Language getLanguage() {
        return language;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}