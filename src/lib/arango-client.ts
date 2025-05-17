import { Database, aql } from 'arangojs';
import { isServiceAvailable, mockArangoDB } from './mock-service-provider';

// Singleton instance
let arangoInstance: Database | null = null;
let useMockService = false;

/**
 * Initialize ArangoDB connection
 * @returns ArangoDB database instance
 */
export async function initArangoDB(): Promise<Database> {
  if (arangoInstance) {
    return arangoInstance;
  }

  try {
    console.log('Initializing ArangoDB connection...');

    // Get the URL from environment or use default for local development
    let arangoUrl = process.env.ARANGO_URL || 'http://localhost:8529';

    // For local development without Docker, use localhost
    if (arangoUrl.includes('arangodb:8529') && !process.env.DOCKER_COMPOSE) {
      arangoUrl = 'http://localhost:8529';
    }

    // Get the database name
    const dbName = process.env.ARANGO_DB || 'atlas_knowledge';

    // Add the database to the URL directly
    if (!arangoUrl.includes('/_db/')) {
      arangoUrl = `${arangoUrl}/_db/${dbName}`;
    }

    // For production deployment, use the provided URL
    if (process.env.NODE_ENV === 'production') {
      arangoUrl = process.env.ARANGO_URL || arangoUrl;
      console.log('Production mode: Using ArangoDB URL:', arangoUrl);

      // If no protocol is specified, default to HTTPS for non-localhost URLs in production
      if (!arangoUrl.startsWith('http://') && !arangoUrl.startsWith('https://')) {
        if (arangoUrl.includes('localhost') || arangoUrl.includes('127.0.0.1')) {
          arangoUrl = `http://${arangoUrl}`;
        } else {
          arangoUrl = `https://${arangoUrl}`;
        }
      }
    }

    // Check if we should use mock services
    if (process.env.USE_MOCK_SERVICES === 'true') {
      console.log('Using mock ArangoDB service (configured in .env)');
      useMockService = true;
      return arangoInstance = new Database(); // Return a dummy instance
    }

    console.log('USE_MOCK_SERVICES =', process.env.USE_MOCK_SERVICES);

    // Check if the service is available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // Increased timeout

      // Determine the correct credentials for health check
      const username = process.env.ARANGO_USER || 'root';
      const password = process.env.ARANGO_PASS || process.env.ARANGO_ROOT_PASSWORD || 'atlas';

      console.log(`Checking ArangoDB health at ${arangoUrl}/_api/version`);

      // Use the base URL without database for the health check
      const baseUrl = arangoUrl.replace(/\/_db\/[^\/]+/, '');
      console.log(`Using base URL for health check: ${baseUrl}`);

      const response = await fetch(`${baseUrl}/_api/version`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.log(`ArangoDB health check failed with status ${response.status}, using mock service`);
        useMockService = true;
        return arangoInstance = new Database(); // Return a dummy instance
      }

      const data = await response.json();
      console.log(`ArangoDB health check successful: ${JSON.stringify(data)}`);
    } catch (error) {
      console.log('ArangoDB is not available, using mock service:', error);
      useMockService = true;
      return arangoInstance = new Database(); // Return a dummy instance
    }

    // Determine the correct credentials based on environment
    const username = process.env.ARANGO_USER || 'root';
    let password = process.env.ARANGO_PASS || process.env.ARANGO_ROOT_PASSWORD || 'atlas';

    // In production, prefer ARANGO_PASSWORD over ARANGO_ROOT_PASSWORD for the application user
    if (process.env.NODE_ENV === 'production' && process.env.ARANGO_PASSWORD) {
      password = process.env.ARANGO_PASSWORD;
      console.log(`Using production credentials for ArangoDB user: ${username}`);
    }

    console.log(`Using ArangoDB credentials: ${username}:${password.substring(0, 1)}${'*'.repeat(password.length - 1)}`);

    // Create a database connection to the system database first
    const systemDb = new Database({
      url: arangoUrl.replace(/\/_db\/[^\/]+/, ''),
      auth: {
        username: username,
        password: password,
      },
      databaseName: '_system',
    });

    // Check if the database exists
    try {
      const databases = await systemDb.listDatabases();
      const dbExists = databases.includes(dbName);

      if (!dbExists) {
        console.log(`Creating database: ${dbName}`);
        await systemDb.createDatabase(dbName);
        console.log(`Database ${dbName} created successfully`);
      } else {
        console.log(`Database ${dbName} already exists`);
      }
    } catch (error) {
      console.error('Error checking/creating database:', error);
    }

    // Now create a connection to the application database
    const db = new Database({
      url: arangoUrl.replace(/\/_db\/[^\/]+/, ''),
      auth: {
        username: username,
        password: password,
      },
      databaseName: dbName,
    });

    // Test the connection
    const info = await db.version();
    console.log(`Connected to ArangoDB version: ${info.version}`);

    // Test the connection to make sure we have access
    try {
      await db.get();
      console.log(`Successfully connected to database: ${db.name}`);

      // Store the database instance
      arangoInstance = db;
      return db;
    } catch (error) {
      console.log(`Error with database ${db.name}:`, error);
      console.log('Falling back to _system database');

      // Connect to _system database as fallback
      arangoInstance = systemDb;
      return systemDb;
    }

    return db;
  } catch (error) {
    console.error('Error connecting to ArangoDB:', error);
    console.log('Using mock ArangoDB service');
    useMockService = true;
    return arangoInstance = new Database(); // Return a dummy instance
  }
}

