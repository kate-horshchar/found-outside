package com.foundoutside.store;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigInteger;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.foundoutside.store.StoreModels.*;

@Service
public class StoreService {
    private static final Set<String> CATEGORIES = Set.of("rocks", "sticks", "tiny-things", "bulk");
    private final Map<String, Product> products = new LinkedHashMap<>();
    private final Map<Integer, Order> orders = new LinkedHashMap<>();
    private final TaxConfiguration taxConfiguration;
    private int nextOrderNumber = 1001;

    public StoreService(ObjectMapper mapper, TaxConfiguration taxConfiguration) throws IOException {
        this.taxConfiguration = taxConfiguration;
        try (var input = new ClassPathResource("data/products.json").getInputStream()) {
            List<Product> seed = mapper.readValue(input, new TypeReference<>() {});
            for (Product product : seed) {
                if (products.put(product.sku(), product) != null) throw new IOException("Duplicate seed SKU");
            }
            if (products.size() != 12) throw new IOException("Expected twelve seed products");
        }
    }

    public List<Product> list(String category, String sort) {
        if (category != null && !CATEGORIES.contains(category))
            throw new ApiException(400, "INVALID_CATEGORY", "Unknown category: " + category);
        Comparator<Product> comparator = switch (sort == null ? "name" : sort) {
            case "name" -> Comparator.comparing(Product::name, String.CASE_INSENSITIVE_ORDER);
            case "price_asc" -> Comparator.comparingInt(Product::priceCents);
            case "price_desc" -> Comparator.comparingInt(Product::priceCents).reversed();
            default -> throw new ApiException(400, "INVALID_SORT", "Unknown sort: " + sort);
        };
        return products.values().stream()
                .filter(product -> category == null || category.equals(product.category()))
                .sorted(comparator.thenComparing(Product::sku)).toList();
    }

    public Product product(String sku) {
        Product product = products.get(sku);
        if (product == null) throw new ApiException(404, "PRODUCT_NOT_FOUND", "Product not found: " + sku);
        return product;
    }

    private List<Item> validateItems(JsonNode body) {
        JsonNode items = body == null ? null : body.get("items");
        if (items == null || !items.isArray() || items.isEmpty())
            throw invalid("Items must be a non-empty array");
        Set<String> seen = new HashSet<>();
        List<Item> result = new ArrayList<>();
        for (JsonNode item : items) {
            JsonNode sku = item.get("sku");
            JsonNode qty = item.get("qty");
            if (sku == null || !sku.isTextual() || !products.containsKey(sku.textValue()))
                throw invalid("Each item must reference an existing SKU");
            if (qty == null || !qty.isIntegralNumber() || qty.bigIntegerValue().signum() < 1)
                throw invalid("Quantity must be an integer greater than or equal to 1");
            if (!seen.add(sku.textValue())) throw invalid("Duplicate SKU: " + sku.textValue());
            result.add(new Item(sku.textValue(), qty.bigIntegerValue()));
        }
        return result;
    }

    public Quote quote(JsonNode body) {
        return price(validateItems(body));
    }

    private Quote price(List<Item> items) {
        int rate = taxConfiguration.requiredRate();
        List<OrderLine> lines = new ArrayList<>();
        BigInteger subtotal = BigInteger.ZERO;
        BigInteger fee = BigInteger.ZERO;
        for (Item item : items) {
            Product product = products.get(item.sku());
            BigInteger lineTotal = BigInteger.valueOf(product.priceCents()).multiply(item.qty());
            lines.add(new OrderLine(product.sku(), product.name(), product.priceCents(), item.qty(), lineTotal));
            subtotal = subtotal.add(lineTotal);
            if (product.attributes().weightGrams() >= 2000)
                fee = fee.add(BigInteger.valueOf(500).multiply(item.qty()));
        }
        // Nonnegative integer cents: adding 50 before dividing by 100 is exact half-up rounding.
        BigInteger tax = subtotal.add(fee).multiply(BigInteger.valueOf(rate))
                .add(BigInteger.valueOf(50)).divide(BigInteger.valueOf(100));
        return new Quote(List.copyOf(lines), subtotal, fee, rate, tax, subtotal.add(fee).add(tax));
    }

    public Order createOrder(JsonNode body) {
        List<Item> items = validateItems(body);
        JsonNode customer = body.get("customer");
        if (customer == null || !customer.isObject()) throw invalid("Customer name and email are required");
        JsonNode nameNode = customer.get("name");
        if (nameNode == null || !nameNode.isTextual()) throw invalid("Name must contain 1 to 100 characters");
        String name = nameNode.textValue().strip();
        if (name.isEmpty() || name.codePointCount(0, name.length()) > 100)
            throw invalid("Name must contain 1 to 100 characters");
        JsonNode emailNode = customer.get("email");
        if (emailNode == null || !emailNode.isTextual()) throw invalid("Email must contain one @ with text on both sides");
        String email = emailNode.textValue();
        int at = email.indexOf('@');
        if (at <= 0 || at != email.lastIndexOf('@') || at == email.length() - 1)
            throw invalid("Email must contain one @ with text on both sides");

        Quote quote = price(items); // Configuration is checked before stock.
        for (Item item : items) {
            Product product = products.get(item.sku());
            if (item.qty().compareTo(BigInteger.valueOf(product.stock())) > 0)
                throw new ApiException(409, "OUT_OF_STOCK", product.sku() + ": only " + product.stock() + " left");
        }
        Order order = new Order(nextOrderNumber++, name, email, quote.lines(), quote.subtotalCents(),
                quote.feeCents(), quote.taxRatePercent(), quote.taxCents(), quote.totalCents(), Instant.now());
        for (Item item : items) {
            Product product = products.get(item.sku());
            products.put(item.sku(), product.withStock(product.stock() - item.qty().intValueExact()));
        }
        orders.put(order.number(), order);
        return order;
    }

    public Order order(String number) {
        Order order = null;
        if (number.matches("[0-9]+")) {
            try { order = orders.get(Integer.parseInt(number)); }
            catch (NumberFormatException ignored) { /* Unknown number. */ }
        }
        if (order == null) throw new ApiException(404, "ORDER_NOT_FOUND", "Order not found: " + number);
        return order;
    }

    private ApiException invalid(String message) {
        return new ApiException(400, "VALIDATION_FAILED", message);
    }
}
