package com.petstore.sales;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record RegisterSaleRequest(
        @NotNull UUID productId,
        @NotNull @Positive Integer quantity,
        @Size(max = 120) String customerName) {
}
