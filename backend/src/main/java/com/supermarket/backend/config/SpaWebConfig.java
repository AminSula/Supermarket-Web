package com.supermarket.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Because Angular does client-side routing (e.g. /products/5, /checkout),
 * a browser refresh on those URLs would otherwise hit Spring Boot and 404,
 * since no such server route exists. This forwards any non-API, non-file
 * request back to index.html so Angular's router can take over.
 *
 * Kept deliberately simple for now (a single catch-all forward). If this
 * needs to get smarter later (e.g. excluding more static asset patterns),
 * this is the place to extend.
 */
@Configuration
public class SpaWebConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/{path:[^\\.]*}").setViewName("forward:/index.html");
        registry.addViewController("/**/{path:[^\\.]*}").setViewName("forward:/index.html");
    }
}
