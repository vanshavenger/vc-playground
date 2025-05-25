import { exec } from 'child_process'
import { promisify } from 'util'

interface DatabaseConfig {
  host: string
  user: string
  password: string
  database: string
  port: number
}

interface ZookeeperConfig {
  connectionString: string
  configPath: string
}

interface ReplicationConfig {
  maxRetries: number
  retryInterval: number
  syncTimeout: number
  maxAllowedLag: number
}

interface Config {
  db1: DatabaseConfig
  db2: DatabaseConfig
  zookeeper: ZookeeperConfig
  replication: ReplicationConfig
}

export const config: Config = {
  db1: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'db1',
    port: 3306,
  },
  db2: {
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'db2',
    port: 3307,
  },
  zookeeper: {
    connectionString: 'localhost:2181',
    configPath: '/sharding/config',
  },
  replication: {
    maxRetries: 5,
    retryInterval: 2000,
    syncTimeout: 30000,
    maxAllowedLag: 1,
  },
}

export const EXPRESS_APP_PORT = 3000

export interface SlaveStatus {
  Slave_IO_Running: string
  Slave_SQL_Running: string
  Seconds_Behind_Master: number | null
  Last_IO_Error: string
  Last_SQL_Error: string
}

export interface MasterStatus {
  File: string
  Position: number
}

export interface ChecksumResult {
  Checksum: number
}

export interface CountResult {
  count: number
}

export const execAsync = promisify(exec)
