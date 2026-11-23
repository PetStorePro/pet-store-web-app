package com.petstore.dashboard;

import java.util.UUID;

public interface TopProductProjection {
    UUID getProductId();
    String getProductName();
    Long getUnitsSold();
}
