package com.petstore.products;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ProductResponse(
        String id,
        String name,
        String description,
        ProductCategory category,
        BigDecimal price,
        LocalDate expiryDate,
        int stock,
        int lowStockThreshold,
        Instant createdAt) {

    static ProductResponse from(Product product) {
        return new ProductResponse(
                product.getId().toString(),
                product.getName(),
                product.getDescription(),
                product.getCategory(),
                product.getPrice(),
                product.getExpiryDate(),
                product.getStock(),
                product.getLowStockThreshold(),
                product.getCreatedAt());
    }
}
