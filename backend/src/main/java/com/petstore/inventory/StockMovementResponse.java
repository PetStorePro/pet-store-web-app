package com.petstore.inventory;

import java.time.Instant;

public record StockMovementResponse(
        String id,
        String productId,
        String productName,
        MovementType type,
        int quantity,
        String reason,
        String userId,
        String username,
        Instant createdAt) {

    static StockMovementResponse from(StockMovement movement) {
        return new StockMovementResponse(
                movement.getId().toString(),
                movement.getProduct().getId().toString(),
                movement.getProduct().getName(),
                movement.getType(),
                movement.getQuantity(),
                movement.getReason(),
                movement.getUser().getId().toString(),
                movement.getUser().getUsername(),
                movement.getCreatedAt());
    }
}
