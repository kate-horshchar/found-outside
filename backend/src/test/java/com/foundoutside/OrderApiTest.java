package com.foundoutside;

import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "logging.level.root=WARN")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class OrderApiTest extends ApiIntegrationTestBase {
    private static final String CUSTOMER = "\"customer\":{\"name\":\"  Ada Collector  \",\"email\":\"ada@example.test\"}";

    @Test
    void createsOrderWithTrimmedCustomerAndStableNumber() {
        Response response = post("/api/orders", "{" + CUSTOMER + ",\"items\":[{\"sku\":\"TINY-ACORN\",\"qty\":1}]}");
        assertEquals(201, response.statusCode());
        assertEquals(1001, response.jsonPath().getInt("number"));
        assertEquals("Ada Collector", response.jsonPath().getString("customerName"));
        assertEquals("ada@example.test", response.jsonPath().getString("email"));
        assertEquals(39, get("/api/products/TINY-ACORN").jsonPath().getInt("stock"));
    }

    @Test
    void returnsCreatedOrderByNumber() {
        Response created = post("/api/orders", "{" + CUSTOMER + ",\"items\":[{\"sku\":\"TINY-ACORN\",\"qty\":1}]}");
        Response fetched = get("/api/orders/" + created.jsonPath().getInt("number"));
        assertEquals(200, fetched.statusCode());
        assertEquals(created.jsonPath().getInt("totalCents"), fetched.jsonPath().getInt("totalCents"));
        assertEquals("TINY-ACORN", fetched.jsonPath().getString("lines[0].sku"));
    }

    @Test
    void rejectsInvalidEmailBeforeCreatingOrder() {
        Response response = post("/api/orders", "{\"customer\":{\"name\":\"Ada\",\"email\":\"not-an-email\"},\"items\":[{\"sku\":\"ROCK-GERALD\",\"qty\":1}]}");
        assertApiError(response, 400, "VALIDATION_FAILED");
        assertEquals("Email must contain one @ with text on both sides", response.jsonPath().getString("error.message"));
    }

    @Test
    void rejectsQuantityAboveStockWithoutPartialChanges() {
        Response response = post("/api/orders", "{" + CUSTOMER + ",\"items\":[{\"sku\":\"ROCK-GERALD\",\"qty\":2}]}");
        assertApiError(response, 409, "OUT_OF_STOCK");
        assertEquals("ROCK-GERALD: only 1 left", response.jsonPath().getString("error.message"));
        assertEquals(1, get("/api/products/ROCK-GERALD").jsonPath().getInt("stock"));
    }
}
