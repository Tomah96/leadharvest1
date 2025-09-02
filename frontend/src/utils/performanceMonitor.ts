/**
 * Performance monitoring utility for frontend operations
 * Helps track and log performance metrics for debugging
 */

interface PerformanceEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private entries: Map<string, PerformanceEntry> = new Map();
  private enabled: boolean = process.env.NODE_ENV === 'development';

  /**
   * Start timing an operation
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const entry: PerformanceEntry = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.entries.set(name, entry);
    console.log(`[Performance] Started: ${name}`, metadata || '');
  }

  /**
   * End timing an operation and log the duration
   */
  end(name: string): number | null {
    if (!this.enabled) return null;

    const entry = this.entries.get(name);
    if (!entry) {
      console.warn(`[Performance] No start time found for: ${name}`);
      return null;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    // Log based on duration
    const duration = entry.duration.toFixed(2);
    if (entry.duration > 3000) {
      console.error(`[Performance] ⚠️ SLOW: ${name} took ${duration}ms`, entry.metadata || '');
    } else if (entry.duration > 1000) {
      console.warn(`[Performance] ⏱️ ${name} took ${duration}ms`, entry.metadata || '');
    } else {
      console.log(`[Performance] ✅ ${name} took ${duration}ms`, entry.metadata || '');
    }

    // Clean up old entry
    this.entries.delete(name);

    return entry.duration;
  }

  /**
   * Measure an async function
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    this.start(name, metadata);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Log a performance warning
   */
  warn(message: string, details?: any): void {
    if (!this.enabled) return;
    console.warn(`[Performance Warning] ${message}`, details || '');
  }

  /**
   * Get all active timers (useful for debugging)
   */
  getActiveTimers(): string[] {
    return Array.from(this.entries.keys());
  }

  /**
   * Clear all timers
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }
}

// Export singleton instance
export const perfMonitor = new PerformanceMonitor();

// Export for use in components
export function usePerformanceMonitor() {
  return perfMonitor;
}

// Helper to measure React component render time
export function measureRender(componentName: string) {
  return function decorator(target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      perfMonitor.start(`${componentName}.render`);
      const result = originalMethod.apply(this, args);
      perfMonitor.end(`${componentName}.render`);
      return result;
    };

    return descriptor;
  };
}

// Helper to log slow API calls
export function logSlowAPICalls(threshold: number = 2000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;
        if (duration > threshold) {
          console.warn(`[Slow API Call] ${propertyName} took ${duration.toFixed(2)}ms`);
        }
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(`[Failed API Call] ${propertyName} failed after ${duration.toFixed(2)}ms`);
        throw error;
      }
    };

    return descriptor;
  };
}

export default perfMonitor;