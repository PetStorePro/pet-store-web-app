package com.petstore.dashboard;

import com.petstore.sales.SaleItem;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface SaleItemRepository extends JpaRepository<SaleItem, UUID> {

    @Query("""
            SELECT item.product.id AS productId,
                   item.productName AS productName,
                   SUM(item.quantity) AS unitsSold
            FROM SaleItem item
            GROUP BY item.product.id, item.productName
            ORDER BY SUM(item.quantity) DESC, item.productName ASC
            """)
    List<TopProductProjection> findTopProducts(Pageable pageable);
}
