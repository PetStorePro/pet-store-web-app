package com.petstore.inventory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface StockMovementRepository extends JpaRepository<StockMovement, UUID> {

    @Query("""
            SELECT movement FROM StockMovement movement
            WHERE (:productId IS NULL OR movement.product.id = :productId)
            """)
    Page<StockMovement> search(@Param("productId") UUID productId, Pageable pageable);
}
