/**
 * Database Schema Initialization Script for Atlas-ERP
 *
 * This script initializes the database schema for both SurrealDB and ArangoDB.
 * It creates the necessary tables, collections, indexes, and relationships.
 *
 * Usage:
 * 1. Make sure SurrealDB and ArangoDB are running
 * 2. Run this script with Node.js:
 *    node scripts/init-db-schema.js
 */

const { Surreal } = require('surrealdb');
const { Database } = require('arangojs');

async function initializeSurrealDBSchema() {
  try {
    // Connect to SurrealDB
    const db = new Surreal();

    const url = process.env.SURREAL_URL || 'http://localhost:8000';
    const ns = process.env.SURREAL_NS || 'atlas';
    const database = process.env.SURREAL_DB || 'erp';
    const username = process.env.SURREAL_USER || 'root';
    const password = process.env.SURREAL_PASS || 'root';

    console.log(`Connecting to SurrealDB at ${url}`);

    await db.connect(url + '/rpc', {
      namespace: ns,
      database: database,
      auth: {
        username: username,
        password: password,
      },
    });

    console.log('Connected to SurrealDB');

    // Define schema for knowledge graph

    // Knowledge nodes table
    await db.query(`
      DEFINE TABLE knowledge_nodes SCHEMAFULL;

      DEFINE FIELD id ON knowledge_nodes TYPE string;
      DEFINE FIELD type ON knowledge_nodes TYPE string;
      DEFINE FIELD name ON knowledge_nodes TYPE string;
      DEFINE FIELD content ON knowledge_nodes TYPE string;
      DEFINE FIELD metadata ON knowledge_nodes TYPE object OPTIONAL;
      DEFINE FIELD embedding ON knowledge_nodes TYPE array OPTIONAL;
      DEFINE FIELD createdAt ON knowledge_nodes TYPE datetime;
      DEFINE FIELD updatedAt ON knowledge_nodes TYPE datetime;

      DEFINE INDEX knowledge_nodes_type ON knowledge_nodes FIELDS type;
      DEFINE INDEX knowledge_nodes_name ON knowledge_nodes FIELDS name;
    `);

    console.log('Created knowledge_nodes table');

    // Knowledge edges table
    await db.query(`
      DEFINE TABLE knowledge_edges SCHEMAFULL;

      DEFINE FIELD id ON knowledge_edges TYPE string;
      DEFINE FIELD type ON knowledge_edges TYPE string;
      DEFINE FIELD source ON knowledge_edges TYPE string;
      DEFINE FIELD target ON knowledge_edges TYPE string;
      DEFINE FIELD weight ON knowledge_edges TYPE float DEFAULT 1.0;
      DEFINE FIELD metadata ON knowledge_edges TYPE object OPTIONAL;
      DEFINE FIELD createdAt ON knowledge_edges TYPE datetime;

      DEFINE INDEX knowledge_edges_type ON knowledge_edges FIELDS type;
      DEFINE INDEX knowledge_edges_source ON knowledge_edges FIELDS source;
      DEFINE INDEX knowledge_edges_target ON knowledge_edges FIELDS target;
    `);

    console.log('Created knowledge_edges table');

    // Define schema for workflows

    // Workflows table
    await db.query(`
      DEFINE TABLE workflows SCHEMAFULL;

      DEFINE FIELD id ON workflows TYPE string;
      DEFINE FIELD name ON workflows TYPE string;
      DEFINE FIELD description ON workflows TYPE string;
      DEFINE FIELD status ON workflows TYPE string;
      DEFINE FIELD nodes ON workflows TYPE array;
      DEFINE FIELD edges ON workflows TYPE array;
      DEFINE FIELD config ON workflows TYPE object OPTIONAL;
      DEFINE FIELD createdAt ON workflows TYPE datetime;
      DEFINE FIELD updatedAt ON workflows TYPE datetime;

      DEFINE INDEX workflows_name ON workflows FIELDS name;
      DEFINE INDEX workflows_status ON workflows FIELDS status;
    `);

    console.log('Created workflows table');

    // Workflow executions table
    await db.query(`
      DEFINE TABLE workflow_executions SCHEMAFULL;

      DEFINE FIELD workflowId ON workflow_executions TYPE string;
      DEFINE FIELD executionId ON workflow_executions TYPE string;
      DEFINE FIELD status ON workflow_executions TYPE string;
      DEFINE FIELD currentNodeId ON workflow_executions TYPE string OPTIONAL;
      DEFINE FIELD input ON workflow_executions TYPE object;
      DEFINE FIELD output ON workflow_executions TYPE object OPTIONAL;
      DEFINE FIELD logs ON workflow_executions TYPE array;
      DEFINE FIELD startedAt ON workflow_executions TYPE datetime;
      DEFINE FIELD completedAt ON workflow_executions TYPE datetime OPTIONAL;

      DEFINE INDEX workflow_executions_workflow_id ON workflow_executions FIELDS workflowId;
      DEFINE INDEX workflow_executions_status ON workflow_executions FIELDS status;
    `);

    console.log('Created workflow_executions table');

    // Define schema for agents (if not already defined)
    await db.query(`
      DEFINE TABLE agents SCHEMAFULL;

      DEFINE FIELD id ON agents TYPE string;
      DEFINE FIELD name ON agents TYPE string;
      DEFINE FIELD description ON agents TYPE string;
      DEFINE FIELD status ON agents TYPE string;
      DEFINE FIELD lastRun ON agents TYPE datetime OPTIONAL;
      DEFINE FIELD capabilities ON agents TYPE array;
      DEFINE FIELD systemPrompt ON agents TYPE string;
      DEFINE FIELD model ON agents TYPE string OPTIONAL;

      DEFINE INDEX agents_name ON agents FIELDS name;
      DEFINE INDEX agents_status ON agents FIELDS status;
    `);

    console.log('Created agents table');

    console.log('SurrealDB schema initialization completed successfully');

    // Close the connection
    await db.close();
  } catch (error) {
    console.error('Error initializing SurrealDB schema:', error);
    throw error;
  }
}

