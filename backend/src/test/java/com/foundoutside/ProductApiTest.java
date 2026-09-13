package com.foundoutside;

import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "logging.level.root=WARN")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class ProductApiTest extends ApiIntegrationTestBase {
    @Test
    void listsAllSeedProductsByName() {
        Response response = get("/api/products");
        assertEquals(200, response.statusCode());
        assertEquals(13, response.jsonPath().getList("items").size());
        assertEquals("Acorn", response.jsonPath().getString("items[0].name"));
        assertEquals("Very Normal Feather", response.jsonPath().getString("items[12].name"));
    }

    @Test
    void filtersAndSortsOnTheBackend() {
        Response response = get("/api/products?category=rocks&sort=price_asc");
        assertEquals(200, response.statusCode());
        assertEquals(3, response.jsonPath().getList("items").size());
        assertEquals("Gerald", response.jsonPath().getString("items[0].name"));
        assertEquals("Boulderina", response.jsonPath().getString("items[2].name"));
    }

    @Test
    void returnsProductDetailsAndImageUrl() {
        Response response = get("/api/products/ROCK-GERALD");
        assertEquals(200, response.statusCode());
        assertEquals("001", response.jsonPath().getString("catalogueNumber"));
        assertEquals("Photo of Gerald", response.jsonPath().getString("imageAlt"));
        assertEquals("/api/images/ROCK-GERALD.webp", response.jsonPath().getString("imageUrl"));
        assertNotNull(response.jsonPath().getString("description"));
        assertEquals(180, response.jsonPath().getInt("attributes.weightGrams"));
    }

    @Test
    void rejectsUnknownProductAndCategory() {
        assertApiError(get("/api/products/UNKNOWN"), 404, "PRODUCT_NOT_FOUND");
        assertApiError(get("/api/products?category=unknown"), 400, "INVALID_CATEGORY");
    }
}
