import axios, { AxiosInstance, AxiosError } from "axios";
import type { 
  Lead, 
  PaginatedResponse, 
  LeadQueryParams,
  Message,
  MessageInput,
  ConversationResponse,
  GmailConnection,
  BatchProcess,
  TestConnectionResponse,
  TestProcessedLeadsResponse
} from "@/types";
import type { MessageTemplate, ProcessedTemplate } from "@/app/settings/templates/templateTypes";

// API Base URL - will be configurable via environment variable
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Default timeout for API requests (5 seconds for better UX)
const DEFAULT_TIMEOUT = 5000;

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Include cookies for authentication
  timeout: DEFAULT_TIMEOUT, // 5 second timeout
});

// Request interceptor for auth and logging
apiClient.interceptors.request.use(
  (config) => {
    // Log outgoing requests in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
        timeout: config.timeout,
        timestamp: new Date().toISOString()
      });
    }
    // Auth headers will be handled by httpOnly cookies
    // Add any other headers if needed
    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Track database availability
let databaseAvailable = true;

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === "development") {
      const duration = response.config['metadata']?.startTime 
        ? Date.now() - response.config['metadata'].startTime 
        : null;
      
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        duration: duration ? `${duration}ms` : 'unknown',
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        hasData: !!response.data
      });
    }
    
    // If we get a successful response, database is available
    databaseAvailable = true;
    return response;
  },
  async (error: AxiosError<{ message?: string; error?: string }>) => {
    // Handle timeout errors
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const timeoutError = new Error(
        'Request timeout - The server is taking too long to respond. Please try again or refresh the page.'
      );
      (timeoutError as any).isTimeout = true;
      (timeoutError as any).originalError = error;
      return Promise.reject(timeoutError);
    }

    if (error.response?.status === 401) {
      // Handle unauthorized access
      // TEMPORARILY DISABLED for development
      console.warn("401 Unauthorized - Auth redirect disabled for development");
      // if (typeof window !== "undefined") {
      //   window.location.href = "/login";
      // }
    }

    // Handle 503 Service Unavailable (database down)
    if (error.response?.status === 503) {
      databaseAvailable = false;
      const errorMessage = error.response.data?.message || "Service temporarily unavailable";
      
      // Check if it's specifically a database error
      if (errorMessage.toLowerCase().includes('database')) {
        console.warn("Database unavailable - Running in Gmail-only mode");
        
        // Create a more user-friendly error
        const userError = new Error("Database features temporarily unavailable. Gmail features still work.");
        (userError as any).isDatabaseError = true;
        (userError as any).originalError = error;
        return Promise.reject(userError);
      }
    }

    // Log errors in development
    if (process.env.NODE_ENV === "development") {
      console.error("API Error:", error.response?.data || error.message);
    }

    return Promise.reject(error);
  }
);

