package com.petstore.inventory;

import com.petstore.products.PaginatedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/inventory")
@Validated
@Tag(name = "Inventory", description = "Stock movement history and manual stock adjustments.")
@SecurityRequirement(name = "bearerAuth")
public class InventoryController {

    private final InventoryService inventory;

    public InventoryController(InventoryService inventory) {
        this.inventory = inventory;
    }

    @GetMapping("/movements")
    @Operation(summary = "List stock movements", description = "Returns newest movements first, optionally filtered by product UUID.")
    public PaginatedResponse<StockMovementResponse> listMovements(
            @RequestParam(required = false) UUID productId,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int pageSize) {
        return inventory.list(productId, page, pageSize);
    }

    @PostMapping("/adjustments")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Adjust stock", description = "IN adds units, OUT removes units, and ADJUSTMENT sets an absolute quantity. Every adjustment is recorded and audited.")
    public StockMovementResponse adjustStock(
            @Valid @RequestBody StockAdjustmentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return inventory.adjust(request, UUID.fromString(jwt.getSubject()));
    }
}
