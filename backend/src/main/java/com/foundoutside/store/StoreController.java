package com.foundoutside.store;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

import static com.foundoutside.store.StoreModels.*;

@RestController
@RequestMapping("/api")
public class StoreController {
    private final StoreService store;

    public StoreController(StoreService store) { this.store = store; }

    @GetMapping("/products")
    public Map<String, List<Product>> products(@RequestParam(required = false) String category,
                                               @RequestParam(required = false) String sort) {
        return Map.of("items", store.list(category, sort));
    }

    @GetMapping("/products/{sku}")
    public Product product(@PathVariable String sku) { return store.product(sku); }

    @GetMapping("/images/{sku}.webp")
    public ResponseEntity<Resource> image(@PathVariable String sku) {
        store.product(sku); // Validate against known SKUs before resolving a path.
        return ResponseEntity.ok().contentType(MediaType.parseMediaType("image/webp"))
                .body(new ClassPathResource("images/" + sku + ".webp"));
    }

    @PostMapping("/quote")
    public Quote quote(@RequestBody JsonNode body) { return store.quote(body); }

    @PostMapping("/orders")
    public ResponseEntity<Order> createOrder(@RequestBody JsonNode body) {
        Order order = store.createOrder(body);
        return ResponseEntity.created(URI.create("/api/orders/" + order.number())).body(order);
    }

    @GetMapping("/orders/{number}")
    public Order order(@PathVariable String number) { return store.order(number); }
}
