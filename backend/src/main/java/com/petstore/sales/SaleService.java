package com.petstore.sales;

import com.petstore.audit.AuditLog;
import com.petstore.audit.AuditLogRepository;
import com.petstore.auth.AppUser;
import com.petstore.auth.AppUserRepository;
import com.petstore.inventory.MovementType;
import com.petstore.inventory.StockMovement;
import com.petstore.inventory.StockMovementRepository;
import com.petstore.products.PaginatedResponse;
import com.petstore.products.Product;
import com.petstore.products.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class SaleService {

    private final SaleRepository sales;
    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final AppUserRepository users;
    private final AuditLogRepository auditLogs;

    public SaleService(
            SaleRepository sales,
            ProductRepository products,
            StockMovementRepository movements,
            AppUserRepository users,
            AuditLogRepository auditLogs) {
        this.sales = sales;
        this.products = products;
        this.movements = movements;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    public PaginatedResponse<SaleResponse> list(LocalDate from, LocalDate to, int page, int pageSize) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "'from' must be on or before 'to'.");
        }
        Instant fromInclusive = from == null ? null : from.atStartOfDay().toInstant(ZoneOffset.UTC);
        Instant toExclusive = to == null ? null : to.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        Specification<Sale> criteria = (root, query, builder) -> {
            var predicates = new ArrayList<Predicate>();
            if (fromInclusive != null) {
                predicates.add(builder.greaterThanOrEqualTo(root.<Instant>get("createdAt"), fromInclusive));
            }
            if (toExclusive != null) {
                predicates.add(builder.lessThan(root.<Instant>get("createdAt"), toExclusive));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        Page<Sale> result = sales.findAll(
                criteria,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PaginatedResponse<>(
                result.getContent().stream().map(SaleResponse::from).toList(),
                result.getTotalElements(),
                page,
                pageSize);
    }

    @Transactional
    public SaleResponse register(RegisterSaleRequest request, UUID actorId) {
        AppUser actor = users.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Product product = products.findForUpdate(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        if (product.getStock() < request.quantity()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Not enough stock for " + product.getName() + " (available: " + product.getStock() + ")");
        }

        product.setStock(product.getStock() - request.quantity());
        products.save(product);
        BigDecimal total = product.getPrice().multiply(BigDecimal.valueOf(request.quantity()));
        String customerName = request.customerName() == null || request.customerName().isBlank()
                ? null
                : request.customerName().trim();

        Sale sale = new Sale(customerName, actor, total);
        sale.addItem(product, request.quantity(), product.getPrice());
        Sale saved = sales.save(sale);
        movements.save(new StockMovement(
                product,
                MovementType.SALE,
                -request.quantity(),
                "Sale " + saved.getId(),
                actor));
        auditLogs.save(new AuditLog(
                actor,
                "SALE_REGISTERED",
                "Sale",
                saved.getId().toString(),
                "Total " + total));
        return SaleResponse.from(saved);
    }
}
