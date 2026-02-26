package com.stoneledger.server.services;

import com.stoneledger.server.api.enums.UserRole;
import com.stoneledger.server.api.models.UserModel;
import com.stoneledger.server.api.repositories.UserRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class EmailService {
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private UserRepository userRepository;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private String loginUrl = "http://localhost:3000/login";

    public void sendAdminApprovalRequest(UserModel user) throws MessagingException {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        List<UserModel> admins = userRepository.findEmailByUserRole(UserRole.ADMINISTRATOR);
        helper.setFrom(fromEmail);
        helper.setTo(admins.stream()
            .map(UserModel::getEmail)
            .toArray(String[]::new));

        helper.setSubject("StoneLedger: New Registration Request Awaits Review (Username: "+user.getUsername()+")");
        helper.setText(buildAdminEmailBody(user), true);
        mailSender.send(message);
    }

    public void sendApprovalNotification(UserModel user) throws MessagingException {
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

    private String buildApprovalEmailBody(UserModel user) {
        return "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;'>" +
            "<h2>Welcome to StoneLedger, " + user.getFirstName() + "!</h2>" +
            "<p>Congratulations! Your registration request has been approved. You can now access the StoneLedger platform.</p>" +
            "<p>Your login credential:</p>" +
            "<ul>" +
            "<li><strong>Username:</strong> <strong>" + user.getUsername() + "</strong></li>" +
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
}
