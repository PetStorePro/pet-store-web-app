package com.petstore.sales;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record SaleResponse(
        String id,
        List<SaleItemResponse> items,
        BigDecimal total,
        String customerName,
        String userId,
        String username,
        Instant createdAt) {

    public static SaleResponse from(Sale sale) {
        return new SaleResponse(
                sale.getId().toString(),
                sale.getItems().stream().map(SaleItemResponse::from).toList(),
                sale.getTotal(),
                sale.getCustomerName(),
                sale.getUser().getId().toString(),
                sale.getUser().getUsername(),
                sale.getCreatedAt());
    }
}
