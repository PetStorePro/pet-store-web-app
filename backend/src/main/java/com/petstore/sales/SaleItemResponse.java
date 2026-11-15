package com.petstore.sales;

import java.math.BigDecimal;

public record SaleItemResponse(String productId, String productName, int quantity, BigDecimal unitPrice) {

    static SaleItemResponse from(SaleItem item) {
        return new SaleItemResponse(
                item.getProduct().getId().toString(),
                item.getProductName(),
                item.getQuantity(),
                item.getUnitPrice());
    }
}
