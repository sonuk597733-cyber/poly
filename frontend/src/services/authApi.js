/**
 * CollegeOS Centralized Authentication & Profile Client Service
 * Connects to the Express & MongoDB backend API Gateway.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const STORAGE_KEY = "collegeos_auth_user";
const TOKEN_KEY = "collegeos_auth_token";
const PROFILE_KEY = "collegeos_auth_profile";

function notifyAuthChange(user = null) {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("collegeos:auth", { detail: user }));
    } catch {
      // ignore in non-browser environments
    }
  }
}

function getAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
    headers["Accept"] = "application/json";
  }
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const authApi = {
  /**
   * Stage registration & dispatch Email OTP
   */
  async register(data) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      credentials: "include",
      body: JSON.stringify(data)
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `Registration failed (HTTP ${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.errors = json?.errors || [];
      throw error;
    }

    return json;
  },

  /**
   * Verify 6-digit Email OTP to complete account provisioning
   */
  async verifyEmailOtp({ email, otp }) {
    const res = await fetch(`${API_BASE}/auth/verify-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email, otp })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `OTP Verification failed (HTTP ${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.isExpired = json?.isExpired;
      error.maxAttemptsExceeded = json?.maxAttemptsExceeded;
      error.remainingAttempts = json?.remainingAttempts;
      throw error;
    }

    if (json?.token && json?.user) {
      localStorage.setItem(TOKEN_KEY, json.token);
      const mergedUser = {
        ...json.user,
        ...(json.profile || {}),
        profile: json.profile || json.user.profile || null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedUser));
      notifyAuthChange(mergedUser);
    }
    if (json?.profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(json.profile));
    }

    return json;
  },

  /**
   * Resend 6-digit Email OTP
   */
  async resendEmailOtp(email) {
    const res = await fetch(`${API_BASE}/auth/resend-email-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `Failed to resend code (HTTP ${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.retryAfterSeconds = json?.retryAfterSeconds;
      throw error;
    }

    return json;
  },

  /**
   * Sign in with institutional credentials
   */
  async login({ email, password }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      credentials: "include",
      body: JSON.stringify({ email, password })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `Authentication failed (HTTP ${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.unverified = json?.unverified;
      error.email = json?.email;
      throw error;
    }

    if (json?.token && json?.user) {
      localStorage.setItem(TOKEN_KEY, json.token);
      const mergedUser = {
        ...json.user,
        ...(json.profile || {}),
        profile: json.profile || json.user.profile || null
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedUser));
      notifyAuthChange(mergedUser);
    }
    if (json?.profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(json.profile));
    }

    return json;
  },

  /**
   * Query current user (alias for fetchMe)
   */
  async getMe() {
    return this.fetchMe();
  },

  /**
   * Fetch current authenticated user from backend
   */
  async fetchMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        method: "GET",
        headers: getAuthHeaders(),
        credentials: "include"
      });

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          this.clearLocalSession();
        }
        return null;
      }

      const json = await res.json();
      if (json?.user) {
        const mergedUser = {
          ...json.user,
          ...(json.profile || {}),
          profile: json.profile || json.user.profile || null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedUser));
        if (json.profile) {
          localStorage.setItem(PROFILE_KEY, JSON.stringify(json.profile));
        }
        notifyAuthChange(mergedUser);
        return mergedUser;
      }
      return null;
    } catch {
      return this.getCurrentUser();
    }
  },

  /**
   * Fetch user profile along with role-specific collection
   */
  async getProfile() {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to load user profile.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    if (json?.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json.user));
    }
    if (json?.profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(json.profile));
    }

    return json;
  },

  /**
   * Update allowlisted user & role profile fields
   */
  async updateProfile(data) {
    const res = await fetch(`${API_BASE}/profile`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to update profile.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    if (json?.user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(json.user));
      notifyAuthChange(json.user);
    }
    if (json?.profile) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(json.profile));
    }

    return json;
  },

  /**
   * Upload user profile avatar photo
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append("avatar", file);

    const res = await fetch(`${API_BASE}/profile/avatar`, {
      method: "POST",
      headers: getAuthHeaders(false),
      credentials: "include",
      body: formData
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to upload avatar.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    const current = this.getCurrentUser();
    if (current && json.avatarUrl) {
      current.avatarUrl = json.avatarUrl;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      notifyAuthChange(current);
    }

    return json;
  },

  /**
   * Upload user profile cover banner photo
   */
  async uploadCover(file) {
    const formData = new FormData();
    formData.append("cover", file);

    const res = await fetch(`${API_BASE}/profile/cover`, {
      method: "POST",
      headers: getAuthHeaders(false),
      credentials: "include",
      body: formData
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to upload cover photo.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    const current = this.getCurrentUser();
    if (current && json.coverUrl) {
      current.coverUrl = json.coverUrl;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      notifyAuthChange(current);
    }

    return json;
  },

  /**
   * Delete user profile avatar photo
   */
  async deleteAvatar() {
    const res = await fetch(`${API_BASE}/profile/avatar`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to remove avatar.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    const current = this.getCurrentUser();
    if (current) {
      current.avatarUrl = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      notifyAuthChange(current);
    }

    return json;
  },

  /**
   * Delete user profile cover photo
   */
  async deleteCover() {
    const res = await fetch(`${API_BASE}/profile/cover`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to remove cover photo.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    const current = this.getCurrentUser();
    if (current) {
      current.coverUrl = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      notifyAuthChange(current);
    }

    return json;
  },

  /**
   * Fetch all students for staff and teacher dashboards
   */
  async getStudents() {
    const res = await fetch(`${API_BASE}/profile/students`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to load student roster.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return json;
  },

  /**
   * Fetch individual student record by ID for staff
   */
  async getStudentById(id) {
    const res = await fetch(`${API_BASE}/profile/students/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to load student details.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return json;
  },

  /**
   * Change authenticated user password
   */
  async changePassword({ currentPassword, newPassword }) {
    const res = await fetch(`${API_BASE}/profile/change-password`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ currentPassword, newPassword })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || "Failed to change password.";
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return json;
  },

  /**
   * Fetch all verification documents
   */
  async getDocuments() {
    const res = await fetch(`${API_BASE}/profile/documents`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to load documents.");
    }
    return json;
  },

  /**
   * Upload an institutional verification document
   */
  async uploadDocument(file, name = "", type = "ID Proof") {
    const formData = new FormData();
    formData.append("document", file);
    if (name) formData.append("name", name);
    if (type) formData.append("type", type);

    const res = await fetch(`${API_BASE}/profile/documents`, {
      method: "POST",
      headers: getAuthHeaders(false),
      credentials: "include",
      body: formData
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to upload document.");
    }
    return json;
  },

  /**
   * Download a verification document
   */
  async downloadDocument(documentId, fileName = "document") {
    const res = await fetch(`${API_BASE}/profile/documents/${documentId}/download`, {
      method: "GET",
      headers: getAuthHeaders(false),
      credentials: "include"
    });

    if (!res.ok) {
      throw new Error("Failed to download document.");
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
    return true;
  },

  /**
   * Delete a verification document
   */
  async deleteDocument(documentId) {
    const res = await fetch(`${API_BASE}/profile/documents/${documentId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to delete document.");
    }
    return json;
  },

  /**
   * Get account security info & login history
   */
  async getSecurityInfo() {
    const res = await fetch(`${API_BASE}/profile/security`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to load security information.");
    }
    return json;
  },

  /**
   * Get account activity logs
   */
  async getActivityLogs() {
    const res = await fetch(`${API_BASE}/profile/activity`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to load activity log.");
    }
    return json;
  },

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(notifications) {
    const res = await fetch(`${API_BASE}/profile/notifications`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify({ notifications })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to update notification preferences.");
    }
    return json;
  },

  /**
   * Request password reset link
   */
  async forgotPassword(email) {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ email })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `Password recovery request failed (HTTP ${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return json;
  },

  /**
   * Reset password using cryptographic token
   */
  async resetPassword({ token, newPassword }) {
    const res = await fetch(`${API_BASE}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({ token, newPassword })
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.message || `Password reset failed (HTTP ${res.status})`;
      const error = new Error(errorMsg);
      error.status = res.status;
      throw error;
    }

    return json;
  },

  /**
   * Sign out and clear session cookie & local storage
   */
  async logout() {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        credentials: "include"
      });
    } catch {
      // Ignore network errors on logout
    } finally {
      this.clearLocalSession();
    }
  },

  /**
   * Get cached user from local storage
   */
  getCurrentUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const user = raw ? JSON.parse(raw) : null;
      if (user && (!user.branch || !user.semester)) {
        const profRaw = localStorage.getItem(PROFILE_KEY);
        if (profRaw) {
          const profile = JSON.parse(profRaw);
          return { ...user, ...(profile || {}), profile: profile || user.profile || null };
        }
      }
      return user;
    } catch {
      return null;
    }
  },

  /**
   * Get cached profile from local storage
   */
  getCachedProfile() {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearLocalSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PROFILE_KEY);
    notifyAuthChange(null);
  },

  /**
   * Query gateway health status
   */
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return await res.json();
    } catch {
      // offline
    }
    return {
      success: false,
      status: "offline",
      institution: "Swami Vivekanand Subharti University",
      campus: "Subharti Polytechnic"
    };
  },

  // ==========================================
  // DASHBOARD CLIENT ENDPOINTS
  // ==========================================

  /**
   * Get role-tailored dashboard KPI statistics
   */
  async getDashboardStats() {
    const res = await fetch(`${API_BASE}/dashboard/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to load dashboard statistics.");
    }
    return json;
  },

  /**
   * Get role-tailored real chart trends and distribution
   */
  async getDashboardCharts() {
    const res = await fetch(`${API_BASE}/dashboard/charts`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(json?.message || "Failed to load dashboard charts.");
    }
    return json;
  },

  // ==========================================
  // ACADEMIC & INSTITUTIONAL FEATURE ENDPOINTS
  // ==========================================

  async getAttendance(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/attendance${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load attendance records.");
    return json;
  },

  async markAttendance(data) {
    const res = await fetch(`${API_BASE}/academic/attendance`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to record attendance.");
    return json;
  },

  async getAttendanceSummary(studentId = null) {
    const q = studentId ? `?studentId=${studentId}` : "";
    const res = await fetch(`${API_BASE}/academic/attendance/summary${q}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load attendance summary.");
    return json;
  },

  async getExams(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/exams${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load examination records.");
    return json;
  },

  async submitExamMark(data) {
    const res = await fetch(`${API_BASE}/academic/exams/marks`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to record examination score.");
    return json;
  },

  async getExamResults(studentId = null, params = {}) {
    let queryParams = { ...params };
    if (typeof studentId === "string") queryParams.studentId = studentId;
    else if (studentId && typeof studentId === "object") queryParams = { ...queryParams, ...studentId };
    const q = new URLSearchParams(queryParams).toString();
    const res = await fetch(`${API_BASE}/academic/exams/results${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load examination results.");
    return json;
  },

  async submitExamMarksBatch(data) {
    const res = await fetch(`${API_BASE}/academic/exams/marks/batch`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save batch marks.");
    return json;
  },

  async submitExamMarksBatchForVerification(data) {
    const res = await fetch(`${API_BASE}/academic/exams/marks/submit-batch`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to submit marks batch for verification.");
    return json;
  },

  async getPendingCoordinatorMarks(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/exams/workflow/pending${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load pending coordinator marks.");
    return json;
  },

  async verifyExamMarksBatch(data) {
    const res = await fetch(`${API_BASE}/academic/exams/workflow/verify`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to verify marks batch.");
    return json;
  },

  async getPendingHODMarks(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/exams/workflow/hod-pending${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load pending HOD marks.");
    return json;
  },

  async approveExamMarksHOD(data) {
    const res = await fetch(`${API_BASE}/academic/exams/workflow/approve-hod`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to approve marks batch.");
    return json;
  },

  async rejectExamMarksBatch(data) {
    const res = await fetch(`${API_BASE}/academic/exams/workflow/reject`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to reject marks batch.");
    return json;
  },

  async sanctionExamMarksPrincipal(data) {
    const res = await fetch(`${API_BASE}/academic/exams/workflow/sanction`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to sanction examination results.");
    return json;
  },

  async processSemesterResults(data) {
    const res = await fetch(`${API_BASE}/academic/exams/process-results`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to process semester examination results.");
    return json;
  },

  async publishSemesterResults(data) {
    const res = await fetch(`${API_BASE}/academic/exams/publish-results`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish semester results.");
    return json;
  },

  async getExamGazette(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/exams/gazette${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load examination gazette.");
    return json;
  },

  async getExamRulesConfig() {
    const res = await fetch(`${API_BASE}/academic/exams/rules`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load examination rules.");
    return json;
  },

  async updateExamRulesConfig(data) {
    const res = await fetch(`${API_BASE}/academic/exams/rules`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update examination rules.");
    return json;
  },

  async getSessionalSubjects(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/sessional/subjects${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load sessional subjects.");
    return json;
  },

  async getSessionalMarks(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/sessional/marks${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load sessional marks.");
    return json;
  },

  async submitSessionalMarksBatch(data) {
    const res = await fetch(`${API_BASE}/academic/sessional/marks/batch`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save internal sessional marks.");
    return json;
  },

  async updateSessionalMaxMarks(data) {
    const res = await fetch(`${API_BASE}/academic/sessional/max-marks`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || "Failed to update exam maximum marks.");
      err.requiresConfirmation = Boolean(json?.requiresConfirmation);
      err.exceedingCount = json?.exceedingCount;
      err.highestScore = json?.highestScore;
      throw err;
    }
    return json;
  },

  async getSessionalAnalytics(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/sessional/analytics${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load sessional analytics.");
    return json;
  },

  async getStudentSessionalResults(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/sessional/student-results${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load internal sessional results.");
    return json;
  },

  async getAssignments(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/assignments${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load assignments.");
    return json;
  },

  async getAssignmentById(id) {
    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load assignment details.");
    return json;
  },

  async createAssignment(data) {
    const isFormData = data instanceof FormData;
    const headers = getAuthHeaders();
    if (isFormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(`${API_BASE}/assignments`, {
      method: "POST",
      headers,
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to create assignment.");
    return json;
  },

  async updateAssignment(id, data) {
    const isFormData = data instanceof FormData;
    const headers = getAuthHeaders();
    if (isFormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(`${API_BASE}/assignments/${id}`, {
      method: "PUT",
      headers,
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update assignment.");
    return json;
  },

  async deleteAssignment(id, force = false) {
    const q = force ? "?force=true" : "";
    const res = await fetch(`${API_BASE}/assignments/${id}${q}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || "Failed to delete assignment.");
      err.hasSubmissions = Boolean(json?.hasSubmissions);
      err.submissionsCount = json?.submissionsCount || 0;
      err.status = res.status;
      throw err;
    }
    return json;
  },

  async submitAssignment(id, data) {
    const isFormData = data instanceof FormData;
    const headers = getAuthHeaders();
    if (isFormData) {
      delete headers["Content-Type"];
    }

    const res = await fetch(`${API_BASE}/assignments/${id}/submit`, {
      method: "POST",
      headers,
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to submit assignment.");
    return json;
  },

  async gradeAssignment(id, data) {
    const res = await fetch(`${API_BASE}/assignments/${id}/grade`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to grade submission.");
    return json;
  },

  async getAssignmentAnalytics(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/assignments/analytics${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load assignment analytics.");
    return json;
  },

  async downloadAssignmentReference(id, fileId, defaultName = "reference_file.pdf") {
    const res = await fetch(`${API_BASE}/assignments/${id}/download-reference/${fileId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message || "Failed to download reference file.");
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    return true;
  },

  async downloadAssignmentSubmission(id, submissionId, fileId, defaultName = "submission_file.pdf") {
    const res = await fetch(`${API_BASE}/assignments/${id}/download-submission/${submissionId}/${fileId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      throw new Error(json?.message || "Failed to download student submission file.");
    }
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = defaultName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    return true;
  },

  async publishAssignment(id) {
    const res = await fetch(`${API_BASE}/assignments/${id}/publish`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish assignment.");
    return json;
  },

  async unpublishAssignment(id) {
    const res = await fetch(`${API_BASE}/assignments/${id}/unpublish`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to unpublish assignment.");
    return json;
  },

  async archiveAssignment(id) {
    const res = await fetch(`${API_BASE}/assignments/${id}/archive`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to archive assignment.");
    return json;
  },

  async duplicateAssignment(id) {
    const res = await fetch(`${API_BASE}/assignments/${id}/duplicate`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to duplicate assignment.");
    return json;
  },

  async removeAssignmentAttachment(id, fileId) {
    const res = await fetch(`${API_BASE}/assignments/${id}/attachments/${fileId}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to remove attachment.");
    return json;
  },

  async exportAssignmentReportCSV(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/assignments/report/export-csv${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    if (!res.ok) throw new Error("Failed to export assignment report CSV.");
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `assignments_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
    return true;
  },

  async getTimetable(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/timetable${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load timetable.");
    return json;
  },

  // ==========================================
  // HYBRID TIMETABLE MANAGEMENT SUITE ENDPOINTS
  // ==========================================

  async getTimetableDashboardStats(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/dashboard-stats${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load timetable dashboard stats.");
    return json;
  },

  async getTimetableConfig(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/config${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load academic timetable config.");
    return json;
  },

  async saveTimetableConfig(data) {
    const res = await fetch(`${API_BASE}/timetable/config`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save timetable configuration.");
    return json;
  },

  async getTimetableSubjects(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/subjects${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load timetable subjects.");
    return json;
  },

  async updateTimetableSubject(data) {
    const res = await fetch(`${API_BASE}/timetable/subjects`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update subject requirements.");
    return json;
  },

  async getTimetableRooms(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/rooms${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load campus rooms.");
    return json;
  },

  async saveTimetableRoom(data) {
    const res = await fetch(`${API_BASE}/timetable/rooms`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save room details.");
    return json;
  },

  async getFacultyAvailability(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/availability${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load faculty availability.");
    return json;
  },

  async saveFacultyAvailability(data) {
    const res = await fetch(`${API_BASE}/timetable/availability`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save faculty availability.");
    return json;
  },

  async generateAutomaticTimetable(data) {
    const res = await fetch(`${API_BASE}/timetable/generate`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to generate timetable.");
    return json;
  },

  async getManageTimetable(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/manage${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load master timetable.");
    return json;
  },

  async saveManualTimetable(data) {
    const res = await fetch(`${API_BASE}/timetable/manage`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save timetable changes.");
    return json;
  },

  async checkTimetableConflicts(data) {
    const res = await fetch(`${API_BASE}/timetable/check-conflicts`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to check timetable conflicts.");
    return json;
  },

  async handleTimetableWorkflow(data) {
    const res = await fetch(`${API_BASE}/timetable/workflow`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Workflow transition failed.");
    return json;
  },

  async publishTimetable(data) {
    const res = await fetch(`${API_BASE}/timetable/publish`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish timetable.");
    return json;
  },

  async getPublishedTimetable(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/published${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load published timetable.");
    return json;
  },

  async getTeacherPersonalSchedule() {
    const res = await fetch(`${API_BASE}/timetable/teacher-schedule`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load teacher schedule.");
    return json;
  },

  async getStudentClassSchedule() {
    const res = await fetch(`${API_BASE}/timetable/student-schedule`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load student timetable.");
    return json;
  },

  async getTimetableVersions(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/versions${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load timetable versions.");
    return json;
  },

  async restoreTimetableVersion(data) {
    const res = await fetch(`${API_BASE}/timetable/versions/restore`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to restore timetable version.");
    return json;
  },

  async getTimetableReports(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/reports${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load timetable reports.");
    return json;
  },

  async getAcademicStaffList(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/timetable/faculty-staff${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load academic staff list.");
    return json;
  },

  async uploadTimetablePhoto(formData) {
    const headers = getAuthHeaders(false);
    const res = await fetch(`${API_BASE}/timetable/upload-photo`, {
      method: "POST",
      headers,
      credentials: "include",
      body: formData
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to upload timetable photo.");
    return json;
  },

  async extractTimetablePhoto(data) {
    const res = await fetch(`${API_BASE}/timetable/extract-photo`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to extract timetable from photograph.");
    return json;
  },

  async savePhotoTimetable(data) {
    const res = await fetch(`${API_BASE}/timetable/save-photo-timetable`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save photo timetable.");
    return json;
  },

  async getNotices() {
    const res = await fetch(`${API_BASE}/academic/notices`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load notices.");
    return json;
  },

  async createNotice(data) {
    const res = await fetch(`${API_BASE}/academic/notices`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish notice.");
    return json;
  },

  async getLeaves() {
    const res = await fetch(`${API_BASE}/academic/leaves`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load leave records.");
    return json;
  },

  async applyLeave(data) {
    const res = await fetch(`${API_BASE}/academic/leaves`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to submit leave request.");
    return json;
  },

  async updateLeaveStatus(id, data) {
    const res = await fetch(`${API_BASE}/academic/leaves/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update leave status.");
    return json;
  },

  async getNotifications() {
    const res = await fetch(`${API_BASE}/academic/notifications`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load notifications.");
    return json;
  },

  async markNotificationRead(id) {
    const res = await fetch(`${API_BASE}/academic/notifications/${id}/read`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    return res.json().catch(() => null);
  },

  async markAllNotificationsRead() {
    const res = await fetch(`${API_BASE}/academic/notifications/read-all`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    return res.json().catch(() => null);
  },

  async getManagementUsers(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/management/users${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load users.");
    return json;
  },

  async updateUserStatus(id, data) {
    const res = await fetch(`${API_BASE}/academic/management/users/${id}/status`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update user status.");
    return json;
  },

  async getReports() {
    const res = await fetch(`${API_BASE}/academic/management/reports`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to generate report.");
    return json;
  },

  // ==========================================
  // FACULTY & TEACHER COMMAND CENTER ENDPOINTS (V5)
  // ==========================================

  async getTeachers(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/teachers${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load faculty directory.");
    return json;
  },

  async getFacultyDirectory(params = {}) {
    return this.getTeachers(params);
  },

  async getFacultyDetails(id) {
    return this.getTeacherDetails(id);
  },

  async getTeacherStats() {
    const res = await fetch(`${API_BASE}/academic/teachers/stats`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load faculty overview metrics.");
    return json;
  },

  async getTeacherDetails(id) {
    const res = await fetch(`${API_BASE}/academic/teachers/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load faculty profile details.");
    return json;
  },

  async updateTeacherProfile(id, data) {
    const res = await fetch(`${API_BASE}/academic/teachers/${id}/profile`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update faculty profile.");
    return json;
  },

  async assignTeacherSlot(id, data) {
    const res = await fetch(`${API_BASE}/academic/teachers/${id}/assign`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || "Failed to assign teaching slot.");
      err.conflictType = json?.conflictType;
      throw err;
    }
    return json;
  },

  async unassignTeacherSlot(id, data) {
    const res = await fetch(`${API_BASE}/academic/teachers/${id}/unassign`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to unassign teaching slot.");
    return json;
  },

  // ==========================================
  // STUDENT DIRECTORY ENDPOINTS
  // ==========================================

  /**
   * Get paginated, searchable, filterable student directory.
   * All authenticated roles may access.
   */
  async getStudentsDirectory(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/students${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load student directory.");
    return json;
  },

  /**
   * Get a student's public/authorized profile.
   * Academic details are only returned when caller is staff or viewing own profile.
   */
  async getStudentPublicProfile(id) {
    const res = await fetch(`${API_BASE}/students/${id}/public`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(json?.message || "Student profile not found.");
      error.status = res.status;
      throw error;
    }
    return json;
  },

  /**
   * Deactivate (soft-delete) a student account.
   * Only principal and admin may call this.
   */
  async deactivateStudent(id) {
    const res = await fetch(`${API_BASE}/students/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(json?.message || "Failed to deactivate student account.");
      error.status = res.status;
      throw error;
    }
    return json;
  },

  /**
   * Reactivate a previously suspended student account.
   * Only principal and admin may call this.
   */
  async reactivateStudent(id) {
    const res = await fetch(`${API_BASE}/students/${id}/reactivate`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const error = new Error(json?.message || "Failed to reactivate student account.");
      error.status = res.status;
      throw error;
    }
    return json;
  },

  // ==========================================
  // COURSE MATERIALS & VIDEO LECTURES ENDPOINTS
  // ==========================================

  async getMaterials(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/materials${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load course materials.");
    return json;
  },

  async createMaterial(data) {
    const res = await fetch(`${API_BASE}/academic/materials`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish course material.");
    return json;
  },

  async deleteMaterial(id) {
    const res = await fetch(`${API_BASE}/academic/materials/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete course material.");
    return json;
  },

  // ==========================================
  // DIGITAL LECTURE & VIDEO MANAGEMENT ENDPOINTS
  // ==========================================

  async getLectures(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/lectures${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to fetch lectures.");
    return json;
  },

  async getLectureDetails(id) {
    const res = await fetch(`${API_BASE}/lectures/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to fetch lecture details.");
    return json;
  },

  async createLecture(payload, onProgress) {
    const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
    if (typeof onProgress === "function" || isFormData) {
      return this._uploadWithXhr(`${API_BASE}/lectures`, "POST", payload, onProgress);
    }
    const res = await fetch(`${API_BASE}/lectures`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish lecture.");
    return json;
  },

  async updateLecture(id, data, onProgress) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    if (typeof onProgress === "function" || isFormData) {
      return this._uploadWithXhr(`${API_BASE}/lectures/${id}`, "PUT", data, onProgress);
    }
    const res = await fetch(`${API_BASE}/lectures/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update lecture.");
    return json;
  },

  _uploadWithXhr(url, method, payload, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.withCredentials = true;

      const token = typeof window !== "undefined"
        ? (localStorage.getItem(TOKEN_KEY) || localStorage.getItem("token") || "")
        : "";
      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }

      const isFormData = typeof FormData !== "undefined" && payload instanceof FormData;
      if (!isFormData) {
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");
      }

      if (xhr.upload && typeof onProgress === "function") {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && e.total > 0) {
            const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
            onProgress({ percent: pct, loaded: e.loaded, total: e.total, stage: "uploading" });
          }
        };

        xhr.upload.onload = () => {
          onProgress({ percent: 100, loaded: 1, total: 1, stage: "processing" });
        };
      }

      xhr.onload = () => {
        let json = null;
        try {
          json = JSON.parse(xhr.responseText);
        } catch {}

        if (xhr.status >= 200 && xhr.status < 300) {
          if (typeof onProgress === "function") {
            onProgress({ percent: 100, loaded: 1, total: 1, stage: "complete" });
          }
          resolve(json || { success: true });
        } else {
          const errMsg = json?.message || `Request failed with status ${xhr.status}`;
          const err = new Error(errMsg);
          err.status = xhr.status;
          err.data = json;
          reject(err);
        }
      };

      xhr.onerror = () => {
        reject(new Error("Network connection error during upload. Please check your network and retry."));
      };

      xhr.ontimeout = () => {
        reject(new Error("Upload request timed out on the gateway."));
      };

      const body = isFormData ? payload : typeof payload === "string" ? payload : JSON.stringify(payload);
      xhr.send(body);
    });
  },

  async initLectureChunkUpload(meta) {
    const res = await fetch(`${API_BASE}/lectures/upload/init`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(meta)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to initialize chunk upload session.");
    return json;
  },

  async uploadLectureChunk({ uploadId, chunkIndex, totalChunks, chunkBlob, onProgress }) {
    const fd = new FormData();
    fd.append("uploadId", uploadId);
    fd.append("chunkIndex", String(chunkIndex));
    fd.append("totalChunks", String(totalChunks));
    fd.append("chunk", chunkBlob, `chunk_${chunkIndex}`);

    return this._uploadWithXhr(`${API_BASE}/lectures/upload/chunk`, "POST", fd, onProgress);
  },

  async completeLectureChunkUpload({ uploadId }) {
    const res = await fetch(`${API_BASE}/lectures/upload/complete`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify({ uploadId })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to complete chunk upload.");
    return json;
  },

  async getLectureChunkStatus(uploadId) {
    const res = await fetch(`${API_BASE}/lectures/upload/status/${uploadId}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to query chunk status.");
    return json;
  },

  /**
   * Resumable chunked video uploader with automatic retry per chunk
   */
  async uploadVideoFileChunked(file, onProgress) {
    const CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB per chunk
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    if (typeof onProgress === "function") {
      onProgress({ percent: 0, loaded: 0, total: file.size, stage: "initializing" });
    }

    const initData = await this.initLectureChunkUpload({
      filename: file.name,
      totalSize: file.size,
      totalChunks,
      mimeType: file.type || "video/mp4"
    });

    const uploadId = initData.uploadId;
    let uploadedBytesTotal = 0;

    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(file.size, start + CHUNK_SIZE);
      const chunkBlob = file.slice(start, end);
      const chunkSize = end - start;

      let chunkUploaded = false;
      let lastErr = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await this.uploadLectureChunk({
            uploadId,
            chunkIndex,
            totalChunks,
            chunkBlob,
            onProgress: (p) => {
              if (typeof onProgress === "function" && p.loaded) {
                const currentChunkBytes = Math.min(chunkSize, p.loaded);
                const currentTotal = uploadedBytesTotal + currentChunkBytes;
                const pct = Math.min(99, Math.round((currentTotal / file.size) * 100));
                onProgress({
                  percent: pct,
                  loaded: currentTotal,
                  total: file.size,
                  stage: "uploading",
                  chunk: chunkIndex + 1,
                  totalChunks
                });
              }
            }
          });
          chunkUploaded = true;
          break;
        } catch (err) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        }
      }

      if (!chunkUploaded) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1} of ${totalChunks}: ${lastErr?.message || "Network error"}`);
      }

      uploadedBytesTotal += chunkSize;
      if (typeof onProgress === "function") {
        const pct = Math.min(99, Math.round((uploadedBytesTotal / file.size) * 100));
        onProgress({
          percent: pct,
          loaded: uploadedBytesTotal,
          total: file.size,
          stage: chunkIndex === totalChunks - 1 ? "assembling" : "uploading",
          chunk: chunkIndex + 1,
          totalChunks
        });
      }
    }

    if (typeof onProgress === "function") {
      onProgress({ percent: 100, loaded: file.size, total: file.size, stage: "processing" });
    }

    const completeResult = await this.completeLectureChunkUpload({ uploadId });
    return completeResult.videoFile;
  },

  /**
   * Upload multiple document attachments directly with progress tracking
   * Returns list of saved document resources with secure access URLs
   */
  async uploadLectureDocuments(files, onProgress, titles = []) {
    if (!files || files.length === 0) {
      return { success: true, count: 0, documents: [] };
    }
    const fd = new FormData();
    files.forEach((file) => {
      fd.append("resourceFiles", file);
    });
    if (titles && titles.length > 0) {
      fd.append("resourceTitles", JSON.stringify(titles));
    }
    return this._uploadWithXhr(`${API_BASE}/lectures/upload/documents`, "POST", fd, onProgress);
  },

  async deleteLecture(id) {
    const res = await fetch(`${API_BASE}/lectures/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(true),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete lecture.");
    return json;
  },

  async saveLectureProgress(id, progressData) {
    const res = await fetch(`${API_BASE}/lectures/${id}/progress`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(progressData)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to save playback progress.");
    return json;
  },

  async getStudentLectureHistory() {
    const res = await fetch(`${API_BASE}/lectures/student/history`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to fetch student lecture history.");
    return json;
  },

  getLectureDownloadUrl(id, resourceId = null, type = "resource") {
    const base = `${API_BASE}/lectures/${id}/download${resourceId ? `/${resourceId}` : ""}`;
    return type === "video" ? `${base}?type=video` : base;
  },

  getLectureStreamUrl(id) {
    return `${API_BASE}/lectures/${id}/stream`;
  },

  async getLectureAnalytics(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/lectures/analytics/overview${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to fetch lecture analytics.");
    return json;
  },

  async getSingleLectureAnalytics(lectureId) {
    const res = await fetch(`${API_BASE}/lectures/${lectureId}/analytics`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to fetch lecture watch analytics.");
    return json;
  },

  async downloadLectureFile(url, suggestedFilename = "lecture_file", onProgress) {
    const res = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });

    if (!res.ok) {
      let errMsg = `Download failed (HTTP ${res.status})`;
      try {
        const errJson = await res.json();
        if (errJson?.message) errMsg = errJson.message;
      } catch {
        // Not a JSON response
      }
      throw new Error(errMsg);
    }

    const contentDisposition = res.headers.get("Content-Disposition");
    let filename = suggestedFilename;
    if (contentDisposition) {
      const match = contentDisposition.match(/filename=["']?([^"';]+)["']?/i);
      if (match && match[1]) filename = match[1].trim();
    }

    const contentLength = res.headers.get("Content-Length");
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!res.body || typeof res.body.getReader !== "function") {
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      return filename;
    }

    const reader = res.body.getReader();
    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (total > 0 && typeof onProgress === "function") {
        const pct = Math.min(100, Math.round((received / total) * 100));
        onProgress(pct, received, total);
      }
    }

    const blob = new Blob(chunks, { type: res.headers.get("Content-Type") || "application/octet-stream" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return filename;
  },

  // ==========================================
  // DIGITAL STUDY NOTES & CURRICULUM ENDPOINTS
  // ==========================================

  async getNotes(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/notes${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load study notes.");
    return json;
  },

  async getNoteById(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load note details.");
    return json;
  },

  async createNote(formData) {
    const res = await fetch(`${API_BASE}/notes`, {
      method: "POST",
      headers: getAuthHeaders(false),
      credentials: "include",
      body: formData
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to publish study notes.");
    return json;
  },

  async updateNote(id, data) {
    const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "PUT",
      headers: isFormData ? getAuthHeaders(false) : getAuthHeaders(true),
      credentials: "include",
      body: isFormData ? data : JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update study notes.");
    return json;
  },

  async deleteNote(id) {
    const res = await fetch(`${API_BASE}/notes/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete study notes.");
    return json;
  },

  async getStudentNotesStatistics() {
    const res = await fetch(`${API_BASE}/notes/student/statistics`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load notes statistics.");
    return json;
  },

  async getStudentDownloadedNotes() {
    const res = await fetch(`${API_BASE}/notes/student/downloaded`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load downloaded notes.");
    return json;
  },

  async getSingleNoteAnalytics(id) {
    const res = await fetch(`${API_BASE}/notes/${id}/analytics`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load note download analytics.");
    return json;
  },

  async getNotesAnalyticsOverview(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/notes/analytics/overview${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load notes overview analytics.");
    return json;
  },

  async downloadNoteFile(noteId, suggestedFilename = "study_notes.pdf", onProgress, fileId = null) {
    const q = fileId ? `?fileId=${encodeURIComponent(fileId)}` : "";
    const url = `${API_BASE}/notes/${noteId}/download${q}`;
    return this.downloadLectureFile(url, suggestedFilename, onProgress);
  },

  getNotePreviewUrl(noteId, fileId = null) {
    const token =
      (typeof window !== "undefined" &&
        (localStorage.getItem("collegeos_auth_token") ||
          localStorage.getItem("collegeos_token") ||
          localStorage.getItem("token"))) ||
      "";
    const qFile = fileId ? `&fileId=${encodeURIComponent(fileId)}` : "";
    return `${API_BASE}/notes/${noteId}/preview?token=${encodeURIComponent(token)}${qFile}`;
  },

  // ==========================================
  // FEES & INVOICES ENDPOINTS
  // ==========================================

  async getFees(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/fees${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load fee ledger.");
    return json;
  },

  async payFee(payload) {
    const res = await fetch(`${API_BASE}/academic/fees/pay`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to process fee payment.");
    return json;
  },

  // ==========================================
  // LIBRARY CATALOG & ISSUES ENDPOINTS
  // ==========================================

  async getLibraryBooks(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/library/books${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load library catalog.");
    return json;
  },

  async getMyIssuedBooks(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/library/my-books${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load borrowed books.");
    return json;
  },

  async issueLibraryBook(payload) {
    const res = await fetch(`${API_BASE}/academic/library/issue`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to issue book.");
    return json;
  },

  async returnLibraryBook(payload) {
    const res = await fetch(`${API_BASE}/academic/library/return`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to return book.");
    return json;
  },

  // ==========================================
  // FEEDBACK & GRIEVANCE ENDPOINTS
  // ==========================================

  async getFeedback(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/feedback${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load feedback records.");
    return json;
  },

  async submitFeedback(payload) {
    const res = await fetch(`${API_BASE}/academic/feedback`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to submit feedback.");
    return json;
  },

  async respondFeedback(id, payload) {
    const res = await fetch(`${API_BASE}/academic/feedback/${id}/respond`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to submit feedback response.");
    return json;
  },

  // ==========================================
  // ROOMS & LABS INFRASTRUCTURE ENDPOINTS
  // ==========================================

  async getRooms(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/rooms${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load campus rooms.");
    return json;
  },

  async allocateRoom(payload) {
    const res = await fetch(`${API_BASE}/academic/rooms/allocate`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to allocate room.");
    return json;
  },

  // ==========================================
  // ACADEMIC CALENDAR & EVENTS ENDPOINTS
  // ==========================================

  async getCalendarEvents(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/calendar${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load academic calendar.");
    return json;
  },

  async createCalendarEvent(payload) {
    const res = await fetch(`${API_BASE}/academic/calendar`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to create calendar event.");
    return json;
  },

  // ==========================================
  // AUDIT LOGS & SYSTEM SETTINGS ENDPOINTS
  // ==========================================

  async getAuditLogs() {
    const res = await fetch(`${API_BASE}/academic/audit-logs`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load system audit logs.");
    return json;
  },

  async getSettings() {
    const res = await fetch(`${API_BASE}/academic/settings`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load institutional settings.");
    return json;
  },

  async updateSetting(payload) {
    const res = await fetch(`${API_BASE}/academic/settings`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update setting.");
    return json;
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`, {
      method: "GET",
      headers: { Accept: "application/json" }
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Health check endpoint failed.");
    return json;
  },

  // ==========================================
  // HOD 6 ENTERPRISE MODULES API CLIENT
  // ==========================================

  // 1. Academic Management (Subjects & Curriculum)
  async getSubjects(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/subjects${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load curriculum subjects.");
    return json;
  },

  async createSubject(data) {
    const res = await fetch(`${API_BASE}/academic/subjects`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to create subject.");
    return json;
  },

  async updateSubject(id, data) {
    const res = await fetch(`${API_BASE}/academic/subjects/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update subject.");
    return json;
  },

  async deleteSubject(id) {
    const res = await fetch(`${API_BASE}/academic/subjects/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete subject.");
    return json;
  },

  async getSubjectStats(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/subjects/stats${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load curriculum statistics.");
    return json;
  },

  // 2. HOD Assignments Management
  async getHODAssignmentsOverview(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/hod/assignments/overview${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load assignment overview.");
    return json;
  },

  // 3. Examination Management
  async getExamSchedules(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/exams/schedules${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load examination schedules.");
    return json;
  },

  async createExamSchedule(data) {
    const res = await fetch(`${API_BASE}/academic/exams/schedules`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to create examination schedule.");
    return json;
  },

  async updateExamSchedule(id, data) {
    const res = await fetch(`${API_BASE}/academic/exams/schedules/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update examination schedule.");
    return json;
  },

  async deleteExamSchedule(id) {
    const res = await fetch(`${API_BASE}/academic/exams/schedules/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete examination schedule.");
    return json;
  },

  async getExamAnalytics(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/exams/analytics${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load examination analytics.");
    return json;
  },

  // 4. Laboratory Management
  async getLabEquipment(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/labs${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load laboratory equipment.");
    return json;
  },

  async createLabEquipment(data) {
    const res = await fetch(`${API_BASE}/academic/labs`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to register lab equipment.");
    return json;
  },

  async updateLabEquipment(id, data) {
    const res = await fetch(`${API_BASE}/academic/labs/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update lab equipment.");
    return json;
  },

  async deleteLabEquipment(id) {
    const res = await fetch(`${API_BASE}/academic/labs/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete lab equipment.");
    return json;
  },

  async getLabStats(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/labs/stats${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load laboratory statistics.");
    return json;
  },

  // 5. Department Events & Activities
  async getDepartmentEvents(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/events/department${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load department events.");
    return json;
  },

  async createDepartmentEvent(data) {
    const res = await fetch(`${API_BASE}/academic/events/department`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to create department event.");
    return json;
  },

  async updateDepartmentEvent(id, data) {
    const res = await fetch(`${API_BASE}/academic/events/department/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update department event.");
    return json;
  },

  async deleteDepartmentEvent(id) {
    const res = await fetch(`${API_BASE}/academic/events/department/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete department event.");
    return json;
  },

  // 6. Placement & Internship
  async getPlacements(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/placements${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load placement records.");
    return json;
  },

  async createPlacement(data) {
    const res = await fetch(`${API_BASE}/academic/placements`, {
      method: "POST",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to create placement record.");
    return json;
  },

  async updatePlacement(id, data) {
    const res = await fetch(`${API_BASE}/academic/placements/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: JSON.stringify(data)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to update placement record.");
    return json;
  },

  async deletePlacement(id) {
    const res = await fetch(`${API_BASE}/academic/placements/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to delete placement record.");
    return json;
  },

  async getPlacementStats(params = {}) {
    const q = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE}/academic/placements/stats${q ? `?${q}` : ""}`, {
      method: "GET",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) throw new Error(json?.message || "Failed to load placement statistics.");
    return json;
  },

  // ==========================================
  // GENERIC REST HELPERS (AXIOS COMPATIBILITY)
  // ==========================================
  async get(endpoint, config = {}) {
    let cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    if (config?.params) {
      const q = new URLSearchParams();
      for (const [key, val] of Object.entries(config.params)) {
        if (val !== undefined && val !== null) {
          q.append(key, String(val));
        }
      }
      const qs = q.toString();
      if (qs) {
        cleanEndpoint += (cleanEndpoint.includes("?") ? "&" : "?") + qs;
      }
    }
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method: "GET",
      headers: { ...getAuthHeaders(), ...(config?.headers || {}) },
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || `Request failed with status ${res.status}`);
      err.response = { data: json, status: res.status };
      throw err;
    }
    return { data: json, status: res.status };
  },

  async post(endpoint, body = {}) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method: "POST",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || `Request failed with status ${res.status}`);
      err.response = { data: json, status: res.status };
      throw err;
    }
    return { data: json, status: res.status };
  },

  async put(endpoint, body = {}) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method: "PUT",
      headers: getAuthHeaders(true),
      credentials: "include",
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || `Request failed with status ${res.status}`);
      err.response = { data: json, status: res.status };
      throw err;
    }
    return { data: json, status: res.status };
  },

  async delete(endpoint) {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const res = await fetch(`${API_BASE}${cleanEndpoint}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include"
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(json?.message || `Request failed with status ${res.status}`);
      err.response = { data: json, status: res.status };
      throw err;
    }
    return { data: json, status: res.status };
  },

  // ==========================================
  // DEDICATED MASTER ATTENDANCE API SERVICE
  // ==========================================
  async getStudentOverallAttendance(studentId = null) {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return this.get(`/attendance/student-overall${q}`);
  },

  async getStudentSubjectAttendance(studentId = null) {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return this.get(`/attendance/student-subjects${q}`);
  },

  async getStudentSubjectHistory(subject, studentId = null) {
    let q = `?subject=${encodeURIComponent(subject)}`;
    if (studentId) q += `&studentId=${encodeURIComponent(studentId)}`;
    return this.get(`/attendance/subject-history${q}`);
  },

  async getStudentTodayAttendance(studentId = null) {
    const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
    return this.get(`/attendance/today-student${q}`);
  },

  async getStudentDayAudit(date, studentId = null) {
    let q = `?date=${encodeURIComponent(date)}`;
    if (studentId) q += `&studentId=${encodeURIComponent(studentId)}`;
    return this.get(`/attendance/student-day-audit${q}`);
  },

  async getAttendanceRoster(branch, semester, section = "A") {
    return this.get(`/attendance/roster?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`);
  },

  async getTodayTimetableSessions(branch, semester, section = "A", date = null) {
    let q = `?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`;
    if (date) q += `&date=${encodeURIComponent(date)}`;
    return this.get(`/attendance/today-timetable${q}`);
  },

  async getDailyCollegeAttendance(branch, semester, section = "A", date = null) {
    let q = `?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`;
    if (date) q += `&date=${encodeURIComponent(date)}`;
    return this.get(`/attendance/daily-college${q}`);
  },

  async markDailyCollegeAttendance(payload) {
    return this.post("/attendance/daily-college", payload);
  },

  async getSubjectSessionAttendance(params = {}) {
    const q = new URLSearchParams(params).toString();
    return this.get(`/attendance/subject-session${q ? `?${q}` : ""}`);
  },

  async markSubjectSessionAttendance(payload) {
    return this.post("/attendance/subject-session", payload);
  },

  async correctAttendanceRecord(payload) {
    return this.post("/attendance/correct-record", payload);
  },

  async getAttendanceConfig(branch = "CSE", semester = "5th Semester", section = "A") {
    return this.get(`/attendance/config?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`);
  },

  async saveAttendanceConfig(payload) {
    return this.post("/attendance/config", payload);
  },

  async getAttendanceAnalytics(branch = "CSE", semester = "5th Semester", section = "A") {
    return this.get(`/attendance/analytics?branch=${encodeURIComponent(branch)}&semester=${encodeURIComponent(semester)}&section=${encodeURIComponent(section)}`);
  },

  async simulateAttendanceProjection(payload) {
    return this.post("/attendance/simulate-projection", payload);
  },

  getScannedMarksheetUrl() {
    return `${API_BASE}/academic/scanned-marksheet`;
  }
};
