package com.petstore.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record StockAdjustmentRequest(
        @NotNull UUID productId,
        @NotNull MovementType type,
        @NotNull @Min(0) Integer quantity,
        @Size(max = 500) String reason) {
}
