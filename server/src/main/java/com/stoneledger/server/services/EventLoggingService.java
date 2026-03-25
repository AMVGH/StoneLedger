package com.stoneledger.server.services;

import com.stoneledger.server.api.dtos.responses.EventLoggingDTO;
import com.stoneledger.server.api.enums.LoggingEvents;
import com.stoneledger.server.api.enums.LoggingTables;
import com.stoneledger.server.api.exeptions.AppException;
import com.stoneledger.server.api.models.EventModel;
import com.stoneledger.server.api.repositories.EventLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventLoggingService {
    @Autowired
    private EventLogRepository eventLogRepository;
    @Autowired
    private ErrorMessageService errorMessageService;
    @Autowired
    private ObjectMapper objectMapper;

    public void logEvent(Long userId, LoggingTables tableAffected, LoggingEvents eventAction, Object beforeImage, Object afterImage) {
        try {
            EventModel event = new EventModel();
            event.setUserId(userId);
            event.setTimestamp(LocalDateTime.now());
            event.setTableAffected(tableAffected);
            event.setEventAction(eventAction);

            // Serializes the object to JSON, allowing us to use one function for different logging events (i.e.: Account v. Transaction)
            event.setBeforeImage(beforeImage != null ? objectMapper.writeValueAsString(beforeImage) : null);
            event.setAfterImage(afterImage != null ? objectMapper.writeValueAsString(afterImage) : null);

            eventLogRepository.save(event);
        } catch (Exception e) {
            System.out.println("Failed to serialize object for logging: " + e.getMessage());
            e.printStackTrace(); // To print the full stack trace
            System.out.println("Object type: " + (afterImage != null ? afterImage.getClass() : "null"));
            System.out.println("User ID: " + userId);
            throw new AppException(errorMessageService.getError(122));
        }
    }

    public List<EventLoggingDTO> getEvents() {
        return eventLogRepository.findAll()
            .stream()
            .map(eventModel -> {
                EventLoggingDTO event = new EventLoggingDTO();
                event.setId(eventModel.getId());
                event.setUserId(eventModel.getUserId());
                event.setTimestamp(eventModel.getTimestamp());
                event.setTableAffected(eventModel.getTableAffected());
                event.setEventAction(eventModel.getEventAction());
                event.setBeforeImage(eventModel.getBeforeImage());
                event.setAfterImage(eventModel.getAfterImage());
                return event;
            }).collect(Collectors.toList());
    }
}
