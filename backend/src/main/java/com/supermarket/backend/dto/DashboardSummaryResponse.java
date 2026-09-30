package com.supermarket.backend.dto;

import java.math.BigDecimal;

public class DashboardSummaryResponse {

    private long ordersToday;
    private BigDecimal revenueToday;
    private long ordersThisWeek;
    private BigDecimal revenueThisWeek;
    private long ordersThisMonth;
    private BigDecimal revenueThisMonth;

    public DashboardSummaryResponse() {
    }

    public DashboardSummaryResponse(long ordersToday, BigDecimal revenueToday,
                                    long ordersThisWeek, BigDecimal revenueThisWeek,
                                    long ordersThisMonth, BigDecimal revenueThisMonth) {
        this.ordersToday = ordersToday;
        this.revenueToday = revenueToday;
        this.ordersThisWeek = ordersThisWeek;
        this.revenueThisWeek = revenueThisWeek;
        this.ordersThisMonth = ordersThisMonth;
        this.revenueThisMonth = revenueThisMonth;
    }

    public long getOrdersToday() {
        return ordersToday;
    }

    public void setOrdersToday(long ordersToday) {
        this.ordersToday = ordersToday;
    }

    public BigDecimal getRevenueToday() {
        return revenueToday;
    }

    public void setRevenueToday(BigDecimal revenueToday) {
        this.revenueToday = revenueToday;
    }

    public long getOrdersThisWeek() {
        return ordersThisWeek;
    }

    public void setOrdersThisWeek(long ordersThisWeek) {
        this.ordersThisWeek = ordersThisWeek;
    }

    public BigDecimal getRevenueThisWeek() {
        return revenueThisWeek;
    }

    public void setRevenueThisWeek(BigDecimal revenueThisWeek) {
        this.revenueThisWeek = revenueThisWeek;
    }

    public long getOrdersThisMonth() {
        return ordersThisMonth;
    }

    public void setOrdersThisMonth(long ordersThisMonth) {
        this.ordersThisMonth = ordersThisMonth;
    }

    public BigDecimal getRevenueThisMonth() {
        return revenueThisMonth;
    }

    public void setRevenueThisMonth(BigDecimal revenueThisMonth) {
        this.revenueThisMonth = revenueThisMonth;
    }
}