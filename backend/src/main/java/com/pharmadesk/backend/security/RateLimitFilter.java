package com.pharmadesk.backend.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.Refill;
import io.github.bucket4j.distributed.proxy.ProxyManager;
import io.github.bucket4j.distributed.BucketProxy;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private ProxyManager<byte[]> proxyManager;

    private final java.util.Map<String, io.github.bucket4j.Bucket> localBuckets = new java.util.concurrent.ConcurrentHashMap<>();

    public RateLimitFilter() {
    }

    private BucketConfiguration getBucketConfiguration() {
        // Allow 5 login attempts per minute per IP
        return BucketConfiguration.builder()
                .addLimit(Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1))))
                .build();
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader != null && !xfHeader.isEmpty()) {
            return xfHeader.split(",")[0].trim();
        }
        String xrHeader = request.getHeader("X-Real-IP");
        if (xrHeader != null && !xrHeader.isEmpty()) {
            return xrHeader.trim();
        }
        return request.getRemoteAddr();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        if (request.getRequestURI().equals("/api/auth/login")) {
            String ip = getClientIP(request);
            
            io.github.bucket4j.Bucket bucket;
            if (proxyManager != null) {
                byte[] key = ("rate_limit:" + ip).getBytes();
                bucket = proxyManager.builder().build(key, this::getBucketConfiguration);
            } else {
                bucket = localBuckets.computeIfAbsent(ip, k -> io.github.bucket4j.Bucket.builder()
                        .addLimit(io.github.bucket4j.Bandwidth.classic(5, io.github.bucket4j.Refill.greedy(5, java.time.Duration.ofMinutes(1))))
                        .build());
            }

            if (bucket.tryConsume(1)) {
                filterChain.doFilter(request, response);
            } else {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.getWriter().write("Too many requests. Please try again later.");
            }
            return;
        }

        filterChain.doFilter(request, response);
    }
}
