package com.supermarket.backend.repository;

import com.supermarket.backend.model.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {

    @Query("select i.id from ProductImage i where i.product.id = :productId "
            + "order by i.sortOrder asc, i.id asc")
    List<Long> findIdsByProductId(@Param("productId") Long productId);

    @Query("select i.product.id as productId, i.id as id from ProductImage i "
            + "where i.product.id in :productIds "
            + "order by i.product.id asc, i.sortOrder asc, i.id asc")
    List<ProductImageIdView> findIdViewsByProductIds(@Param("productIds") Collection<Long> productIds);

    Optional<ProductImage> findFirstByProductIdOrderBySortOrderAscIdAsc(Long productId);

    Optional<ProductImage> findByIdAndProductId(Long id, Long productId);

    long countByProductId(Long productId);

    @Query("select coalesce(max(i.sortOrder), -1) from ProductImage i where i.product.id = :productId")
    int findMaxSortOrder(@Param("productId") Long productId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ProductImage i where i.id = :imageId and i.product.id = :productId")
    int deleteImage(@Param("imageId") Long imageId, @Param("productId") Long productId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from ProductImage i where i.product.id = :productId")
    int deleteAllByProductId(@Param("productId") Long productId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update ProductImage i set i.sortOrder = :sortOrder "
            + "where i.id = :imageId and i.product.id = :productId")
    int updateSortOrder(@Param("imageId") Long imageId,
                        @Param("productId") Long productId,
                        @Param("sortOrder") int sortOrder);
}