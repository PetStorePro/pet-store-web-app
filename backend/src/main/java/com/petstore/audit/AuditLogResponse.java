package com.petstore.audit;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID userId,
        String username,
        String action,
        String entityType,
        String entityId,
        String details,
        Instant createdAt) {

    static AuditLogResponse from(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getUser().getId(),
                log.getUser().getUsername(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getDetails(),
                log.getCreatedAt());
    }
}
