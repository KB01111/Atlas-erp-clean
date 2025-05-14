import { Surreal } from 'surrealdb';

// Create a singleton instance of the SurrealDB client
let surreal: Surreal | null = null;

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

    // Get the base URL from environment or use default
    const baseUrl = process.env.SURREAL_URL || 'http://localhost:8000';

    // Ensure the URL has the correct protocol based on whether it's using SSL
    const url = baseUrl.includes('https://')
      ? `${baseUrl}/rpc`
      : `${baseUrl}/rpc`;

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
    throw error;
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
export async function create<T>(table: string, data: any): Promise<T> {
  const db = await getSurrealDB();
  try {
    const result = await db.create(table, data);
    return result as T;
  } catch (error) {
    console.error(`Error creating record in ${table}:`, error);
    throw error;
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
    if (id) {
      const result = await db.select(`${table}:${id}`);
      return result ? [result as T] : [];
    } else {
      const result = await db.select(table);
      return result as T[];
    }
  } catch (error) {
    console.error(`Error selecting from ${table}:`, error);
    throw error;
  }
}

/**
 * Update a record in the database
 * @param table The table containing the record
 * @param id The ID of the record to update
 * @param data The data to update
 * @returns The updated record
 */
export async function update<T>(table: string, id: string, data: any): Promise<T> {
  const db = await getSurrealDB();
  try {
    const result = await db.update(`${table}:${id}`, data);
    return result as T;
  } catch (error) {
    console.error(`Error updating record ${id} in ${table}:`, error);
    throw error;
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
    const result = await db.delete(`${table}:${id}`);
    return result as T;
  } catch (error) {
    console.error(`Error deleting record ${id} from ${table}:`, error);
    throw error;
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
    const result = await db.query(query, vars);
    return result as T;
  } catch (error) {
    console.error('Error executing query:', error);
    throw error;
  }
}

export default {
  init: initSurrealDB,
  get: getSurrealDB,
  create,
  select,
  update,
  remove,
  query,
};
