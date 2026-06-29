package com.fullStack.expenseTracker.services.impls;

import com.fullStack.expenseTracker.dto.reponses.ApiResponseDto;
import com.fullStack.expenseTracker.dto.requests.ResetPasswordRequestDto;
import com.fullStack.expenseTracker.dto.requests.SignUpRequestDto;
import com.fullStack.expenseTracker.enums.ApiResponseStatus;
import com.fullStack.expenseTracker.exceptions.*;
import com.fullStack.expenseTracker.factories.RoleFactory;
import com.fullStack.expenseTracker.models.Role;
import com.fullStack.expenseTracker.models.User;
import com.fullStack.expenseTracker.repository.UserRepository;
import com.fullStack.expenseTracker.services.AuthService;
import com.fullStack.expenseTracker.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Date;
import java.util.HashSet;
import java.util.Random;
import java.util.Set;

@Component
@Slf4j
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleFactory roleFactory;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public ResponseEntity<ApiResponseDto<?>> save(SignUpRequestDto signUpRequestDto)
            throws UserAlreadyExistsException, UserServiceLogicException {

        if (userService.existsByUsername(signUpRequestDto.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken!");
        }

        if (userService.existsByEmail(signUpRequestDto.getEmail())) {
            throw new UserAlreadyExistsException("Email already taken!");
        }

        try {
            User user = createUser(signUpRequestDto);
            User savedUser = userRepository.save(user);

            sendVerificationEmail(savedUser.getEmail(), savedUser.getVerificationCode());

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    new ApiResponseDto<>(
                            ApiResponseStatus.SUCCESS,
                            HttpStatus.CREATED,
                            "User registered successfully! Verification code sent to email."
                    )
            );

        } catch (Exception e) {
            log.error("Registration failed: {}", e.getMessage());
            throw new UserServiceLogicException("Something went wrong!");
        }
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> verifyRegistrationVerification(String code) {
        try {
            User user = userRepository.findByVerificationCode(code);

            if (user == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        new ApiResponseDto<>(
                                ApiResponseStatus.FAILED,
                                HttpStatus.BAD_REQUEST,
                                "Invalid verification code!"
                        )
                );
            }

            if (user.getVerificationCodeExpiryTime() != null &&
                    user.getVerificationCodeExpiryTime().before(new Date())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                        new ApiResponseDto<>(
                                ApiResponseStatus.FAILED,
                                HttpStatus.BAD_REQUEST,
                                "Verification code expired!"
                        )
                );
            }

            user.setEnabled(true);

            // Code will stay in database as you wanted
            userRepository.save(user);

            return ResponseEntity.status(HttpStatus.OK).body(
                    new ApiResponseDto<>(
                            ApiResponseStatus.SUCCESS,
                            HttpStatus.OK,
                            "Account verified successfully!"
                    )
            );

        } catch (Exception e) {
            log.error("Verification failed: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ApiResponseDto<>(
                            ApiResponseStatus.FAILED,
                            HttpStatus.BAD_REQUEST,
                            "Verification failed!"
                    )
            );
        }
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> resendVerificationCode(String email) {
        try {
            User user = userService.findByEmail(email);

            String code = generateVerificationCode();

            user.setVerificationCode(code);
            user.setVerificationCodeExpiryTime(new Date(System.currentTimeMillis() + 15 * 60 * 1000));
            user.setEnabled(false);

            User savedUser = userRepository.save(user);

            sendVerificationEmail(savedUser.getEmail(), savedUser.getVerificationCode());

            return ResponseEntity.status(HttpStatus.OK).body(
                    new ApiResponseDto<>(
                            ApiResponseStatus.SUCCESS,
                            HttpStatus.OK,
                            "Verification code resent successfully!"
                    )
            );

        } catch (Exception e) {
            log.error("Resend verification failed: {}", e.getMessage());

            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                    new ApiResponseDto<>(
                            ApiResponseStatus.FAILED,
                            HttpStatus.BAD_REQUEST,
                            "Unable to resend verification code!"
                    )
            );
        }
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> verifyEmailAndSendForgotPasswordVerificationEmail(String email) {
        return ResponseEntity.status(HttpStatus.OK).body(
                new ApiResponseDto<>(
                        ApiResponseStatus.SUCCESS,
                        HttpStatus.OK,
                        "Email verified!"
                )
        );
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> verifyForgotPasswordVerification(String code) {
        return ResponseEntity.status(HttpStatus.OK).body(
                new ApiResponseDto<>(
                        ApiResponseStatus.SUCCESS,
                        HttpStatus.OK,
                        "Verification successful!"
                )
        );
    }

    @Override
    public ResponseEntity<ApiResponseDto<?>> resetPassword(ResetPasswordRequestDto resetPasswordDto)
            throws UserNotFoundException, UserServiceLogicException {

        if (userService.existsByEmail(resetPasswordDto.getEmail())) {
            try {
                User user = userService.findByEmail(resetPasswordDto.getEmail());

                if (!resetPasswordDto.getCurrentPassword().isEmpty()) {
                    if (!passwordEncoder.matches(resetPasswordDto.getCurrentPassword(), user.getPassword())) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                new ApiResponseDto<>(
                                        ApiResponseStatus.FAILED,
                                        HttpStatus.BAD_REQUEST,
                                        "Current password is incorrect!"
                                )
                        );
                    }
                }

                user.setPassword(passwordEncoder.encode(resetPasswordDto.getNewPassword()));
                userRepository.save(user);

                return ResponseEntity.status(HttpStatus.CREATED).body(
                        new ApiResponseDto<>(
                                ApiResponseStatus.SUCCESS,
                                HttpStatus.CREATED,
                                "Password reset successful!"
                        )
                );

            } catch (Exception e) {
                log.error("Reset password failed: {}", e.getMessage());
                throw new UserServiceLogicException("Try again later!");
            }
        }

        throw new UserNotFoundException("User not found!");
    }

    private User createUser(SignUpRequestDto signUpRequestDto) throws RoleNotFoundException {
        String code = generateVerificationCode();

        User user = new User();

        user.setUsername(signUpRequestDto.getUsername());
        user.setEmail(signUpRequestDto.getEmail());
        user.setPassword(passwordEncoder.encode(signUpRequestDto.getPassword()));
        user.setVerificationCode(code);
        user.setVerificationCodeExpiryTime(new Date(System.currentTimeMillis() + 15 * 60 * 1000));
        user.setEnabled(false);
        user.setRoles(determineRoles(signUpRequestDto.getRoles()));

        return user;
    }

    private String generateVerificationCode() {
        return String.valueOf(100000 + new Random().nextInt(900000));
    }

    private void sendVerificationEmail(String toEmail, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("MyWallet Email Verification Code");
        message.setText("Your verification code is: " + code);
        mailSender.send(message);
    }

    private Set<Role> determineRoles(Set<String> strRoles) throws RoleNotFoundException {
        Set<Role> roles = new HashSet<>();

        if (strRoles == null) {
            roles.add(roleFactory.getInstance("user"));
        } else {
            for (String role : strRoles) {
                roles.add(roleFactory.getInstance(role));
            }
        }

        return roles;
    }
}