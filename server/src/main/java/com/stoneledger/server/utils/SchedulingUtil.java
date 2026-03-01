package com.stoneledger.server.utils;

import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class SchedulingUtil {
    @Autowired
    private UserRepository userRepository;

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
    public void passwordNotificationPolling() {}
}
