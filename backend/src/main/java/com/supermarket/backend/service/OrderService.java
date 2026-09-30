package com.supermarket.backend.service;

import com.supermarket.backend.dto.OrderCreateRequest;
import com.supermarket.backend.dto.OrderItemRequest;
import com.supermarket.backend.dto.OrderItemResponse;
import com.supermarket.backend.dto.OrderResponse;
import com.supermarket.backend.dto.OrderStatusUpdateRequest;
import com.supermarket.backend.exception.InsufficientStockException;
import com.supermarket.backend.exception.ResourceNotFoundException;
import com.supermarket.backend.model.Order;
import com.supermarket.backend.model.OrderItem;
import com.supermarket.backend.model.OrderStatus;
import com.supermarket.backend.model.Product;
import com.supermarket.backend.repository.OrderRepository;
import com.supermarket.backend.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;

    public OrderService(OrderRepository orderRepository, ProductRepository productRepository) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
    }

    @Transactional
    public OrderResponse placeOrder(OrderCreateRequest request) {
        Order order = new Order();
        order.setCustomerName(request.getCustomerName());
        order.setPhone(request.getPhone());
        order.setAddress(request.getAddress());
        order.setNotes(request.getNotes());

        BigDecimal total = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .filter(Product::isActive)
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found with id " + itemRequest.getProductId()));

            if (product.getStock() < itemRequest.getQuantity()) {
                throw new InsufficientStockException(
                        "Not enough stock for \"" + product.getName() + "\" (available: " + product.getStock() + ")");
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            OrderItem orderItem = new OrderItem();
            orderItem.setProduct(product);
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPriceAtOrder(unitPrice);
            orderItem.setSubtotal(subtotal);

            order.addItem(orderItem);
            total = total.add(subtotal);
        }

        order.setTotalAmount(total);

        Order saved = orderRepository.save(order);
        return toResponse(saved);
    }

    public List<OrderResponse> listOrders(OrderStatus statusFilter) {
        List<Order> orders = statusFilter != null
                ? orderRepository.findByStatusOrderByCreatedAtDesc(statusFilter)
                : orderRepository.findAllByOrderByCreatedAtDesc();

        return orders.stream().map(this::toResponse).toList();
    }

    public OrderResponse getOrder(Long id) {
        Order order = findOrderOrThrow(id);
        return toResponse(order);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, OrderStatusUpdateRequest request) {
        Order order = findOrderOrThrow(id);
        OrderStatus oldStatus = order.getStatus();
        OrderStatus newStatus = request.getStatus();

        if (oldStatus == newStatus) {
            return toResponse(order);
        }

        boolean enteringConfirmed = newStatus == OrderStatus.CONFIRMED && oldStatus != OrderStatus.CONFIRMED;
        boolean leavingConfirmed = oldStatus == OrderStatus.CONFIRMED && newStatus != OrderStatus.CONFIRMED;

        if (enteringConfirmed) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                if (product.getStock() < item.getQuantity()) {
                    throw new InsufficientStockException(
                            "Not enough stock for \"" + product.getName() + "\" (available: " + product.getStock() + ")");
                }
            }
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() - item.getQuantity());
            }
        } else if (leavingConfirmed) {
            for (OrderItem item : order.getItems()) {
                Product product = item.getProduct();
                product.setStock(product.getStock() + item.getQuantity());
            }
        }

        order.setStatus(newStatus);
        Order saved = orderRepository.save(order);
        return toResponse(saved);
    }

    private Order findOrderOrThrow(Long id) {
        return orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id " + id));
    }

    private OrderResponse toResponse(Order order) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(item -> new OrderItemResponse(
                        item.getProduct().getId(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPriceAtOrder(),
                        item.getSubtotal()
                ))
                .toList();

        return new OrderResponse(
                order.getId(),
                order.getCustomerName(),
                order.getPhone(),
                order.getAddress(),
                order.getNotes(),
                order.getStatus(),
                order.getPaymentMethod(),
                order.getTotalAmount(),
                items,
                order.getCreatedAt()
        );
    }
}