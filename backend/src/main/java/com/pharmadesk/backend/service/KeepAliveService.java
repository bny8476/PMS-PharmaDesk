package com.pharmadesk.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Keep-alive service for Render free tier deployments.
 */
@Service
public class KeepAliveService {

    private static final Logger log = LoggerFactory.getLogger(KeepAliveService.class);

    @Value("${app.keep-alive-enabled:${KEEP_ALIVE_ENABLED:true}}")
    private boolean keepAliveEnabled;

    @Value("${app.backend-health-url:${BACKEND_HEALTH_URL:}}")
    private String backendHealthUrl;

    @Value("${app.url:http://localhost:5173}")
    private String appUrl;

    @Value("${RENDER_EXTERNAL_URL:}")
    private String renderExternalUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Pings health endpoint every 10 minutes (600,000 ms).
     */
    @Scheduled(fixedRate = 600_000)
    public void keepAlive() {
        if (!keepAliveEnabled) {
            log.debug("Keep-alive ping is disabled by configuration.");
            return;
        }

        String healthUrl = resolveHealthUrl();
        if (healthUrl == null || healthUrl.isBlank()) {
            log.debug("Keep-alive: no valid health URL configured, skipping ping.");
            return;
        }

        try {
            String response = restTemplate.getForObject(healthUrl, String.class);
            log.debug("Keep-alive ping OK → {} | response: {}", healthUrl, response);
        } catch (Exception e) {
            log.debug("Keep-alive ping failed → {}: {}", healthUrl, e.getMessage());
        }
    }

    private String resolveHealthUrl() {
        if (backendHealthUrl != null && !backendHealthUrl.isBlank()) {
            return backendHealthUrl;
        }
        if (renderExternalUrl != null && !renderExternalUrl.isBlank()) {
            return renderExternalUrl.endsWith("/")
                ? renderExternalUrl + "actuator/health"
                : renderExternalUrl + "/actuator/health";
        }
        if (appUrl != null && appUrl.startsWith("https://")) {
            return appUrl.endsWith("/")
                ? appUrl + "actuator/health"
                : appUrl + "/actuator/health";
        }
        return null;
    }
}
