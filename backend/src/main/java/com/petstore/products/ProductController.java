package com.petstore.products;

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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
@Validated
@Tag(name = "Products", description = "Search and manage the persistent product catalog.")
@SecurityRequirement(name = "bearerAuth")
public class ProductController {

    private final ProductService products;

    public ProductController(ProductService products) {
        this.products = products;
    }

    @GetMapping
    @Operation(summary = "List products", description = "Search by name/description or category. Results are paginated (pageSize maximum 100).")
    public PaginatedResponse<ProductResponse> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ProductCategory category,
            @RequestParam(defaultValue = "1") @Min(1) int page,
            @RequestParam(defaultValue = "50") @Min(1) @Max(100) int pageSize) {
        return products.list(search, category, page, pageSize);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get a product", description = "Return one product by its UUID.")
    public ProductResponse get(@PathVariable UUID id) {
        return products.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a product", description = "Requires MANAGER or DEVOPS. The new product starts with zero stock.")
    public ProductResponse create(
            @Valid @RequestBody CreateProductRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return products.create(request, UUID.fromString(jwt.getSubject()));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a product", description = "Requires MANAGER or DEVOPS. Only supplied fields are updated.")
    public ProductResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateProductRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return products.update(id, request, UUID.fromString(jwt.getSubject()));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete a product", description = "Requires MANAGER or DEVOPS. Removes a product without dependent sales or stock history.")
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        products.delete(id, UUID.fromString(jwt.getSubject()));
    }
}
