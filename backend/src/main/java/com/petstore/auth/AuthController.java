package com.petstore.auth;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Issue JWT bearer tokens for the demo employee, manager, and DevOps accounts.")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final AppUserRepository users;
    private final JwtEncoder jwtEncoder;
    private final long expirationSeconds;

    public AuthController(
            AuthenticationManager authenticationManager,
            AppUserRepository users,
            JwtEncoder jwtEncoder,
            @Value("${petstore.auth.jwt.expiration-seconds}") long expirationSeconds) {
        this.authenticationManager = authenticationManager;
        this.users = users;
        this.jwtEncoder = jwtEncoder;
        this.expirationSeconds = expirationSeconds;
    }

    @PostMapping("/login")
    @Operation(summary = "Sign in", description = "Exchange username and password for a JWT. This endpoint does not require authentication.")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        AppUser user = users.findByUsername(request.username())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid username or password"));

        Instant now = Instant.now();
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer("petstore")
                .issuedAt(now)
                .expiresAt(now.plusSeconds(expirationSeconds))
                .subject(user.getId().toString())
                .claim("username", user.getUsername())
                .claim("fullName", user.getFullName())
                .claim("role", user.getRole().name())
                .build();

        JwsHeader header = JwsHeader.with(MacAlgorithm.HS256).build();
        String token = jwtEncoder.encode(JwtEncoderParameters.from(header, claims)).getTokenValue();

        UserResponse userResponse = new UserResponse(
                user.getId().toString(),
                user.getUsername(),
                user.getFullName(),
                user.getRole());

        return new AuthResponse(token, userResponse);
    }

    public record LoginRequest(
            @NotBlank @Size(max = 50) String username,
            @NotBlank String password) {
    }

    public record UserResponse(String id, String username, String fullName, UserRole role) {
    }

    public record AuthResponse(String token, UserResponse user) {
    }
}