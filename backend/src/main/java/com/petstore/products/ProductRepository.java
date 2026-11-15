package com.petstore.products;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;

import java.util.Optional;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    @Query("""
            SELECT product FROM Product product
            WHERE (:category IS NULL OR product.category = :category)
              AND (:search IS NULL
                   OR LOWER(product.name) LIKE LOWER(CONCAT('%', :search, '%'))
                   OR LOWER(product.description) LIKE LOWER(CONCAT('%', :search, '%')))
            """)
    Page<Product> search(
            @Param("search") String search,
            @Param("category") ProductCategory category,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT product FROM Product product WHERE product.id = :id")
    Optional<Product> findForUpdate(@Param("id") UUID id);
}