// API methods
export const api = {
  // Health check
  healthCheck: () => apiClient.get("/health"),

  // Authentication
  auth: {
    login: (email: string, password: string) =>
      apiClient.post("/auth/login", { email, password }),
    logout: () => apiClient.post("/auth/logout"),
    getCurrentUser: () => apiClient.get("/auth/me"),
  },

  // Leads
  leads: {
    getAll: (params?: LeadQueryParams) => 
      apiClient.get<PaginatedResponse<Lead>>("/leads", { 
        params,
        timeout: 15000 // 15 seconds for bulk leads (known to be slower)
      }),
    
    getById: (id: string) => 
      apiClient.get<Lead>(`/leads/${id}`, {
        timeout: 8000 // 8 seconds for single lead (should be faster)
      }),
    
    create: (lead: Partial<Lead>) => 
      apiClient.post<Lead>("/leads", lead),
    
    update: (id: string, updates: Partial<Lead>) => 
      apiClient.patch<Lead>(`/leads/${id}`, updates),
    
    delete: (id: string) => 
      apiClient.delete(`/leads/${id}`),
    
    bulkDelete: (ids: string[]) =>
      apiClient.post<{
        success: boolean;
        message: string;
        deleted: number;
        failed: string[];
        errors: Array<{ id: string; error: string }>;
      }>("/leads/bulk-delete", { ids }),
  },

  // Conversations
  conversations: {
    getByLeadId: (leadId: string) => 
      apiClient.get<ConversationResponse>(`/leads/${leadId}/conversations`),
    
    addMessage: (leadId: string, message: MessageInput) => 
      apiClient.post<Message>(`/leads/${leadId}/conversations`, message),
    
    updateMessage: (id: string, updates: Partial<Message>) => 
      apiClient.patch<Message>(`/conversations/${id}`, updates),
    
    getStats: (leadId: string) =>
      apiClient.get(`/leads/${leadId}/conversations/stats`),
  },

  // Settings
  settings: {
    templates: {
      getAll: () => apiClient.get("/settings/templates"),
      create: (template: any) => apiClient.post("/settings/templates", template),
      update: (id: string, template: any) => 
        apiClient.patch(`/settings/templates/${id}`, template),
      delete: (id: string) => apiClient.delete(`/settings/templates/${id}`),
    },
  },

  // Message Templates
  templates: {
    getAll: () => apiClient.get<{ success: boolean; data: MessageTemplate[] }>("/templates"),
    
    get: (id: string) => apiClient.get<{ success: boolean; data: MessageTemplate }>(`/templates/${id}`),
    
    create: (data: Partial<MessageTemplate>) => 
      apiClient.post<{ success: boolean; data: MessageTemplate }>("/templates", data),
    
    update: (id: string, data: Partial<MessageTemplate>) =>
      apiClient.put<{ success: boolean; data: MessageTemplate }>(`/templates/${id}`, data),
    
    delete: (id: string) =>
      apiClient.delete<{ success: boolean }>(`/templates/${id}`),
    
    preview: (data: { template: string; leadData?: any }) =>
      apiClient.post<{ success: boolean; data: ProcessedTemplate }>("/templates/preview", data),
    
    applyToLead: (templateId: string, leadId: string) =>
      apiClient.post<{ data: ProcessedTemplate }>(`/templates/${templateId}/apply/${leadId}`)
  },

  // Gmail Integration
  gmail: {
    getAuthUrl: () => apiClient.get<{ url: string }>("/gmail/auth-url"),
    handleCallback: (code: string) => 
      apiClient.get(`/gmail/auth-callback?code=${code}`),
    getConnectionStatus: () => apiClient.get<GmailConnection>("/gmail/status"),
    disconnect: () => apiClient.post("/gmail/disconnect"),
    // Batch processing
    getBatchStatus: () => apiClient.get<BatchProcess>("/gmail/batch/status"),
    startBatchProcess: () => apiClient.post<BatchProcess>("/gmail/batch/start"),
    pauseBatchProcess: () => apiClient.post<BatchProcess>("/gmail/batch/pause"),
    resumeBatchProcess: () => apiClient.post<BatchProcess>("/gmail/batch/resume"),
    stopBatchProcess: () => apiClient.post("/gmail/batch/stop"),
    // Test endpoints
    testConnection: () => apiClient.get<TestConnectionResponse>("/gmail/test-connection"),
    testProcessedLeads: () => apiClient.get<TestProcessedLeadsResponse>("/gmail/test-processed-leads"),
    // New Gmail test endpoints for Day 6
    test: {
      getLabels: () => apiClient.get<{ labels: Array<{ name: string; id: string; messageCount: number }> }>("/gmail/test/labels"),
      importEmails: (labelId: string, count: number) => 
        apiClient.post<{ 
          imported: number; 
          parsed: number; 
          errors: string[]; 
          results: Array<{
            messageId: string;
            subject: string;
            parsed: boolean;
            data?: Partial<Lead>;
            error?: string;
          }>
        }>("/gmail/test/import", { labelId, count }),
      parseEmail: (messageId: string) => 
        apiClient.get<{ 
          success: boolean; 
          data?: Partial<Lead>; 
          rawEmail?: any;
          consoleOutput?: string;
          error?: string 
        }>(`/gmail/test/parse/${messageId}`),
    },
  },
};

// Export utility function to check database status
export const isDatabaseAvailable = () => databaseAvailable;

// Utility function for custom timeout on specific requests
export const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = DEFAULT_TIMEOUT): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        const error = new Error(`Request timeout after ${timeoutMs}ms`);
        (error as any).isTimeout = true;
        reject(error);
      }, timeoutMs);
    })
  ]);
};

// Export types
export type ApiClient = typeof api;
export default apiClient;