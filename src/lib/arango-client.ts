import { Database, aql } from 'arangojs';

// Singleton instance
let arangoInstance: Database | null = null;

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
    
    // Create a new database connection
    const db = new Database({
      url: process.env.ARANGO_URL || 'http://localhost:8529',
      auth: {
        username: process.env.ARANGO_USER || 'root',
        password: process.env.ARANGO_PASS || 'atlas',
      },
      databaseName: process.env.ARANGO_DB || 'atlas_knowledge',
    });

    // Test the connection
    const info = await db.version();
    console.log(`Connected to ArangoDB version: ${info.version}`);
    
    // Create database if it doesn't exist
    const dbExists = await db.exists();
    if (!dbExists) {
      console.log(`Creating database: ${process.env.ARANGO_DB || 'atlas_knowledge'}`);
      await db.createDatabase(process.env.ARANGO_DB || 'atlas_knowledge');
    }
    
    // Store the instance
    arangoInstance = db;
    
    return db;
  } catch (error) {
    console.error('Error connecting to ArangoDB:', error);
    throw error;
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
export async function query(query: any, bindVars?: Record<string, any>): Promise<any> {
  const db = await getArangoDB();
  try {
    const cursor = await db.query(query, bindVars);
    return await cursor.all();
  } catch (error) {
    console.error('Error executing ArangoDB query:', error);
    throw error;
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
    const collection = type === 'document' 
      ? db.collection(name) 
      : db.edgeCollection(name);
    
    const exists = await collection.exists();
    if (!exists) {
      console.log(`Creating ${type} collection: ${name}`);
      await collection.create();
    }
    
    return collection;
  } catch (error) {
    console.error(`Error creating collection ${name}:`, error);
    throw error;
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
    const graph = db.graph(name);
    
    const exists = await graph.exists();
    if (!exists) {
      console.log(`Creating graph: ${name}`);
      await graph.create({ edgeDefinitions });
    }
    
    return graph;
  } catch (error) {
    console.error(`Error creating graph ${name}:`, error);
    throw error;
  }
}

// Export aql for convenience
export { aql };

// Export default object with all functions
export default {
  initArangoDB,
  getArangoDB,
  query,
  ensureCollection,
  ensureGraph,
  aql,
};
