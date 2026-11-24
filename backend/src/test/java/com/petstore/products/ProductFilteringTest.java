package com.petstore.products;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
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
class ProductFilteringTest {

    @Autowired
    private ProductRepository products;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        // The list endpoint uses only the product repository.
        var service = new ProductService(products, null, null, null);
        mvc = MockMvcBuilders.standaloneSetup(new ProductController(service)).build();

        saveProduct("A Fish flakes", "", ProductCategory.FOOD, 4, 3);
        saveProduct("B Fish pellets", "", ProductCategory.FOOD, 2, 3);
        saveProduct("C Treats", "Made with fish", ProductCategory.FOOD, 5, 5);
        saveProduct("D Fish toy", "", ProductCategory.TOY, 0, 0);
        saveProduct("E Chicken bites", "", ProductCategory.FOOD, 1, 2);
    }

    @Test
    void filtersBeforePaginatingAndUsesEachProductsThreshold() throws Exception {
        assertLowStockPage("1", "B Fish pellets");
        assertLowStockPage("2", "C Treats");
    }

    @Test
    void omittedOrFalseFlagIncludesProductsAboveTheirThreshold() throws Exception {
        mvc.perform(get("/api/products").param("search", "fish").param("category", "FOOD"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.items[0].name").value("A Fish flakes"));

        mvc.perform(get("/api/products").param("lowStockOnly", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.items[0].name").value("A Fish flakes"));
    }

    private void assertLowStockPage(String page, String productName) throws Exception {
        mvc.perform(get("/api/products")
                        .param("search", "FISH")
                        .param("category", "FOOD")
                        .param("lowStockOnly", "true")
                        .param("page", page)
                        .param("pageSize", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value(productName));
    }

    private void saveProduct(String name, String description, ProductCategory category, int stock, int threshold) {
        var product = new Product(name, description, category, BigDecimal.ONE, null, threshold);
        product.setStock(stock);
        products.save(product);
    }
}
