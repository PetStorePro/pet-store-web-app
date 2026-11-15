package com.petstore.sales;

import com.petstore.products.PaginatedResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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
public class SaleController {

    private final SaleService sales;

    public SaleController(SaleService sales) {
        this.sales = sales;
    }

    @GetMapping
    public PaginatedResponse<SaleResponse> list(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int pageSize) {
        return sales.list(from, to, page, pageSize);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public SaleResponse register(
            @Valid @RequestBody RegisterSaleRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return sales.register(request, UUID.fromString(jwt.getSubject()));
    }
}
