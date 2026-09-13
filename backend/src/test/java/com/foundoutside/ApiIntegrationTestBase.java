package com.foundoutside;

import io.restassured.response.Response;
import org.springframework.boot.test.web.server.LocalServerPort;

import static io.restassured.RestAssured.given;

abstract class ApiIntegrationTestBase {
    @LocalServerPort
    protected int port;

    protected Response get(String path) {
        return given().port(port).get(path);
    }

    protected Response post(String path, String body) {
        return given().port(port).contentType("application/json").body(body).post(path);
    }

    protected void assertApiError(Response response, int status, String code) {
        org.junit.jupiter.api.Assertions.assertEquals(status, response.statusCode());
        org.junit.jupiter.api.Assertions.assertEquals(code, response.jsonPath().getString("error.code"));
    }
}
