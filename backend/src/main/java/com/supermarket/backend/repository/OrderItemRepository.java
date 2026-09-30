package com.supermarket.backend.repository;

import com.supermarket.backend.model.OrderItem;
import com.supermarket.backend.model.OrderStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    @Query("SELECT oi.product.id, oi.product.name, SUM(oi.quantity), SUM(oi.subtotal) " +
            "FROM OrderItem oi " +
            "WHERE oi.order.status <> :excludedStatus " +
            "GROUP BY oi.product.id, oi.product.name " +
            "ORDER BY SUM(oi.quantity) DESC")
    List<Object[]> findTopSellingProducts(@Param("excludedStatus") OrderStatus excludedStatus, Pageable pageable);
}