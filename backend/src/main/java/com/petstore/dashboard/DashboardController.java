package com.petstore.dashboard;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "Dashboard", description = "Manager and DevOps operational aggregates from persistent data.")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService dashboard;

    public DashboardController(DashboardService dashboard) {
        this.dashboard = dashboard;
    }

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary", description = "Requires MANAGER or DEVOPS. Returns product and stock totals, today's sales, low-stock and expiring counts, open alerts, recent sales, and top products.")
    public DashboardSummaryResponse summary() {
        return dashboard.summary();
    }
}
