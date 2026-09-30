package com.supermarket.backend.service;

import com.supermarket.backend.dto.DashboardSummaryResponse;
import com.supermarket.backend.dto.OrderStatusCountResponse;
import com.supermarket.backend.dto.RevenuePointResponse;
import com.supermarket.backend.dto.TopProductResponse;
import com.supermarket.backend.model.Order;
import com.supermarket.backend.model.OrderStatus;
import com.supermarket.backend.repository.OrderItemRepository;
import com.supermarket.backend.repository.OrderRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final int LOOKBACK_DAYS = 35;

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    public DashboardService(OrderRepository orderRepository, OrderItemRepository orderItemRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
    }

    public DashboardSummaryResponse getSummary() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime startOfWeek = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).atStartOfDay();
        LocalDateTime startOfMonth = today.withDayOfMonth(1).atStartOfDay();

        LocalDateTime lookbackStart = today.minusDays(LOOKBACK_DAYS).atStartOfDay();

        List<Order> recentOrders = orderRepository.findByCreatedAtGreaterThanEqual(lookbackStart);

        List<Order> revenueOrders = recentOrders.stream()
                .filter(o -> o.getStatus() != OrderStatus.CANCELLED)
                .toList();

        return new DashboardSummaryResponse(
                count(recentOrders, startOfToday),
                sumRevenue(revenueOrders, startOfToday),
                count(recentOrders, startOfWeek),
                sumRevenue(revenueOrders, startOfWeek),
                count(recentOrders, startOfMonth),
                sumRevenue(revenueOrders, startOfMonth)
        );
    }

    public List<TopProductResponse> getTopProducts(int limit) {
        List<Object[]> rows = orderItemRepository.findTopSellingProducts(
                OrderStatus.CANCELLED, PageRequest.of(0, limit));

        List<TopProductResponse> result = new ArrayList<>();
        for (Object[] row : rows) {
            result.add(new TopProductResponse(
                    (Long) row[0],
                    (String) row[1],
                    ((Number) row[2]).longValue(),
                    (BigDecimal) row[3]
            ));
        }
        return result;
    }

    public List<RevenuePointResponse> getRevenueOverTime(int days) {
        LocalDate today = LocalDate.now();
        LocalDate firstDay = today.minusDays(days - 1L);
        LocalDateTime from = firstDay.atStartOfDay();

        List<Order> orders = orderRepository.findByCreatedAtGreaterThanEqualAndStatusNot(from, OrderStatus.CANCELLED);

        Map<LocalDate, BigDecimal> revenueByDay = orders.stream()
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().toLocalDate(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalAmount, BigDecimal::add)
                ));

        List<RevenuePointResponse> points = new ArrayList<>();
        for (int i = 0; i < days; i++) {
            LocalDate day = firstDay.plusDays(i);
            points.add(new RevenuePointResponse(day, revenueByDay.getOrDefault(day, BigDecimal.ZERO)));
        }
        return points;
    }

    public List<OrderStatusCountResponse> getOrdersByStatus() {
        Map<OrderStatus, Long> counts = new java.util.EnumMap<>(OrderStatus.class);
        for (Object[] row : orderRepository.countGroupedByStatus()) {
            counts.put((OrderStatus) row[0], ((Number) row[1]).longValue());
        }

        List<OrderStatusCountResponse> result = new ArrayList<>();
        for (OrderStatus status : OrderStatus.values()) {
            result.add(new OrderStatusCountResponse(status, counts.getOrDefault(status, 0L)));
        }
        return result;
    }

    private long count(List<Order> orders, LocalDateTime since) {
        return orders.stream().filter(atOrAfter(since)).count();
    }

    private BigDecimal sumRevenue(List<Order> orders, LocalDateTime since) {
        return orders.stream()
                .filter(atOrAfter(since))
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private Predicate<Order> atOrAfter(LocalDateTime since) {
        return o -> !o.getCreatedAt().isBefore(since);
    }
}