/**
 * Get the ArangoDB database instance
 * @returns ArangoDB database instance
 */
export async function getArangoDB(): Promise<Database> {
  if (!arangoInstance) {
    return initArangoDB();
  }
  return arangoInstance;
}

/**
 * Execute an AQL query
 * @param query AQL query string or template literal
 * @param bindVars Variables to bind to the query
 * @returns Query result
 */
export async function query(query: unknown, bindVars?: Record<string, any>): Promise<any> {
  const db = await getArangoDB();
  try {
    if (useMockService) {
      return mockArangoDB.query();
    }
    const cursor = await db.query(query, bindVars);
    return await cursor.all();
  } catch (error) {
    console.error('Error executing ArangoDB query:', error);
    return mockArangoDB.query();
  }
}

/**
 * Create a collection if it doesn't exist
 * @param name Collection name
 * @param type Collection type (document or edge)
 * @returns Created or existing collection
 */
export async function ensureCollection(name: string, type: 'document' | 'edge' = 'document'): Promise<any> {
  const db = await getArangoDB();
  try {
    if (useMockService) {
      return type === 'document'
        ? mockArangoDB.collection()
        : mockArangoDB.edgeCollection();
    }

    // In arangojs 7+, there's no separate edgeCollection method
    // We use the regular collection method with the type parameter
    console.log(`Creating ${type} collection: ${name}`);
    const collection = db.collection(name);

    try {
      const info = await collection.get();
      console.log(`Collection ${name} already exists`);
      return collection;
    } catch (err) {
      // Collection doesn't exist, create it
      await collection.create({ type: type === 'edge' ? 3 : 2 });
      console.log(`Created ${type} collection: ${name}`);
      return collection;
    }
  } catch (error) {
    console.error(`Error creating collection ${name}:`, error);
    return type === 'document'
      ? mockArangoDB.collection()
      : mockArangoDB.edgeCollection();
  }
}

/**
 * Create a graph if it doesn't exist
 * @param name Graph name
 * @param edgeDefinitions Edge definitions for the graph
 * @returns Created or existing graph
 */
export async function ensureGraph(
  name: string,
  edgeDefinitions: Array<{
    collection: string;
    from: string[];
    to: string[];
  }>
): Promise<any> {
  const db = await getArangoDB();
  try {
    if (useMockService) {
      return mockArangoDB.graph();
    }

    console.log(`Creating graph: ${name}`);

    // Make sure edgeDefinitions is an array
    if (!Array.isArray(edgeDefinitions)) {
      console.error('Edge definitions must be an array');
      return mockArangoDB.graph();
    }

    // Get the graph object
    const graph = db.graph(name);

    try {
      // Check if the graph exists
      await graph.get();
      console.log(`Graph ${name} already exists`);
      return graph;
    } catch (err) {
      // Graph doesn't exist, create it
      // Create a valid edge definition manually since map is causing issues
      const validEdgeDefinitions = [];
      for (let i = 0; i < edgeDefinitions.length; i++) {
        const def = edgeDefinitions[i];
        validEdgeDefinitions.push({
          collection: def.collection,
          from: Array.isArray(def.from) ? def.from : [def.from],
          to: Array.isArray(def.to) ? def.to : [def.to]
        });
      }

      // In arangojs 7+, the first argument should be the edge definitions array
      await graph.create(validEdgeDefinitions);
      console.log(`Created graph: ${name}`);
      return graph;
    }
  } catch (error) {
    console.error(`Error creating graph ${name}:`, error);
    return mockArangoDB.graph();
  }
}

// Export aql for convenience
export { aql };

// Export default object with all functions
const defaultExport = {
  initArangoDB,
  getArangoDB,
  query,
  ensureCollection,
  ensureGraph,
  aql,
};
export default defaultExport;;
