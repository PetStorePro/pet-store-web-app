package com.petstore.dashboard;

import com.petstore.sales.SaleResponse;

import java.math.BigDecimal;
import java.util.List;

public record DashboardSummaryResponse(
        long totalProducts,
        BigDecimal totalStockValue,
        long salesToday,
        long lowStockCount,
        long expiringCount,
        long openAlerts,
        List<SaleResponse> recentSales,
        List<TopProductResponse> topProducts) {
}
