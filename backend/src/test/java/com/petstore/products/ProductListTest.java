package com.petstore.products;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.cfg.Configuration;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.jpa.repository.support.JpaRepositoryFactory;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class ProductListTest {

    private static SessionFactory sessions;
    private Session session;
    private MockMvc mvc;

    @BeforeAll
    static void seedCatalog() {
        sessions = new Configuration()
                .addAnnotatedClass(Product.class)
                .setProperty("hibernate.connection.url", "jdbc:h2:mem:product-list")
                .setProperty("hibernate.hbm2ddl.auto", "create-drop")
                .buildSessionFactory();
        sessions.inTransaction(session -> {
            persist(session, "A Crunch", "", ProductCategory.FOOD, 4, 3);
            persist(session, "B Crunch", "", ProductCategory.TOY, 2, 2);
            persist(session, "C Biscuits", "", ProductCategory.FOOD, 1, 3);
            persist(session, "D Crunch", "", ProductCategory.FOOD, 3, 3);
            persist(session, "E Kibble", "crunch bites", ProductCategory.FOOD, 4, 5);
        });
    }

    @AfterAll
    static void closeCatalog() {
        if (sessions != null) {
            sessions.close();
        }
    }

    @BeforeEach
    void setUp() {
        session = sessions.openSession();
        var repository = new JpaRepositoryFactory(session).getRepository(ProductRepository.class);
        mvc = MockMvcBuilders.standaloneSetup(
                new ProductController(new ProductService(repository, null, null, null))).build();
    }

    @AfterEach
    void closeSession() {
        session.close();
    }

    @Test
    void filtersByStockSearchAndCategoryBeforePaginating() throws Exception {
        mvc.perform(get("/api/products")
                        .param("lowStockOnly", "true").param("search", "CRUNCH")
                        .param("category", "FOOD").param("pageSize", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("D Crunch"));

        mvc.perform(get("/api/products")
                        .param("lowStockOnly", "true").param("search", "CRUNCH")
                        .param("category", "FOOD").param("pageSize", "1").param("page", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("E Kibble"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/products", "/api/products?lowStockOnly=false"})
    void includesProductsAboveTheirThresholdWhenFilterIsOff(String url) throws Exception {
        mvc.perform(get(url))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(5))
                .andExpect(jsonPath("$.items[0].name").value("A Crunch"));
    }

    private static void persist(
            Session session, String name, String description, ProductCategory category, int stock, int threshold) {
        var product = new Product(name, description, category, BigDecimal.ONE, null, threshold);
        product.setStock(stock);
        session.persist(product);
    }
}
