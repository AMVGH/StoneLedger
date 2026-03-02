package com.stoneledger.server.utils;

import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.PasswordRepository;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.services.EmailService;
import jakarta.mail.MessagingException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SchedulingUtil {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordRepository passwordRepository;
    @Autowired
    private EmailService emailService;

    /**
     * This is a polling service which checks for suspension and activity end times each hour.
     * If the LocalDateTime end date for either value is before the current LocalDateTime recorded on the
     * server, the value is flipped either revoking access or restoring access to the system.
     * */
    @Scheduled(cron = "0 0 * * * *")
    public void activityAndSuspensionPolling() {
        LocalDateTime currentDateTime = LocalDateTime.now();

        // For all users whose suspension has expired, revokes their suspension and nulls their suspend start and end dates
        List<UserModel> usersToRevokeSuspension = userRepository.findBySuspendEndDateBeforeAndSuspendedTrue(currentDateTime);
        for (UserModel user : usersToRevokeSuspension) {
            user.setSuspended(false);
            user.setSuspendStartDate(null);
            user.setSuspendEndDate(null);
        }
        userRepository.saveAll(usersToRevokeSuspension);

        // For all users whose activity period has ended, flips their activity status and sets their new start date as the time recorded on the server
        List<UserModel> usersToInvertActivity = userRepository.findByActivityEndDateBefore(currentDateTime);
        for (UserModel user : usersToInvertActivity) {
            user.setActive(!user.isActive());
            user.setActivityStartDate(currentDateTime);
            user.setActivityEndDate(null);
        }
        userRepository.saveAll(usersToInvertActivity);
    }

    /**
     * This is a polling service which checks for password expiration end times each day.
     * If the LocalDateTime end date for the password is three days before the current LocalDateTime recorded on the
     * server, an email is issued to the user that their password is about to expire.
     * */
    @Scheduled(cron = "0 0 * * * *")
    public void passwordNotificationPolling()  throws MessagingException {
        LocalDateTime currentDateTime = LocalDateTime.now();

        // Three Day Window - If we only do within the next three days it will fire every day at midnight issuing the notification.
        List<UserModel> usersAboutToExpire = userRepository.findByPasswordExpirationDateBetween(
            currentDateTime.plusDays(3),
            currentDateTime.plusDays(3).withHour(23).withMinute(59).withSecond(59)
        );

        // Issues emails for users whose password are about to expire
        for (UserModel user: usersAboutToExpire) {
            emailService.sendPasswordExpirationNotification(user);
        }
    }

    /**
     * This is a polling service which checks for password expiration end times each day.
     * If the LocalDateTime end date for the password is after the current LocalDateTime recorded on the
     * server, the user is set to inactive and an email is issued notifying the user that they must contact administration.
     * */
    @Scheduled(cron = "0 0 0 * * *")
    public void passwordExpirationPolling() throws MessagingException {
        LocalDateTime currentDateTime = LocalDateTime.now();

        // Finds all active users whose passwords have expired
        List<UserModel> expiredPasswordUsers = userRepository.findByPasswordExpirationDateBeforeAndActiveTrue(currentDateTime);

        // Iterates over the users and sets their activity status to false; issues a notification via email
        for (UserModel user : expiredPasswordUsers) {
            user.setActive(false);
            emailService.sendPasswordExpiredNotification(user);
        }
        userRepository.saveAll(expiredPasswordUsers);
    }
}
