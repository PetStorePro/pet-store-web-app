package com.petstore.inventory;

import com.petstore.audit.AuditLog;
import com.petstore.audit.AuditLogRepository;
import com.petstore.auth.AppUser;
import com.petstore.auth.AppUserRepository;
import com.petstore.products.PaginatedResponse;
import com.petstore.products.Product;
import com.petstore.products.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class InventoryService {

    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final AppUserRepository users;
    private final AuditLogRepository auditLogs;

    public InventoryService(
            ProductRepository products,
            StockMovementRepository movements,
            AppUserRepository users,
            AuditLogRepository auditLogs) {
        this.products = products;
        this.movements = movements;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    public PaginatedResponse<StockMovementResponse> list(UUID productId, int page, int pageSize) {
        Page<StockMovement> result = movements.search(
                productId,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        return new PaginatedResponse<>(
                result.getContent().stream().map(StockMovementResponse::from).toList(),
                result.getTotalElements(),
                page,
                pageSize);
    }

    @Transactional
    public StockMovementResponse adjust(StockAdjustmentRequest request, UUID actorId) {
        AppUser actor = users.findById(actorId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        Product product = products.findForUpdate(request.productId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));

        int oldStock = product.getStock();
        int movementQuantity;
        try {
            switch (request.type()) {
                case IN -> {
                    requirePositiveQuantity(request.quantity());
                    movementQuantity = request.quantity();
                    product.setStock(Math.addExact(oldStock, movementQuantity));
                }
                case OUT -> {
                    requirePositiveQuantity(request.quantity());
                    movementQuantity = -request.quantity();
                    product.setStock(Math.subtractExact(oldStock, request.quantity()));
                }
                case ADJUSTMENT -> {
                    movementQuantity = Math.subtractExact(request.quantity(), oldStock);
                    product.setStock(request.quantity());
                }
                case SALE -> throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "SALE movements are created only when a sale is registered.");
                default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported movement type");
            }
        } catch (ArithmeticException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stock is outside the supported integer range.", exception);
        }

        products.save(product);
        StockMovement saved = movements.save(new StockMovement(
                product,
                request.type(),
                movementQuantity,
                normalizeReason(request.reason()),
                actor));
        auditLogs.save(new AuditLog(
                actor,
                "STOCK_ADJUSTED",
                "StockMovement",
                saved.getId().toString(),
                product.getName() + ": " + formatSigned(movementQuantity)));
        return StockMovementResponse.from(saved);
    }

    private void requirePositiveQuantity(int quantity) {
        if (quantity <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Quantity must be greater than zero.");
        }
    }

    private String normalizeReason(String reason) {
        return reason == null || reason.isBlank() ? null : reason.trim();
    }

    private String formatSigned(int quantity) {
        return quantity > 0 ? "+" + quantity : Integer.toString(quantity);
    }
}
