import { Surreal } from 'surrealdb';
import { isServiceAvailable, mockSurrealDB } from './mock-service-provider';

// Create a singleton instance of the SurrealDB client
let surreal: Surreal | null = null;
let useMockService = false;

/**
 * Initialize the SurrealDB client
 * @returns The SurrealDB client instance
 */
export async function initSurrealDB(): Promise<Surreal> {
  if (surreal) {
    return surreal;
  }

  try {
    // Create a new client
    surreal = new Surreal();

    // Get the base URL from environment or use default for local development
    let baseUrl = process.env.SURREAL_URL || 'http://localhost:8001';

    // For local development without Docker, use localhost with the correct port
    if (baseUrl.includes('surrealdb:8000') && !process.env.DOCKER_COMPOSE) {
      baseUrl = 'http://localhost:8001';
    }

    // For production deployment, use the provided URL
    if (process.env.NODE_ENV === 'production') {
      baseUrl = process.env.SURREAL_URL || baseUrl;
      console.log('Production mode: Using SurrealDB URL:', baseUrl);
    }

    // Check if we should use mock services
    if (process.env.USE_MOCK_SERVICES === 'true') {
      console.log('Using mock SurrealDB service (configured in .env)');
      useMockService = true;
      return surreal;
    }

    // Check if the service is available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      // SurrealDB doesn't have a standard health endpoint, so we'll just check if the server responds
      const response = await fetch(baseUrl, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log('SurrealDB health check failed, using mock service');
        useMockService = true;
        return surreal;
      }
    } catch (error) {
      console.log('SurrealDB is not available, using mock service');
      useMockService = true;
      return surreal;
    }

    // Handle protocol based on environment and URL
    // In production, respect the protocol in the URL
    if (process.env.NODE_ENV === 'production') {
      // If no protocol is specified, default to HTTPS for non-localhost URLs
      if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
          baseUrl = `http://${baseUrl}`;
        } else {
          baseUrl = `https://${baseUrl}`;
        }
      }
    } else {
      // In development, always use HTTP for localhost
      if (baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1')) {
        baseUrl = baseUrl.replace('https://', 'http://');
      }
      // For external connections in development, use HTTPS unless explicitly set to HTTP
      else if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://')) {
        baseUrl = `https://${baseUrl}`;
      }
    }

    const url = `${baseUrl}/rpc`;

    console.log(`Connecting to SurrealDB at: ${url}`);

    // Connect to the database
    await surreal.connect(url, {
      // Optional: Configure namespace and database
      namespace: process.env.SURREAL_NS || 'atlas',
      database: process.env.SURREAL_DB || 'erp',
      // Authentication credentials
      auth: {
        username: process.env.SURREAL_USER || 'root',
        password: process.env.SURREAL_PASS || 'root',
      },
    });

    console.log('Connected to SurrealDB');
    return surreal;
  } catch (error) {
    console.error('Error connecting to SurrealDB:', error);
    console.log('Using mock SurrealDB service');
    useMockService = true;
    return surreal;
  }
}

/**
 * Get the SurrealDB client instance, initializing if necessary
 * @returns The SurrealDB client instance
 */
export async function getSurrealDB(): Promise<Surreal> {
  if (!surreal) {
    return initSurrealDB();
  }
  return surreal;
}

/**
 * Create a record in the database
 * @param table The table to create the record in
 * @param data The data to store
 * @returns The created record
 */
export async function create<T>(table: string, data: unknown): Promise<T> {
  const db = await getSurrealDB();
  try {
    if (useMockService) {
      return mockSurrealDB.create(table, data) as T;
    }
    const result = await db.create(table, data);
    return result as T;
  } catch (error) {
    console.error(`Error creating record in ${table}:`, error);
    return mockSurrealDB.create(table, data) as T;
  }
}

/**
 * Select records from the database
 * @param table The table to select from
 * @param id Optional ID to select a specific record
 * @returns The selected records
 */
export async function select<T>(table: string, id?: string): Promise<T[]> {
  const db = await getSurrealDB();
  try {
    if (useMockService) {
      return mockSurrealDB.select() as T[];
    }
    if (id) {
      const result = await db.select(`${table}:${id}`);
      return result ? [result as T] : [];
    } else {
      const result = await db.select(table);
      return result as T[];
    }
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    return mockSurrealDB.select() as T[];
  }
}

/**
 * Update a record in the database
 * @param table The table containing the record
 * @param id The ID of the record to update
 * @param data The data to update
 * @returns The updated record
 */
export async function update<T>(table: string, id: string, data: unknown): Promise<T> {
  const db = await getSurrealDB();
  try {
    if (useMockService) {
      return mockSurrealDB.update(`${table}:${id}`, data) as T;
    }
    const result = await db.update(`${table}:${id}`, data);
    return result as T;
  } catch (error) {
    console.error(`Error updating record ${id} in ${table}:`, error);
    return mockSurrealDB.update(`${table}:${id}`, data) as T;
  }
}

/**
 * Delete a record from the database
 * @param table The table containing the record
 * @param id The ID of the record to delete
 * @returns The deleted record
 */
export async function remove<T>(table: string, id: string): Promise<T> {
  const db = await getSurrealDB();
  try {
    if (useMockService) {
      return mockSurrealDB.delete() as T;
    }
    const result = await db.delete(`${table}:${id}`);
    return result as T;
  } catch (error) {
    console.error(`Error deleting record ${id} from ${table}:`, error);
    return mockSurrealDB.delete() as T;
  }
}

/**
 * Execute a custom query
 * @param query The query to execute
 * @param vars Optional variables for the query
 * @returns The query result
 */
export async function query<T>(query: string, vars?: Record<string, any>): Promise<T> {
  const db = await getSurrealDB();
  try {
    if (useMockService) {
      return mockSurrealDB.query() as T;
    }
    const result = await db.query(query, vars);
    return result as T;
  } catch (error) {
    console.error('Error executing query:', error);
    return mockSurrealDB.query() as T;
  }
}

const defaultExport = {
  init: initSurrealDB,
  get: getSurrealDB,
  create,
  select,
  update,
  remove,
  query,
};
export default defaultExport;;
