package com.foundoutside.store;

import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public class TaxConfiguration {
    public static final String MISSING_MESSAGE = "Required setting TAX_RATE_PERCENT is missing or invalid";
    private final Integer rate;

    public TaxConfiguration(Environment environment) {
        String raw = environment.getProperty("TAX_RATE_PERCENT");
        Integer parsed = null;
        if (raw != null && raw.matches("[0-9]+")) {
            try {
                int value = Integer.parseInt(raw);
                if (value <= 100) parsed = value;
            } catch (NumberFormatException ignored) {
                // Invalid settings must not prevent application startup.
            }
        }
        rate = parsed;
        if (rate == null) LoggerFactory.getLogger(TaxConfiguration.class).warn(MISSING_MESSAGE);
    }

    public int requiredRate() {
        if (rate == null) throw new ApiException(500, "CONFIG_MISSING", MISSING_MESSAGE);
        return rate;
    }
}
