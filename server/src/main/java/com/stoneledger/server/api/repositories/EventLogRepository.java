package com.stoneledger.server.api.repositories;

import com.stoneledger.server.api.models.EventModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EventLogRepository extends JpaRepository<EventModel, Long> {
}
