package com.foundoutside;

import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "logging.level.root=WARN")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class QuoteApiTest extends ApiIntegrationTestBase {
    @Test
    void calculatesReferenceCartTotals() {
        Response response = post("/api/quote", "{\"items\":[{\"sku\":\"ROCK-BOULDERINA\",\"qty\":1},{\"sku\":\"ROCK-GERALD\",\"qty\":1}]}");
        assertEquals(200, response.statusCode());
        assertEquals(14400, response.jsonPath().getInt("subtotalCents"));
        assertEquals(500, response.jsonPath().getInt("feeCents"));
        assertEquals(20, response.jsonPath().getInt("taxRatePercent"));
        assertEquals(2980, response.jsonPath().getInt("taxCents"));
        assertEquals(17880, response.jsonPath().getInt("totalCents"));
    }

    @Test
    void appliesHeavyFeeAtBoundaryAndPerUnit() {
        Response boundary = post("/api/quote", "{\"items\":[{\"sku\":\"ROCK-BOULDERINA\",\"qty\":1}]}");
        Response units = post("/api/quote", "{\"items\":[{\"sku\":\"STICK-LOG\",\"qty\":2}]}");
        assertEquals(500, boundary.jsonPath().getInt("feeCents"));
        assertEquals(1000, units.jsonPath().getInt("feeCents"));
    }

    @Test
    void reportsCurrentStockWithoutRejectingQuantity() {
        Response response = post("/api/quote", "{\"items\":[{\"sku\":\"ROCK-BOULDERINA\",\"qty\":3}]}");
        assertEquals(200, response.statusCode());
        assertEquals(3, response.jsonPath().getInt("lines[0].qty"));
        assertEquals(1, response.jsonPath().getInt("lines[0].stock"));
    }

    @Test
    void rejectsInvalidItemsWithStableError() {
        assertApiError(post("/api/quote", "{\"items\":[]}"), 400, "VALIDATION_FAILED");
        Response response = post("/api/quote", "{\"items\":[{\"sku\":\"ROCK-GERALD\",\"qty\":0}]}");
        assertApiError(response, 400, "VALIDATION_FAILED");
        assertEquals("Quantity must be an integer greater than or equal to 1", response.jsonPath().getString("error.message"));
    }
}
