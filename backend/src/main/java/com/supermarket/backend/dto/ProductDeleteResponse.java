package com.supermarket.backend.dto;

public class ProductDeleteResponse {

    private boolean archived;

    public ProductDeleteResponse() {
    }

    public ProductDeleteResponse(boolean archived) {
        this.archived = archived;
    }

    public boolean isArchived() {
        return archived;
    }

    public void setArchived(boolean archived) {
        this.archived = archived;
    }
}