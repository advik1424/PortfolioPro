package com.advik.PortfolioPro.account.repository;

import com.advik.PortfolioPro.account.entity.Account;
import com.advik.PortfolioPro.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account,Long> {


    Optional<Account> findByUser(User user);

    Optional<Account> findByUserId(Long userId);
}
