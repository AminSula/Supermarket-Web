package com.supermarket.backend.controller;

import com.supermarket.backend.dto.DashboardSummaryResponse;
import com.supermarket.backend.dto.OrderStatusCountResponse;
import com.supermarket.backend.dto.RevenuePointResponse;
import com.supermarket.backend.dto.TopProductResponse;
import com.supermarket.backend.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping("/summary")
    public DashboardSummaryResponse summary() {
        return dashboardService.getSummary();
    }

    @GetMapping("/top-products")
    public List<TopProductResponse> topProducts(@RequestParam(defaultValue = "5") int limit) {
        return dashboardService.getTopProducts(limit);
    }

    @GetMapping("/revenue-over-time")
    public List<RevenuePointResponse> revenueOverTime(@RequestParam(defaultValue = "14") int days) {
        return dashboardService.getRevenueOverTime(days);
    }

    @GetMapping("/orders-by-status")
    public List<OrderStatusCountResponse> ordersByStatus() {
        return dashboardService.getOrdersByStatus();
    }
}