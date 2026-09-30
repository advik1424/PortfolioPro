package com.advik.PortfolioPro.user.mapper;

import com.advik.PortfolioPro.user.dto.UserRequestDto;
import com.advik.PortfolioPro.user.dto.UserResponseDto;
import com.advik.PortfolioPro.user.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {




    public UserResponseDto entitytoresponse(User user) {


        UserResponseDto response= new UserResponseDto();

        response.setId(user.getId());
        response.setName(user.getName());
        response.setEmail(user.getEmail());

        return response;


    }

    public User togetentity(UserRequestDto userRequestDto){


        User user=new User();

        user.setName(userRequestDto.getName());
        user.setEmail(userRequestDto.getEmail());
        user.setPassword(userRequestDto.getPassword());

        return user;

    }
}
