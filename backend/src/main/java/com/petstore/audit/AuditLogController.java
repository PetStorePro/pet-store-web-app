package com.petstore.audit;

import com.petstore.products.PaginatedResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/audit-logs")
@Validated
@Tag(name = "Audit logs", description = "Manager-only, read-only audit history for product, stock, sale, and alert operations.")
@SecurityRequirement(name = "bearerAuth")
public class AuditLogController {

    private final AuditLogService auditLogs;

    public AuditLogController(AuditLogService auditLogs) {
        this.auditLogs = auditLogs;
    }

    @GetMapping
    @Operation(summary = "List audit logs", description = "Returns newest events first. Filter action by substring or by actor user UUID; pageSize maximum is 100.")
    public PaginatedResponse<AuditLogResponse> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int pageSize) {
        return auditLogs.list(userId, action, page, pageSize);
    }
}
