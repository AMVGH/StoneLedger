package com.stoneledger.server.services;

import com.stoneledger.server.api.enums.UserRole;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.UserRepository;
import com.stoneledger.server.utils.EncryptionUtil;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.apache.catalina.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.security.GeneralSecurityException;
import java.util.List;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EncryptionUtil encryptionUtil;
    @Value("${spring.mail.username}")
    private String fromEmail;

    private String loginUrl = "http://localhost:3000/login";

    public void sendAdminApprovalRequest(UserModel user) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        List<UserModel> admins = userRepository.findEmailByUserRole(UserRole.ADMINISTRATOR);
        helper.setFrom(fromEmail);
        helper.setTo(admins.stream()
            .filter(admin -> admin.isActive() && !admin.isSuspended())
            .map(UserModel::getEmail)
            .toArray(String[]::new));

        helper.setSubject("StoneLedger: New Registration Request Awaits Review (Username: "+user.getUsername()+")");
        helper.setText(buildAdminEmailBody(user), true);
        mailSender.send(message);
    }

    public void sendApprovalNotification(UserModel user) throws MessagingException, GeneralSecurityException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(user.getEmail());
        helper.setSubject("Your StoneLedger Registration Has Been Approved!");
        helper.setText(buildApprovalEmailBody(user), true);

        mailSender.send(message);
    }

    public void sendRejectionNotification(UserModel user) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(user.getEmail());
        helper.setSubject("Your StoneLedger Registration Has Been Rejected.");
        helper.setText(buildRejectionEmailBody(user), true);

        mailSender.send(message);
    }

    public void sendPasswordExpirationNotification(UserModel user) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(user.getEmail());
        helper.setSubject("Your StoneLedger Password Is About To Expire.");
        helper.setText(buildPassExpirationNotificationBody(user), true);

        mailSender.send(message);
    }

    public void sendPasswordExpiredNotification(UserModel user) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(user.getEmail());
        helper.setSubject("Your StoneLedger Password Has Expired.");
        helper.setText(buildPassExpirationEmailBody(user), true);

        mailSender.send(message);
    }

    public void sendPasswordAdminUpdateNotification(UserModel user) throws MessagingException, GeneralSecurityException{
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(user.getEmail());
        helper.setSubject("An Administrator Has Restored Your StoneLedger Access.");
        helper.setText(buildPassAdminUpdateEmailBody(user), true);

        mailSender.send(message);
    }

    public void sendEmailToUser(UserModel user, String messageContent) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(fromEmail);
        helper.setTo(user.getEmail());
        helper.setSubject("An Administrator Has Sent You A Message.");
        helper.setText(buildIssueEmailToUserBody(user, messageContent), true);

        mailSender.send(message);
    }

    // TODO: Redirect to application and have the approval facilitated within the application. Can still be tested using the endpoint itself.
    private String buildAdminEmailBody(UserModel user) {
        return "<h3>New Registration Request</h3>" +
            "<p><b>Name:</b> " + user.getFirstName() + " " + user.getLastName() + "</p>" +
            "<p><b>Username:</b> " + user.getUsername() + "</p>" +
            "<p><b>Email:</b> " + user.getEmail() + "</p>" +
            "<p><b>Requested Role:</b> " + user.getUserRole() + "</p>" +
            "<p><b>Registered Address:</b> " + user.getUserAddress() + "</p>" +
            "<p><b>Date of Birth:</b> " + user.getDateOfBirth() + "</p>" +
            "<br>" +
            "<a href='" + loginUrl + "' style='padding:10px 20px; background:blue; color:white; text-decoration:none;'> Login to StoneLedger </a>";
    }

    private String buildApprovalEmailBody(UserModel user) throws GeneralSecurityException {
        // We provide the user's pass in the approval email since it is the valid email associated with the account and created users are issued the pass by admin.
        String userPassword = encryptionUtil.decrypt(user.getPassword());
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;'>" +
            "<h2>Welcome to StoneLedger, " + user.getFirstName() + "!</h2>" +
            "<p>Congratulations! Your registration request has been approved. You can now access the StoneLedger platform.</p>" +
            "<p>Your login credentials:</p>" +
            "<ul>" +
            "<li><strong>Username:</strong> <strong>" + user.getUsername() + "</strong></li>" +
            "<li><strong>Password:</strong> <strong>" + userPassword + "</strong></li>" +
            "</ul>" +
            "<p>Click the button below to log in:</p>" +
            "<a href='" + loginUrl + "' style='display:inline-block; padding:10px 20px; background-color:#1a73e8; color:white; text-decoration:none; border-radius:4px;'>Login to StoneLedger</a>" +
            "<p style='margin-top:20px; font-size:12px; color:#888;'>If you did not expect this email, please contact support.</p>" +
            "</div>";
    }

    private String buildRejectionEmailBody(UserModel user) {
        return "<h3>Hello, " + user.getFirstName() + "</h3>" +
            "<p>We regret to inform you that your registration request for StoneLedger has been rejected.</p>";
    }

    private String buildPassExpirationNotificationBody(UserModel user) {
        return "<h3>Hello, " + user.getFirstName() + "</h3>" +
            "<p>Your password is due to expire in three days. Please login to StoneLedger to update your password.</p>";
    }

    private String buildPassExpirationEmailBody(UserModel user) {
        return "<h3>Hello, " + user.getFirstName() + "</h3>" +
            "<p>Your password has expired and access to the StoneLedger platform has been revoked. Please contact a system administrator for assistance.</p>";
    }

    private String buildPassAdminUpdateEmailBody(UserModel user) throws GeneralSecurityException{
        // Decrypted Password since this pass was set by an administrator.
        String userPassword = encryptionUtil.decrypt(user.getPassword());
        return "<h3>Hello, " + user.getFirstName() + "</h3>" +
            "<p>Your New StoneLedger Password: " + userPassword + "</p>";
    }

    private String buildIssueEmailToUserBody(UserModel user, String messageContent) {
        return "<h3>Hello, " + user.getFirstName() + "</h3>" +
            "<p>An Administrator Has Sent You A Message: " + messageContent + "</p>";
    }
}
