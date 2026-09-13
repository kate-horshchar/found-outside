package com.foundoutside;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class WebErrorController implements ErrorController {
    @RequestMapping("/error")
    public Object error(HttpServletRequest request) {
        Object statusAttribute = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        int status = statusAttribute instanceof Integer value ? value : 500;
        String path = (String) request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
        // Missing assets and API routes must never receive the SPA HTML.
        if (status == 404 && "GET".equals(request.getMethod()) && path != null
                && !path.equals("/api") && !path.startsWith("/api/")
                && !path.equals("/index.html") && !path.contains(".")
                && getClass().getResource("/static/index.html") != null) {
            ModelAndView fallback = new ModelAndView("forward:/index.html");
            fallback.setStatus(HttpStatus.OK);
            return fallback;
        }
        HttpStatus httpStatus = HttpStatus.resolve(status);
        String code = status >= 500 ? "INTERNAL_ERROR" : status == 404 ? "NOT_FOUND" : "HTTP_ERROR";
        String message = status >= 500 ? "Internal server error"
                : httpStatus == null ? "Request failed" : httpStatus.getReasonPhrase();
        return ResponseEntity.status(status).body(new ErrorResponse(new ErrorDetail(code, message)));
    }

    public record ErrorResponse(ErrorDetail error) {}
    public record ErrorDetail(String code, String message) {}
}
