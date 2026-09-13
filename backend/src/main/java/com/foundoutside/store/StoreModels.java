package com.foundoutside.store;

import java.math.BigInteger;
import java.time.Instant;
import java.util.List;

public final class StoreModels {
    private StoreModels() {}

    public record Attributes(int weightGrams, int sizeCm, String color, String foundAt) {}
    public record Product(String sku, String catalogueNumber, String name, String category,
                          int priceCents, int stock, String tagline, String description,
                          String imageUrl, String imageAlt, Attributes attributes) {
        public Product withStock(int remaining) {
            return new Product(sku, catalogueNumber, name, category, priceCents, remaining,
                    tagline, description, imageUrl, imageAlt, attributes);
        }
    }
    public record Item(String sku, BigInteger qty) {}
    public record OrderLine(String sku, String name, int unitPriceCents, BigInteger qty,
                            BigInteger lineTotalCents) {}
    /** Quote line with the product's current stock, so the cart can warn before checkout. */
    public record QuoteLine(String sku, String name, int unitPriceCents, BigInteger qty, int stock,
                            BigInteger lineTotalCents) {
        public OrderLine toOrderLine() {
            return new OrderLine(sku, name, unitPriceCents, qty, lineTotalCents);
        }
    }
    public record Quote(List<QuoteLine> lines, BigInteger subtotalCents, BigInteger feeCents,
                        int taxRatePercent, BigInteger taxCents, BigInteger totalCents) {}
    public record Order(int number, String customerName, String email, List<OrderLine> lines,
                        BigInteger subtotalCents, BigInteger feeCents, int taxRatePercent,
                        BigInteger taxCents, BigInteger totalCents, Instant createdAt) {}
}
