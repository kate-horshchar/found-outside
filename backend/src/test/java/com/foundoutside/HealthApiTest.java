package com.foundoutside;

import io.restassured.response.Response;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.annotation.DirtiesContext;

import static io.restassured.RestAssured.given;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "logging.level.root=WARN")
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_EACH_TEST_METHOD)
class HealthApiTest {
    @LocalServerPort
    private int port;

    @Test
    void returnsOk() {
        Response response = given().port(port).get("/api/health");
        if (response.statusCode() != 200) {
            throw new UnexpectedApiResponseError("API returned " + response.statusCode()
                    + " " + response.jsonPath().getString("error.code")
                    + ": " + response.jsonPath().getString("error.message"));
        }
        assertEquals("ok", response.jsonPath().getString("status"));
    }
}
