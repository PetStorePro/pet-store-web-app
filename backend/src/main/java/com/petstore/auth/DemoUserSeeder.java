package com.petstore.auth;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "petstore.auth.demo-users-enabled", havingValue = "true")
public class DemoUserSeeder implements ApplicationRunner {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public DemoUserSeeder(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        createIfMissing("a", "Anna Employee", UserRole.EMPLOYEE);
        createIfMissing("aa", "Max Manager", UserRole.MANAGER);
        createIfMissing("aaa", "Dana DevOps", UserRole.DEVOPS);
    }

    private void createIfMissing(String username, String fullName, UserRole role) {
        if (!users.existsByUsername(username)) {
            users.save(new AppUser(username, passwordEncoder.encode("a"), fullName, role));
        }
    }
}