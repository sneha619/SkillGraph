import neo4j, { Driver, Session, ServerInfo } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

// CognoDB connection details from environment variables
const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;

if (!uri || !username || !password) {
  throw new Error(
    'Missing COGNODB_URI, COGNODB_USERNAME, or COGNODB_PASSWORD in .env'
  );
}

// TypeScript now knows these values are strings
const cognodbUri: string = uri;
const cognodbUsername: string = username;
const cognodbPassword: string = password;

let driver: Driver | null = null;

/**
 * Returns a singleton Neo4j driver connected to CognoDB
 */
export function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      cognodbUri,
      neo4j.auth.basic(cognodbUsername, cognodbPassword),
      {
        maxConnectionPoolSize: 50,
        connectionTimeout: 8000,
        maxTransactionRetryTime: 15000,
        logging: neo4j.logging.console('warn'),
      }
    );
  }

  return driver;
}

/**
 * Tests connection to CognoDB over Bolt
 */
export async function verifyConnection(): Promise<{
  connected: boolean;
  uri: string;
  serverAgent?: string;
  protocolVersion?: number;
  error?: string;
}> {
  try {
    const currentDriver = getDriver();

    const serverInfo: ServerInfo = await currentDriver.getServerInfo();

    return {
      connected: true,
      uri: cognodbUri,
      serverAgent: serverInfo.agent || 'CognoDB Bolt Engine',
      protocolVersion: serverInfo.protocolVersion,
    };
  } catch (error: any) {
    return {
      connected: false,
      uri: cognodbUri,
      error:
        error.message || 'Unable to connect to CognoDB Bolt endpoint',
    };
  }
}

/**
 * Executes a parameterized read transaction against CognoDB
 */
export async function runReadQuery<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const currentDriver = getDriver();

  const session: Session = currentDriver.session();

  try {
    const result = await session.executeRead(async (tx) => {
      const res = await tx.run(cypher, params);

      return res.records.map((record) => {
        const obj: any = {};

        record.keys.forEach((key) => {
          const val = record.get(key);
          obj[key] = normalizeNeo4jValue(val);
        });

        return obj as T;
      });
    });

    return result;
  } finally {
    await session.close();
  }
}

/**
 * Executes a parameterized write transaction against CognoDB
 */
export async function runWriteQuery<T = any>(
  cypher: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const currentDriver = getDriver();

  const session: Session = currentDriver.session();

  try {
    const result = await session.executeWrite(async (tx) => {
      const res = await tx.run(cypher, params);

      return res.records.map((record) => {
        const obj: any = {};

        record.keys.forEach((key) => {
          const val = record.get(key);
          obj[key] = normalizeNeo4jValue(val);
        });

        return obj as T;
      });
    });

    return result;
  } finally {
    await session.close();
  }
}

/**
 * Converts Neo4j values to standard JavaScript values
 */
function normalizeNeo4jValue(val: any): any {
  if (val === null || val === undefined) {
    return null;
  }

  if (neo4j.isInt(val)) {
    return val.toNumber();
  }

  if (Array.isArray(val)) {
    return val.map(normalizeNeo4jValue);
  }

  if (typeof val === 'object') {
    if ('properties' in val) {
      return normalizeNeo4jValue(val.properties);
    }

    const normalized: Record<string, any> = {};

    for (const key of Object.keys(val)) {
      normalized[key] = normalizeNeo4jValue(val[key]);
    }

    return normalized;
  }

  return val;
}

/**
 * Closes the driver when the application shuts down
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}