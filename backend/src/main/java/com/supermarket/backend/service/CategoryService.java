package com.supermarket.backend.service;

import com.supermarket.backend.dto.CategoryPublicResponse;
import com.supermarket.backend.dto.CategoryRequest;
import com.supermarket.backend.dto.CategoryResponse;
import com.supermarket.backend.dto.CategoryTranslationDto;
import com.supermarket.backend.exception.ResourceNotFoundException;
import com.supermarket.backend.model.Category;
import com.supermarket.backend.model.CategoryTranslation;
import com.supermarket.backend.model.Language;
import com.supermarket.backend.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request) {
        Category category = new Category();
        applyTranslations(category, request);

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));

        // Clear + re-add rather than diffing: simplest correct approach given
        // orphanRemoval=true, and category translation lists are always small.
        category.getTranslations().clear();
        applyTranslations(category, request);

        Category saved = categoryRepository.save(category);
        return toResponse(saved);
    }

    public CategoryResponse getCategory(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id " + id));
        return toResponse(category);
    }

    public List<CategoryResponse> listCategoriesAdmin() {
        return categoryRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("Category not found with id " + id);
        }
        categoryRepository.deleteById(id);
    }

    // Public storefront listing: resolves one name per category for the
    // requested language, falling back to Albanian (the site default) if
    // that specific translation is missing, and finally to whatever
    // translation exists at all so a category is never returned nameless.
    public List<CategoryPublicResponse> listCategoriesPublic(Language language) {
        return categoryRepository.findAll().stream()
                .map(category -> new CategoryPublicResponse(category.getId(), resolveName(category, language)))
                .toList();
    }

    public String resolveName(Category category, Language language) {
        return category.getTranslations().stream()
                .filter(t -> t.getLanguage() == language)
                .map(CategoryTranslation::getName)
                .findFirst()
                .or(() -> category.getTranslations().stream()
                        .filter(t -> t.getLanguage() == Language.AL)
                        .map(CategoryTranslation::getName)
                        .findFirst())
                .or(() -> category.getTranslations().stream()
                        .map(CategoryTranslation::getName)
                        .findFirst())
                .orElse("");
    }

    private void applyTranslations(Category category, CategoryRequest request) {
        for (CategoryTranslationDto dto : request.getTranslations()) {
            category.addTranslation(new CategoryTranslation(dto.getLanguage(), dto.getName()));
        }
    }

    private CategoryResponse toResponse(Category category) {
        List<CategoryTranslationDto> translations = category.getTranslations().stream()
                .map(t -> new CategoryTranslationDto(t.getLanguage(), t.getName()))
                .toList();

        return new CategoryResponse(category.getId(), translations, category.getCreatedAt());
    }
}