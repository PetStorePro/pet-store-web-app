package com.petstore.alerts;

import java.time.Instant;

public record AlertResponse(
        String id,
        AlertType type,
        String productId,
        String productName,
        String message,
        AlertSeverity severity,
        Instant createdAt,
        boolean resolved) {

    static AlertResponse from(Alert alert) {
        return new AlertResponse(
                alert.getId().toString(),
                alert.getType(),
                alert.getProduct().getId().toString(),
                alert.getProduct().getName(),
                alert.getMessage(),
                alert.getSeverity(),
                alert.getCreatedAt(),
                alert.isResolved());
    }
}
