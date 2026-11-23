package com.petstore.alerts;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/alerts")
@Tag(name = "Alerts", description = "Low stock, negative stock, and medicine expiry conditions.")
@SecurityRequirement(name = "bearerAuth")
public class AlertController {

    private final AlertService alerts;

    public AlertController(AlertService alerts) {
        this.alerts = alerts;
    }

    @GetMapping
    @Operation(summary = "List alerts", description = "Optionally filter by alert type and resolution state.")
    public List<AlertResponse> list(
            @RequestParam(required = false) AlertType type,
            @RequestParam(required = false) Boolean resolved) {
        return alerts.list(type, resolved);
    }

    @PatchMapping("/{id}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Resolve an alert", description = "Marks an alert resolved and records the action in audit history.")
    public void resolve(@PathVariable UUID id, @AuthenticationPrincipal Jwt jwt) {
        alerts.resolve(id, UUID.fromString(jwt.getSubject()));
    }
}
