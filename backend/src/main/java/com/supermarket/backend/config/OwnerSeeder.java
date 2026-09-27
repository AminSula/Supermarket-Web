package com.supermarket.backend.config;

import com.supermarket.backend.model.Role;
import com.supermarket.backend.model.User;
import com.supermarket.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * There's no registration endpoint — the owner is the only account, and
 * it's seeded here on first run rather than created through the API.
 * Change app.owner.username / app.owner.password in application.yml
 * before this first runs in anything beyond local dev.
 */
@Component
public class OwnerSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(OwnerSeeder.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String seedUsername;
    private final String seedPassword;

    public OwnerSeeder(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.owner.username}") String seedUsername,
            @Value("${app.owner.password}") String seedPassword
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.seedUsername = seedUsername;
        this.seedPassword = seedPassword;
    }

    @Override
    public void run(String... args) {
        if (userRepository.findByUsername(seedUsername).isPresent()) {
            return; // already seeded, nothing to do
        }

        User owner = new User();
        owner.setUsername(seedUsername);
        owner.setPasswordHash(passwordEncoder.encode(seedPassword));
        owner.setRole(Role.OWNER);
        userRepository.save(owner);

        log.warn("Seeded default owner account (username: '{}'). " +
                "Change app.owner.username/password before deploying anywhere beyond local dev.", seedUsername);
    }
}