package com.supermarket.backend.repository;

import com.supermarket.backend.model.Order;
import com.supermarket.backend.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findAllByOrderByCreatedAtDesc();

    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);

    List<Order> findByCreatedAtGreaterThanEqual(LocalDateTime from);

    List<Order> findByCreatedAtGreaterThanEqualAndStatusNot(LocalDateTime from, OrderStatus excludedStatus);

    @Query("SELECT o.status, COUNT(o) FROM Order o GROUP BY o.status")
    List<Object[]> countGroupedByStatus();
}