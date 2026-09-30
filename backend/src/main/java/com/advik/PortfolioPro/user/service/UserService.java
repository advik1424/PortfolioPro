package com.advik.PortfolioPro.user.service;

import com.advik.PortfolioPro.account.service.AccountService;
import com.advik.PortfolioPro.globalexception.DuplicateEmailException;
import com.advik.PortfolioPro.user.dto.UserRequestDto;
import com.advik.PortfolioPro.user.dto.UserResponseDto;
import com.advik.PortfolioPro.user.entity.User;
import com.advik.PortfolioPro.user.mapper.UserMapper;
import com.advik.PortfolioPro.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private PasswordEncoder passwordEncoder;

    private UserRepository userRepository;

    private UserMapper userMapper;

    private AccountService accountService;

    public UserService(
            PasswordEncoder passwordEncoder,
            UserRepository userRepository,
            UserMapper userMapper,
            AccountService accountService) {

        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.userRepository = userRepository;
        this.accountService = accountService;
    }

    @Transactional
    public UserResponseDto createUser(UserRequestDto userRequestDto) {

        if (userRepository.existsByEmail(userRequestDto.getEmail())) {

            throw new DuplicateEmailException(
                    "This email is already exist"
            );
        }

        User user = userMapper.togetentity(userRequestDto);

        user.setPassword(
                passwordEncoder.encode(user.getPassword())
        );

        User saveuser = userRepository.save(user);

        // Create ₹1,00,000 virtual account
        accountService.createAccount(saveuser);

        return userMapper.entitytoresponse(saveuser);
    }
}