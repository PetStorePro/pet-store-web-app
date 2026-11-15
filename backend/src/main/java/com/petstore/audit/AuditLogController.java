package com.petstore.audit;

import com.petstore.products.PaginatedResponse;
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
public class AuditLogController {

    private final AuditLogService auditLogs;

    public AuditLogController(AuditLogService auditLogs) {
        this.auditLogs = auditLogs;
    }

    @GetMapping
    public PaginatedResponse<AuditLogResponse> list(
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) String action,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int pageSize) {
        return auditLogs.list(userId, action, page, pageSize);
    }
}
