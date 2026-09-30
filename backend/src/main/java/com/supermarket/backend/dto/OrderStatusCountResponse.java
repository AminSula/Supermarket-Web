package com.supermarket.backend.dto;

import com.supermarket.backend.model.OrderStatus;

public class OrderStatusCountResponse {

    private OrderStatus status;
    private long count;

    public OrderStatusCountResponse() {
    }

    public OrderStatusCountResponse(OrderStatus status, long count) {
        this.status = status;
        this.count = count;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}