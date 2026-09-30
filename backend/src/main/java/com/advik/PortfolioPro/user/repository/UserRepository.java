package com.advik.PortfolioPro.user.repository;

import com.advik.PortfolioPro.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User,Long> {


    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);


}
