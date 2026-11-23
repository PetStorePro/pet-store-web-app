package com.petstore.dashboard;

import com.petstore.alerts.AlertRepository;
import com.petstore.products.ProductCategory;
import com.petstore.products.ProductRepository;
import com.petstore.sales.SaleRepository;
import com.petstore.sales.SaleResponse;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ProductRepository products;
    private final SaleRepository sales;
    private final SaleItemRepository saleItems;
    private final AlertRepository alerts;

    public DashboardService(
            ProductRepository products,
            SaleRepository sales,
            SaleItemRepository saleItems,
            AlertRepository alerts) {
        this.products = products;
        this.sales = sales;
        this.saleItems = saleItems;
        this.alerts = alerts;
    }

    public DashboardSummaryResponse summary() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);
        var startOfToday = today.atStartOfDay().toInstant(ZoneOffset.UTC);
        var startOfTomorrow = today.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
        List<SaleResponse> recentSales = sales.findTop5ByOrderByCreatedAtDesc().stream()
                .map(SaleResponse::from)
                .toList();
        List<TopProductResponse> topProducts = saleItems.findTopProducts(PageRequest.of(0, 5)).stream()
                .map(TopProductResponse::from)
                .toList();

        return new DashboardSummaryResponse(
                products.count(),
                products.totalStockValue(),
                sales.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(startOfToday, startOfTomorrow),
                products.countLowStock(),
                products.countByCategoryAndExpiryDateLessThanEqual(ProductCategory.MEDICINE, today.plusDays(30)),
                alerts.countByResolvedFalse(),
                recentSales,
                topProducts);
    }
}
