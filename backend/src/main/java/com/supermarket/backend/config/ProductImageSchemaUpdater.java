package com.supermarket.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ProductImageSchemaUpdater implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ProductImageSchemaUpdater.class);

    private static final String DROP_SINGLE_IMAGE_UNIQUENESS = """
            DO $$
            DECLARE r record;
            BEGIN
              -- unique CONSTRAINTS on exactly (product_id)
              FOR r IN
                SELECT con.conname AS name
                FROM pg_constraint con
                JOIN pg_class rel ON rel.oid = con.conrelid
                WHERE rel.relname = 'product_images'
                  AND rel.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema())
                  AND con.contype = 'u'
                  AND array_length(con.conkey, 1) = 1
                  AND (SELECT att.attname FROM pg_attribute att
                       WHERE att.attrelid = con.conrelid AND att.attnum = con.conkey[1]) = 'product_id'
              LOOP
                EXECUTE format('ALTER TABLE product_images DROP CONSTRAINT %I', r.name);
              END LOOP;

              -- stand-alone unique INDEXES on exactly (product_id)
              FOR r IN
                SELECT idx.relname AS name
                FROM pg_index i
                JOIN pg_class idx ON idx.oid = i.indexrelid
                JOIN pg_class tbl ON tbl.oid = i.indrelid
                JOIN pg_attribute a ON a.attrelid = tbl.oid AND a.attnum = i.indkey[0]
                WHERE tbl.relname = 'product_images'
                  AND tbl.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema())
                  AND i.indisunique AND NOT i.indisprimary
                  AND i.indnatts = 1
                  AND a.attname = 'product_id'
                  AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conindid = i.indexrelid)
              LOOP
                EXECUTE format('DROP INDEX %I', r.name);
              END LOOP;
            END $$;
            """;

    private final JdbcTemplate jdbcTemplate;

    public ProductImageSchemaUpdater(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute(DROP_SINGLE_IMAGE_UNIQUENESS);
            log.info("product_images schema check done (one-image-per-product uniqueness removed if present)");
        } catch (Exception e) {
            log.warn("Could not verify the product_images schema: {}", e.getMessage());
        }
    }
}