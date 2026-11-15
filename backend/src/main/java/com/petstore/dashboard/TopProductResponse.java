package com.petstore.dashboard;

import java.util.UUID;

public record TopProductResponse(UUID productId, String productName, long unitsSold) {

    static TopProductResponse from(TopProductProjection projection) {
        return new TopProductResponse(
                projection.getProductId(),
                projection.getProductName(),
                projection.getUnitsSold());
    }
}
