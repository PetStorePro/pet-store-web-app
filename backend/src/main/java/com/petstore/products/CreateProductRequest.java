package com.petstore.products;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateProductRequest(
        @NotBlank @Size(max = 150) String name,
        @Size(max = 10000) String description,
        @NotNull ProductCategory category,
        @NotNull @DecimalMin("0.00") @Digits(integer = 8, fraction = 2) BigDecimal price,
        LocalDate expiryDate,
        @NotNull @Min(0) Integer lowStockThreshold) {
}
