package com.petstore.products;

import com.fasterxml.jackson.annotation.JsonSetter;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateProductRequest {

    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 10000)
    private String description;

    private ProductCategory category;

    @DecimalMin("0.00")
    @Digits(integer = 8, fraction = 2)
    private BigDecimal price;

    private LocalDate expiryDate;
    private boolean expiryDateProvided;

    @Min(0)
    private Integer lowStockThreshold;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public ProductCategory getCategory() {
        return category;
    }

    public void setCategory(ProductCategory category) {
        this.category = category;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public LocalDate getExpiryDate() {
        return expiryDate;
    }

    @JsonSetter("expiryDate")
    public void setExpiryDate(LocalDate expiryDate) {
        this.expiryDate = expiryDate;
        this.expiryDateProvided = true;
    }

    public boolean wasExpiryDateProvided() {
        return expiryDateProvided;
    }

    public Integer getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(Integer lowStockThreshold) {
        this.lowStockThreshold = lowStockThreshold;
    }
}
