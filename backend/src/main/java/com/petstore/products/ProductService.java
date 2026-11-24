package com.petstore.products;

import com.petstore.alerts.AlertService;
import com.petstore.audit.AuditLog;
import com.petstore.audit.AuditLogRepository;
import com.petstore.auth.AppUser;
import com.petstore.auth.AppUserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository products;
    private final AppUserRepository users;
    private final AuditLogRepository auditLogs;
    private final AlertService alerts;

    public ProductService(
            ProductRepository products,
            AppUserRepository users,
            AuditLogRepository auditLogs,
            AlertService alerts) {
        this.products = products;
        this.users = users;
        this.auditLogs = auditLogs;
        this.alerts = alerts;
    }

    public PaginatedResponse<ProductResponse> list(
            String search,
            ProductCategory category,
            boolean lowStockOnly,
            int page,
            int pageSize) {
        String normalizedSearch = search == null || search.isBlank() ? null : search.trim();
        Specification<Product> criteria = (root, query, builder) -> {
            var predicates = new ArrayList<Predicate>();
            if (category != null) {
                predicates.add(builder.equal(root.get("category"), category));
            }
            if (lowStockOnly) {
                predicates.add(builder.le(root.get("stock"), root.get("lowStockThreshold")));
            }
            if (normalizedSearch != null) {
                String pattern = "%" + normalizedSearch.toLowerCase() + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("name")), pattern),
                        builder.like(builder.lower(root.get("description")), pattern)));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
        Page<Product> result = products.findAll(
                criteria,
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
        alerts.refreshForProduct(saved);
        auditLogs.save(new AuditLog(actor, "PRODUCT_CREATED", "Product", saved.getId().toString(), saved.getName()));
        return ProductResponse.from(saved);
    }

    @Transactional
    public ProductResponse update(UUID id, UpdateProductRequest request, UUID actorId) {
        AppUser actor = findUser(actorId);
        Product product = findProduct(id);

        if (request.getName() != null) {
            if (request.getName().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product name must not be blank.");
            }
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
        alerts.refreshForProduct(saved);
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
