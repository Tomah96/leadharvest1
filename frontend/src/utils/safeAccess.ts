/**
 * Safe data access utilities to prevent undefined errors
 * ALL CLAUDES MUST USE THESE FUNCTIONS
 */

/**
 * Safely access nested object properties
 * @example safeGet(user, 'profile.name', 'Unknown')
 */
export function safeGet<T>(
  obj: any,
  path: string,
  defaultValue: T
): T {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined || result === null) {
        console.log(`[SafeGet] Path "${path}" returned undefined at key "${key}"`, { obj });
        return defaultValue;
      }
    }
    
    return result ?? defaultValue;
  } catch (error) {
    console.error('[SafeGet] Error accessing path:', path, { error, obj });
    return defaultValue;
  }
}

/**
 * Ensure value is an array
 * @example safeArray(data).map(item => item.name)
 */
export function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  
  console.warn('[SafeArray] Expected array but got:', typeof value, { value });
  return [];
}

/**
 * Safe JSON parsing with fallback
 * @example safeParse(jsonString, {})
 */
export function safeParse<T>(
  jsonString: string,
  fallback: T
): T {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[SafeParse] Invalid JSON:', { error, jsonString });
    return fallback;
  }
}

/**
 * Safe function call with error handling
 * @example safeCall(() => riskyOperation(), null)
 */
export function safeCall<T>(
  fn: () => T,
  fallback: T,
  context?: string
): T {
  try {
    return fn();
  } catch (error) {
    console.error(`[SafeCall${context ? ` ${context}` : ''}] Function failed:`, error);
    return fallback;
  }
}

/**
 * Safe async function call with error handling
 * @example await safeAsync(() => fetchData(), [])
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  fallback: T,
  context?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    console.error(`[SafeAsync${context ? ` ${context}` : ''}] Async function failed:`, error);
    return fallback;
  }
}

/**
 * Validate that object has expected structure
 * @example validateStructure(data, ['id', 'name', 'email'])
 */
export function validateStructure(
  obj: any,
  requiredKeys: string[]
): boolean {
  if (!obj || typeof obj !== 'object') {
    console.warn('[ValidateStructure] Invalid object:', obj);
    return false;
  }
  
  const missingKeys = requiredKeys.filter(key => !(key in obj));
  
  if (missingKeys.length > 0) {
    console.warn('[ValidateStructure] Missing required keys:', missingKeys, { obj });
    return false;
  }
  
  return true;
}

/**
 * Safe string operations
 * @example safeString(value).trim().toLowerCase()
 */
export function safeString(value: any): string {
  if (typeof value === 'string') {
    return value;
  }
  
  if (value === null || value === undefined) {
    return '';
  }
  
  // Try to convert to string
  try {
    return String(value);
  } catch {
    console.warn('[SafeString] Could not convert to string:', value);
    return '';
  }
}

/**
 * Safe number operations
 * @example safeNumber(value, 0)
 */
export function safeNumber(value: any, fallback: number = 0): number {
  const num = Number(value);
  
  if (isNaN(num)) {
    console.warn('[SafeNumber] Invalid number:', value);
    return fallback;
  }
  
  return num;
}

/**
 * Create error boundary wrapper for React components
 * @example wrapComponent(RiskyComponent, ErrorFallback)
 */
export function wrapComponent<P extends object>(
  Component: React.ComponentType<P>,
  Fallback: React.ComponentType<{ error?: Error }>
): React.ComponentType<P> {
  return (props: P) => {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error('[ComponentWrapper] Component failed:', Component.name, error);
      return <Fallback error={error as Error} />;
    }
  };
}

/**
 * Log and return value (useful for debugging chains)
 * @example data.pipe(logValue('After transform'))
 */
export function logValue<T>(label: string): (value: T) => T {
  return (value: T) => {
    console.log(`[Debug] ${label}:`, value);
    return value;
  };
}

// Export all utilities
export default {
  safeGet,
  safeArray,
  safeParse,
  safeCall,
  safeAsync,
  validateStructure,
  safeString,
  safeNumber,
  wrapComponent,
  logValue
};