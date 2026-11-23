package com.petstore.products;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT product FROM Product product WHERE product.id = :id")
    Optional<Product> findForUpdate(@Param("id") UUID id);

    @Query("SELECT COALESCE(SUM(product.price * product.stock), 0) FROM Product product")
    BigDecimal totalStockValue();

    @Query("SELECT COUNT(product) FROM Product product WHERE product.stock <= product.lowStockThreshold")
    long countLowStock();

    long countByCategoryAndExpiryDateLessThanEqual(ProductCategory category, LocalDate expiryDate);
}
