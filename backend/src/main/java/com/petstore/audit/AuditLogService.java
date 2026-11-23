package com.petstore.audit;

import com.petstore.products.PaginatedResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogs;

    public AuditLogService(AuditLogRepository auditLogs) {
        this.auditLogs = auditLogs;
    }

    @Transactional(readOnly = true)
    public PaginatedResponse<AuditLogResponse> list(UUID userId, String action, int page, int pageSize) {
        Specification<AuditLog> filters = (root, query, criteriaBuilder) -> criteriaBuilder.conjunction();
        if (userId != null) {
            filters = filters.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.equal(root.get("user").get("id"), userId));
        }
        if (action != null && !action.isBlank()) {
            String pattern = "%" + action.trim().toLowerCase() + "%";
            filters = filters.and((root, query, criteriaBuilder) ->
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("action")), pattern));
        }

        Page<AuditLog> result = auditLogs.findAll(
                filters,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PaginatedResponse<>(
                result.getContent().stream().map(AuditLogResponse::from).toList(),
                result.getTotalElements(),
                result.getNumber() + 1,
                result.getSize());
    }
}
