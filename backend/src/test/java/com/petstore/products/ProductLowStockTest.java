package com.petstore.products;

import com.petstore.alerts.AlertService;
import com.petstore.audit.AuditLogRepository;
import com.petstore.auth.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DataJpaTest(properties = {
        "spring.flyway.enabled=false",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
@Import(ProductService.class)
class ProductLowStockTest {
    @Autowired ProductRepository products;
    @Autowired ProductService service;
    @MockitoBean AppUserRepository users;
    @MockitoBean AuditLogRepository auditLogs;
    @MockitoBean AlertService alerts;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.standaloneSetup(new ProductController(service)).build();
        save("A healthy food", "kibble", ProductCategory.FOOD, 6, 5);
        save("B low food", "kibble", ProductCategory.FOOD, 2, 5);
        save("C threshold food", "kibble", ProductCategory.FOOD, 5, 5);
        save("D empty toy", "ball", ProductCategory.TOY, 0, 0);
        save("E negative food", "kibble", ProductCategory.FOOD, -1, 0);
    }

    @Test
    void includesBelowEqualZeroAndNegativeStockButExcludesHealthyStock() throws Exception {
        mvc.perform(get("/api/products").param("lowStockOnly", "true"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(4))
                .andExpect(jsonPath("$.items.length()").value(4))
                .andExpect(jsonPath("$.items[0].name").value("B low food"))
                .andExpect(jsonPath("$.items[1].name").value("C threshold food"))
                .andExpect(jsonPath("$.items[2].name").value("D empty toy"))
                .andExpect(jsonPath("$.items[3].name").value("E negative food"));
    }

    @Test
    void combinesSearchAndCategoryBeforePaginationAndCountsAllMatches() throws Exception {
        mvc.perform(get("/api/products").param("lowStockOnly", "true")
                        .param("search", " KIBBLE ").param("category", "FOOD")
                        .param("page", "2").param("pageSize", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.page").value(2))
                .andExpect(jsonPath("$.pageSize").value(1))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("C threshold food"));
        mvc.perform(get("/api/products").param("lowStockOnly", "true")
                        .param("search", "food").param("category", "TOY"))
                .andExpect(jsonPath("$.total").value(0))
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void omittedOrFalseRestoresCatalogAndPreservesOtherFilters() throws Exception {
        for (String value : new String[] { "", "false" }) {
            var request = get("/api/products");
            if (!value.isEmpty()) request.param("lowStockOnly", value);
            mvc.perform(request)
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.total").value(5))
                    .andExpect(jsonPath("$.items[0].name").value("A healthy food"));
        }
        mvc.perform(get("/api/products").param("lowStockOnly", "false")
                        .param("search", "healthy").param("category", "FOOD"))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.items[0].name").value("A healthy food"));
    }

    private void save(String name, String description, ProductCategory category, int stock, int threshold) {
        Product product = new Product(name, description, category, BigDecimal.ONE, null, threshold);
        product.setStock(stock);
        products.saveAndFlush(product);
    }
}