async function initializeArangoDB() {
  try {
    console.log('Initializing ArangoDB schema...');

    const url = process.env.ARANGO_URL || 'http://localhost:8529';
    const dbName = process.env.ARANGO_DB || 'atlas_knowledge';
    const username = process.env.ARANGO_USER || 'root';
    const password = process.env.ARANGO_PASS || 'atlas';

    console.log(`Connecting to ArangoDB at ${url}`);

    // Connect to ArangoDB
    const db = new Database({
      url: url,
      auth: {
        username: username,
        password: password,
      },
    });

    // Create database if it doesn't exist
    const databaseExists = await db.listDatabases().then(dbs => dbs.includes(dbName));
    if (!databaseExists) {
      await db.createDatabase(dbName);
      console.log(`Created database: ${dbName}`);
    }

    // Use the database
    db.useDatabase(dbName);

    // Define collections
    const collections = [
      { name: 'nodes', type: 'document' },
      { name: 'edges', type: 'edge' },
    ];

    for (const collection of collections) {
      const exists = await db.collection(collection.name).exists();
      if (!exists) {
        if (collection.type === 'edge') {
          await db.createEdgeCollection(collection.name);
        } else {
          await db.createCollection(collection.name);
        }
        console.log(`Created collection: ${collection.name}`);
      }
    }

    // Create indexes
    const nodesCollection = db.collection('nodes');

    // Check if index exists before creating
    const indexes = await nodesCollection.indexes();
    const hasTypeIndex = indexes.some(index =>
      index.type === 'persistent' &&
      index.fields.includes('type')
    );

    if (!hasTypeIndex) {
      await nodesCollection.ensureIndex({
        type: 'persistent',
        fields: ['type'],
      });
      console.log('Created index on nodes.type');
    }

    console.log('ArangoDB schema initialized successfully');
  } catch (error) {
    console.error('Error initializing ArangoDB schema:', error);
    throw error;
  }
}

async function main() {
  try {
    await initializeSurrealDBSchema();
    await initializeArangoDB();
    console.log('Database schema initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    process.exit(1);
  }
}

// Run the initialization
main();
