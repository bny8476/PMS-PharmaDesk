package com.pharmadesk.backend.controller;

import com.pharmadesk.backend.model.ActivityLog;
import com.pharmadesk.backend.pharmacy.dto.ApiResponse;
import com.pharmadesk.backend.service.ActivityLogService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for activity log queries.
 * Business logic is delegated to {@link ActivityLogService}.
 */
@RestController
@RequestMapping("/api/activity-log")
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    public ActivityLogController(ActivityLogService activityLogService) {
        this.activityLogService = activityLogService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ActivityLog>>> getLogsByUserId(
            @RequestParam Long userId,
            @RequestParam(required = false) String date,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int size) {

        Page<ActivityLog> logs = activityLogService.getLogs(userId, date, page, size);
        return ResponseEntity.ok(ApiResponse.success(logs, "Activity logs fetched"));
    }
}
