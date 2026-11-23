package com.petstore.sales;

import com.petstore.products.PaginatedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/sales")
@Validated
@Tag(name = "Sales", description = "Sales history and transactional sales registration.")
@SecurityRequirement(name = "bearerAuth")
public class SaleController {

    private final SaleService sales;

    public SaleController(SaleService sales) {
        this.sales = sales;
    }

    @GetMapping
    @Operation(summary = "List sales", description = "Returns newest sales first; optional from/to dates use ISO format yyyy-MM-dd and are inclusive.")
    public PaginatedResponse<SaleResponse> list(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int pageSize) {
        return sales.list(from, to, page, pageSize);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register a sale", description = "Checks stock and atomically records the sale, decrements stock, creates a movement, and writes an audit event. Returns HTTP 409 when stock is insufficient.")
    public SaleResponse register(
            @Valid @RequestBody RegisterSaleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return sales.register(request, UUID.fromString(jwt.getSubject()));
    }
}
