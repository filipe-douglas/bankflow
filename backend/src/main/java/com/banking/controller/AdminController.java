package com.banking.controller;

import com.banking.dto.response.PageResponse;
import com.banking.dto.response.UserResponse;
import com.banking.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<PageResponse<UserResponse>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<UserResponse> result = adminService.listUsers(pageable);

        return ResponseEntity.ok(PageResponse.<UserResponse>builder()
                .content(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .last(result.isLast())
                .build());
    }

    @PatchMapping("/users/{id}/toggle")
    public ResponseEntity<Void> toggleUser(@PathVariable UUID id) {
        adminService.toggleUser(id);
        return ResponseEntity.noContent().build();
    }
}
