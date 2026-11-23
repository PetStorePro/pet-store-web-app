package com.petstore.alerts;

import com.petstore.audit.AuditLog;
import com.petstore.audit.AuditLogRepository;
import com.petstore.auth.AppUser;
import com.petstore.auth.AppUserRepository;
import com.petstore.products.Product;
import com.petstore.products.ProductCategory;
import com.petstore.products.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class AlertService {

    private static final int EXPIRY_WARNING_DAYS = 30;

    private final AlertRepository alerts;
    private final ProductRepository products;
    private final AppUserRepository users;
    private final AuditLogRepository auditLogs;

    public AlertService(
            AlertRepository alerts,
            ProductRepository products,
            AppUserRepository users,
            AuditLogRepository auditLogs) {
        this.alerts = alerts;
        this.products = products;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    public List<AlertResponse> list(AlertType type, Boolean resolved) {
        Specification<Alert> criteria = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (type != null) {
                predicates.add(builder.equal(root.get("type"), type));
            }
            if (resolved != null) {
                predicates.add(builder.equal(root.get("resolved"), resolved));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        return alerts.findAll(criteria, Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .map(AlertResponse::from)
                .toList();
    }

    @Transactional
    public void resolve(UUID id, UUID actorId) {
        AppUser actor = users.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Alert alert = alerts.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));
        if (!alert.isResolved()) {
            alert.setResolved(true);
            alerts.save(alert);
            auditLogs.save(new AuditLog(
                    actor,
                    "ALERT_RESOLVED",
                    "Alert",
                    id.toString(),
                    alert.getProduct().getName() + ": " + alert.getType()));
        }
    }

    @Transactional
    public void refreshForProduct(Product product) {
        int stock = product.getStock();
        int threshold = product.getLowStockThreshold();
        synchronize(
                product,
                AlertType.LOW_STOCK,
                stock >= 0 && stock <= threshold,
                "Stock is " + stock + ", at or below threshold " + threshold,
                stock == 0 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM);
        synchronize(
                product,
                AlertType.NEGATIVE_STOCK,
                stock < 0,
                "Negative stock detected: " + product.getName() + " is at " + stock,
                AlertSeverity.CRITICAL);

        LocalDate expiryDate = product.getExpiryDate();
        LocalDate today = LocalDate.now();
        boolean expiringMedicine = product.getCategory() == ProductCategory.MEDICINE
                && expiryDate != null
                && !expiryDate.isAfter(today.plusDays(EXPIRY_WARNING_DAYS));
        long daysRemaining = expiryDate == null ? Long.MAX_VALUE : java.time.temporal.ChronoUnit.DAYS.between(today, expiryDate);
        AlertSeverity expirySeverity = daysRemaining < 0
                ? AlertSeverity.CRITICAL
                : daysRemaining <= 7 ? AlertSeverity.HIGH
                : daysRemaining <= 14 ? AlertSeverity.MEDIUM
                : AlertSeverity.LOW;
        synchronize(
                product,
                AlertType.EXPIRING_MEDICINE,
                expiringMedicine,
                expiryDate == null ? "" : expiryMessage(product, daysRemaining),
                expirySeverity);
    }

    @Scheduled(cron = "0 0 2 * * *", zone = "UTC")
    @Transactional
    public void refreshProductAlerts() {
        products.findAll().forEach(this::refreshForProduct);
    }

    private void synchronize(
            Product product,
            AlertType type,
            boolean conditionActive,
            String message,
            AlertSeverity severity) {
        Alert previous = alerts.findFirstByProduct_IdAndTypeOrderByCreatedAtDesc(product.getId(), type).orElse(null);
        if (conditionActive) {
            if (previous == null || !previous.isConditionActive()) {
                alerts.save(new Alert(product, type, message, severity));
            } else {
                previous.setMessage(message);
                previous.setSeverity(severity);
                alerts.save(previous);
            }
        } else if (previous != null && previous.isConditionActive()) {
            previous.setConditionActive(false);
            if (!previous.isResolved()) {
                previous.setResolved(true);
            }
            alerts.save(previous);
        }
    }

    private String expiryMessage(Product product, long daysRemaining) {
        if (daysRemaining < 0) {
            return product.getName() + " expired " + Math.abs(daysRemaining) + " days ago";
        }
        if (daysRemaining == 0) {
            return product.getName() + " expires today";
        }
        return product.getName() + " expires in " + daysRemaining + " days";
    }
}
