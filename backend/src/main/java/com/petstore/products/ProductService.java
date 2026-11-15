package com.petstore.products;

import com.petstore.audit.AuditLog;
import com.petstore.audit.AuditLogRepository;
import com.petstore.auth.AppUser;
import com.petstore.auth.AppUserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository products;
    private final AppUserRepository users;
    private final AuditLogRepository auditLogs;

    public ProductService(
            ProductRepository products,
            AppUserRepository users,
            AuditLogRepository auditLogs) {
        this.products = products;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    public PaginatedResponse<ProductResponse> list(
            String search,
            ProductCategory category,
            int page,
            int pageSize) {
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        Page<Product> result = products.search(
                normalizedSearch,
                category,
                PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.ASC, "name")));

        return new PaginatedResponse<>(
                result.getContent().stream().map(ProductResponse::from).toList(),
                result.getTotalElements(),
                page,
                pageSize);
    }

    public ProductResponse get(UUID id) {
        return ProductResponse.from(findProduct(id));
    }

    @Transactional
    public ProductResponse create(CreateProductRequest request, UUID actorId) {
        AppUser actor = findUser(actorId);
        Product product = new Product(
                request.name().trim(),
                request.description() == null ? "" : request.description(),
                request.category(),
                request.price(),
                request.expiryDate(),
                request.lowStockThreshold());
        Product saved = products.save(product);
        auditLogs.save(new AuditLog(actor, "PRODUCT_CREATED", "Product", saved.getId().toString(), saved.getName()));
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request, UUID actorId) {
        AppUser actor = findUser(actorId);
        Product product = findProduct(id);

        if (request.getName() != null) {
            product.setName(request.getName().trim());
        }
        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getCategory() != null) {
            product.setCategory(request.getCategory());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.wasExpiryDateProvided()) {
            product.setExpiryDate(request.getExpiryDate());
        }
        if (request.getLowStockThreshold() != null) {
            product.setLowStockThreshold(request.getLowStockThreshold());
        }

        Product saved = products.save(product);
        auditLogs.save(new AuditLog(actor, "PRODUCT_UPDATED", "Product", saved.getId().toString(), saved.getName()));
        return ProductResponse.from(saved);
    }

    @Transactional
    public void delete(UUID id, UUID actorId) {
        AppUser actor = findUser(actorId);
        Product product = findProduct(id);

        products.delete(product);
        try {
            products.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "This product has related sales, inventory, or alert history and cannot be deleted.",
                    exception);
        }

        auditLogs.save(new AuditLog(
                actor,
                "PRODUCT_DELETED",
                "Product",
                product.getId().toString(),
                product.getName()));
    }

    private Product findProduct(UUID id) {
        return products.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private AppUser findUser(UUID id) {
        return users.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }
}
