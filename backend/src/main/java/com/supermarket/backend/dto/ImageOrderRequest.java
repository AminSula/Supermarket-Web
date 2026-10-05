package com.supermarket.backend.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class ImageOrderRequest {

    @NotNull
    private List<Long> imageIds;

    public ImageOrderRequest() {
    }

    public List<Long> getImageIds() {
        return imageIds;
    }

    public void setImageIds(List<Long> imageIds) {
        this.imageIds = imageIds;
    }
}