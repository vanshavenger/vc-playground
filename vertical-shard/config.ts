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
