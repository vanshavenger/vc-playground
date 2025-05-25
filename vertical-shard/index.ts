import ZooKeeper from 'node-zookeeper-client'
import mysql from 'mysql2/promise'
import { config, execAsync, EXPRESS_APP_PORT, type ChecksumResult, type CountResult, type MasterStatus, type SlaveStatus } from './config'
import express from 'express'
import crypto from 'crypto'
import { sleep } from 'bun'

declare global {
  namespace Express {
    interface Request {
      shardingConfig: {
        table1: {
          host: string
          port: number
          database: string
        }
        table2: {
          host: string
          port: number
          database: string
        }
        lastUpdated: string
      }
    }
  }
}

async function findMysqlDumpPath(): Promise<string | null> {
  const possiblePaths = [
    'mysqldump',
    '/usr/local/bin/mysqldump',
    '/usr/bin/mysqldump',
    '/opt/homebrew/bin/mysqldump',
    '/usr/local/mysql/bin/mysqldump',
    process.platform === 'win32' ? 'mysqldump.exe' : null,
  ].filter(Boolean) as string[]

  for (const path of possiblePaths) {
    try {
      await execAsync(`which ${path}`)
      return path
    } catch {
      try {
        await execAsync(`${path} --version`)
        return path
      } catch {
        continue
      }
    }
  }
  return null
}

async function setupReplicationWithoutDump() {
  try {
    console.log('Setting up replication using SQL-only approach...')

    const db1 = await mysql.createConnection({
      host: config.db1.host,
      user: config.db1.user,
      password: config.db1.password,
      database: config.db1.database,
      port: config.db1.port,
    })

    await db1.query(
      `CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED BY 'repl_password'`
    )
    await db1.query(
      `GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%'`
    )
    await db1.query(`GRANT SELECT, RELOAD, PROCESS ON *.* TO 'repl_user'@'%'`)
    await db1.query(`FLUSH PRIVILEGES`)

    const [variables] = await db1.query<mysql.RowDataPacket[]>(
      "SHOW VARIABLES LIKE 'log_bin'"
    )

    if (
      !Array.isArray(variables) ||
      !variables[0] ||
      variables[0].Value !== 'ON'
    ) {
      console.log('Binary logging not enabled, using direct data copy approach')

      const db2 = await mysql.createConnection({
        host: config.db2.host,
        user: config.db2.user,
        password: config.db2.password,
        database: config.db2.database,
        port: config.db2.port,
      })

      await db2.query(`
        CREATE TABLE IF NOT EXISTS table2 (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value VARCHAR(100),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          checksum VARCHAR(32)
        )
      `)

      const [data] = await db1.query('SELECT * FROM table2')

      if (Array.isArray(data) && data.length > 0) {
        console.log(`Copying ${data.length} records from DB1 to DB2...`)
        for (const row of data as any[]) {
          await db2.query(
            'INSERT IGNORE INTO table2 (id, value, updated_at, checksum) VALUES (?, ?, ?, ?)',
            [row.id, row.value, row.updated_at, row.checksum]
          )
        }
      }

      await db1.end()
      await db2.end()

      console.log('Data copied successfully using direct approach')
      return true
    }

    const [masterStatus] = await db1.query<mysql.RowDataPacket[]>(
      'SHOW MASTER STATUS'
    )

    if (!Array.isArray(masterStatus) || !masterStatus[0]) {
      console.log('No master status available, using direct copy')
      await db1.end()
      return await setupReplicationWithoutDump()
    }

    const { File: binlogFile, Position: binlogPosition } =
      masterStatus[0] as MasterStatus

    const db2 = await mysql.createConnection({
      host: config.db2.host,
      user: config.db2.user,
      password: config.db2.password,
      database: config.db2.database,
      port: config.db2.port,
    })

    await db2.query(`
      CREATE TABLE IF NOT EXISTS table2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        checksum VARCHAR(32)
      )
    `)

    await db1.query('FLUSH TABLES WITH READ LOCK')

    try {
      const [data] = await db1.query('SELECT * FROM table2')

      if (Array.isArray(data) && data.length > 0) {
        console.log(`Copying ${data.length} records for replication...`)
        for (const row of data as any[]) {
          await db2.query(
            'INSERT IGNORE INTO table2 (id, value, updated_at, checksum) VALUES (?, ?, ?, ?)',
            [row.id, row.value, row.updated_at, row.checksum]
          )
        }
      }
    } finally {
      await db1.query('UNLOCK TABLES')
    }

    await db2.query(`
      STOP SLAVE;
      CHANGE MASTER TO
        MASTER_HOST='${config.db1.host}',
        MASTER_PORT=${config.db1.port},
        MASTER_USER='repl_user',
        MASTER_PASSWORD='repl_password',
        MASTER_LOG_FILE='${binlogFile}',
        MASTER_LOG_POS=${binlogPosition},
        MASTER_CONNECT_RETRY=10;
      CHANGE REPLICATION FILTER REPLICATE_DO_TABLE = (${config.db1.database}.table2);
      START SLAVE;
    `)

    let retries = 0
    let replicationWorking = false

    while (retries < config.replication.maxRetries && !replicationWorking) {
      const [slaveStatus] = await db2.query<mysql.RowDataPacket[]>(
        'SHOW SLAVE STATUS'
      )
      if (!Array.isArray(slaveStatus) || !slaveStatus[0]) {
        break
      }
      const status = slaveStatus[0] as SlaveStatus

      if (
        status.Slave_IO_Running === 'Yes' &&
        status.Slave_SQL_Running === 'Yes'
      ) {
        replicationWorking = true
        console.log('Replication is working correctly')
      } else {
        console.log(`Replication attempt ${retries + 1}, waiting...`)
        retries++

        await sleep(config.replication.retryInterval)
      }
    }

    await db1.end()
    await db2.end()

    return replicationWorking
  } catch (error) {
    console.error('Error setting up replication without dump:', error)
    return false
  }
}

async function initializeDatabases() {
  console.log('Setting up databases...')

  try {
    const db1 = await mysql.createConnection({
      host: config.db1.host,
      user: config.db1.user,
      password: config.db1.password,
      port: config.db1.port,
    })

    await db1.query(`CREATE DATABASE IF NOT EXISTS ${config.db1.database}`)
    await db1.query(`USE ${config.db1.database}`)

    await db1.query(`
        CREATE TABLE IF NOT EXISTS table1 (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

    await db1.query(`
        CREATE TABLE IF NOT EXISTS table2 (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value VARCHAR(100),
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          checksum VARCHAR(32)
        )
      `)

    await db1.query(`
        INSERT IGNORE INTO table1 (name) VALUES 
        ('record_1'),
        ('record_2'),
        ('record_3')
      `)

    await db1.query(`
        INSERT IGNORE INTO table2 (value, checksum) VALUES 
        ('initial_value_1', MD5('initial_value_1')),
        ('initial_value_2', MD5('initial_value_2')),
        ('initial_value_3', MD5('initial_value_3'))
      `)

    console.log('DB1 initialized with 2 tables and sample data')

    const db2 = await mysql.createConnection({
      host: config.db2.host,
      user: config.db2.user,
      password: config.db2.password,
      port: config.db2.port,
    })

    await db2.query(`CREATE DATABASE IF NOT EXISTS ${config.db2.database}`)
    await db2.query(`USE ${config.db2.database}`)

    console.log('DB2 initialized')

    await db1.end()
    await db2.end()

    return true
  } catch (error) {
    console.error('Error initializing databases:', error)
    return false
  }
}

async function setupZooKeeper(useDB2ForTable2 = false) {
  return new Promise<boolean>((resolve, reject) => {
    const zkClient = ZooKeeper.createClient(config.zookeeper.connectionString, {
      sessionTimeout: 30000,
      spinDelay: 1000,
      retries: 3,
    })

    let connectionTimeout: NodeJS.Timeout

    connectionTimeout = setTimeout(() => {
      console.error('ZooKeeper connection timeout after 30 seconds')
      zkClient.close()
      reject(new Error('ZooKeeper connection timeout'))
    }, 30000)

    zkClient.once('connected', async () => {
      clearTimeout(connectionTimeout)
      console.log('Connected to ZooKeeper')

      try {
        const configExists = await new Promise<boolean>((resolve, reject) => {
          zkClient.exists(config.zookeeper.configPath, (error, stat) => {
            if (error) {
              console.error('Error checking ZooKeeper path:', error)
              reject(error)
            } else {
              resolve(!!stat)
            }
          })
        })

        if (!configExists) {
          console.log('Creating config path:', config.zookeeper.configPath)
          await new Promise<string>((resolve, reject) => {
            zkClient.mkdirp(config.zookeeper.configPath, (error, path) => {
              if (error) {
                console.error('Error creating path:', error)
                reject(error)
              } else {
                console.log('Created path:', path)
                resolve(path!)
              }
            })
          })
        }

        const shardingConfig = {
          table1: {
            host: config.db1.host,
            port: config.db1.port,
            database: config.db1.database,
          },
          table2: {
            host: useDB2ForTable2 ? config.db2.host : config.db1.host,
            port: useDB2ForTable2 ? config.db2.port : config.db1.port,
            database: useDB2ForTable2
              ? config.db2.database
              : config.db1.database,
          },
          lastUpdated: new Date().toISOString(),
        }

        await new Promise<boolean>((resolve, reject) => {
          zkClient.setData(
            config.zookeeper.configPath,
            Buffer.from(JSON.stringify(shardingConfig)),
            error => {
              if (error) {
                console.error('Error setting data:', error)
                reject(error)
              } else {
                console.log('Successfully set ZooKeeper data')
                resolve(true)
              }
            }
          )
        })

        resolve(true)
      } catch (error) {
        console.error('Error in ZooKeeper setup:', error)
        reject(error)
      } finally {
        zkClient.close()
      }
    })

    zkClient.on('disconnected', () => {
      console.log('Disconnected from ZooKeeper')
    })

    zkClient.on('expired', () => {
      console.log('ZooKeeper session expired')
    })

    console.log(
      'Attempting to connect to ZooKeeper at:',
      config.zookeeper.connectionString
    )
    zkClient.connect()
  })
}

async function startSimpleApiServer() {
  const app = express()

  app.use(express.json())

  app.use(async (req, res, next) => {
    try {
      const client = ZooKeeper.createClient(config.zookeeper.connectionString)

      const configPromise = new Promise<any>((resolve, reject) => {
        client.once('connected', async () => {
          try {
            const data = await new Promise<Buffer>((resolve, reject) => {
              client.getData(config.zookeeper.configPath, (error, data) => {
                if (error) {
                  reject(error)
                } else {
                  resolve(data as Buffer)
                }
              })
            })

            const shardingConfig = JSON.parse(data.toString())
            client.close()
            resolve(shardingConfig)
          } catch (error) {
            client.close()
            reject(error)
          }
        })

        client.connect()
      })

      req.shardingConfig = await configPromise
      next()
    } catch (error) {
      res.status(500).json({ error: 'Failed to connect to ZooKeeper' })
    }
  })

  app.get('/table1', async (req, res) => {
    try {
      const table1Config = req.shardingConfig.table1

      const connection = await mysql.createConnection({
        host: table1Config.host,
        user: config.db1.user,
        password: config.db1.password,
        database: table1Config.database,
        port: table1Config.port,
      })

      const [rows] = await connection.query('SELECT * FROM table1')
      await connection.end()

      res.json({
        source: `${table1Config.host}:${table1Config.port}/${table1Config.database}`,
        data: rows,
      })
    } catch (error) {
      res.status(500).json({ error: 'Failed to query Table 1' })
    }
  })

  app.get('/table2', async (req, res) => {
    try {
      const table2Config = req.shardingConfig.table2

      const connection = await mysql.createConnection({
        host: table2Config.host,
        user:
          table2Config.host === config.db1.host
            ? config.db1.user
            : config.db2.user,
        password:
          table2Config.host === config.db1.host
            ? config.db1.password
            : config.db2.password,
        database: table2Config.database,
        port: table2Config.port,
      })

      const [rows] = await connection.query('SELECT * FROM table2')

      await connection.end()

      res.json({
        source: `${table2Config.host}:${table2Config.port}/${table2Config.database}`,
        data: rows,
      })
    } catch (error) {
      console.error('Error querying Table 2:', error)
      res.status(500).json({ error: 'Failed to query Table 2' })
    }
  })

  app.get('/config', async (req, res) => {
    try {
      res.json(req.shardingConfig)
    } catch (error) {
      res.status(500).json({ error: 'Failed to get configuration' })
    }
  })

  app.listen(EXPRESS_APP_PORT, () => {
    console.log(`API server running on port ${EXPRESS_APP_PORT}`)
  })
}

async function moveTable2ToDB2() {
  try {
    const db1 = await mysql.createConnection({
      host: config.db1.host,
      user: config.db1.user,
      password: config.db1.password,
      database: config.db1.database,
      port: config.db1.port,
    })

    const db2 = await mysql.createConnection({
      host: config.db2.host,
      user: config.db2.user,
      password: config.db2.password,
      database: config.db2.database,
      port: config.db2.port,
    })

    await db2.query(`
      CREATE TABLE IF NOT EXISTS table2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        checksum VARCHAR(32)
      )
    `)

    const [data] = await db1.query('SELECT * FROM table2')

    if (Array.isArray(data) && data.length > 0) {
      for (const row of data as any[]) {
        await db2.query(
          'INSERT IGNORE INTO table2 (id, value, updated_at, checksum) VALUES (?, ?, ?, ?)',
          [row.id, row.value, row.updated_at, row.checksum]
        )
      }
    }

    await db1.query('DROP TABLE table2')

    await db1.end()
    await db2.end()
    return true
  } catch (error) {
    console.error('Error moving table2:', error)
    return false
  }
}

async function setupReplication() {
  try {
    const mysqldumpPath = await findMysqlDumpPath()

    if (!mysqldumpPath) {
      console.log('mysqldump not found, using alternative replication setup')
      return await setupReplicationWithoutDump()
    }

    console.log(`Found mysqldump at: ${mysqldumpPath}`)

    const db1 = await mysql.createConnection({
      host: config.db1.host,
      user: config.db1.user,
      password: config.db1.password,
      database: config.db1.database,
      port: config.db1.port,
    })

    await db1.query(
      `CREATE USER IF NOT EXISTS 'repl_user'@'%' IDENTIFIED BY 'repl_password'`
    )
    await db1.query(
      `GRANT REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'repl_user'@'%'`
    )
    await db1.query(`GRANT SELECT, RELOAD, PROCESS ON *.* TO 'repl_user'@'%'`)
    await db1.query(`FLUSH PRIVILEGES`)

    const [variables] = await db1.query<mysql.RowDataPacket[]>(
      "SHOW VARIABLES LIKE 'log_bin'"
    )

    if (
      !Array.isArray(variables) ||
      !variables[0] ||
      variables[0].Value !== 'ON'
    ) {
      console.log('Binary logging not enabled, using alternative approach')
      await db1.end()
      return await setupReplicationWithoutDump()
    }

    try {
      const [binlogResult] = await db1.query<mysql.RowDataPacket[]>(
        'SHOW BINARY LOG STATUS'
      )
      if (!Array.isArray(binlogResult) || !binlogResult[0]) {
        await db1.end()
        return await setupReplicationWithoutDump()
      }
    } catch (error) {
      console.error('Error getting master status:', error)
      await db1.end()
      return await setupReplicationWithoutDump()
    }

    await execAsync(
      `${mysqldumpPath} -h ${config.db1.host} -P ${config.db1.port} -u ${config.db1.user} -p${config.db1.password} --master-data=2 --single-transaction --flush-logs ${config.db1.database} table2 > table2_dump.sql`
    )

    try {
      const dumpContent = await execAsync(
        'head -n 50 table2_dump.sql | grep "CHANGE MASTER"'
      )
      const match = dumpContent.stdout.match(
        /MASTER_LOG_FILE='([^']+)', MASTER_LOG_POS=(\d+)/
      )

      if (!match || !match[1] || !match[2]) {
        console.error('Failed to extract binlog file and position from dump')
        await db1.end()
        return await setupReplicationWithoutDump()
      }

      const dumpBinlogFile = match[1]
      const dumpBinlogPosition = parseInt(match[2], 10)

      await execAsync(
        `mysql -h ${config.db2.host} -P ${config.db2.port} -u ${config.db2.user} -p${config.db2.password} ${config.db2.database} < table2_dump.sql`
      )

      const db2 = await mysql.createConnection({
        host: config.db2.host,
        user: config.db2.user,
        password: config.db2.password,
        database: config.db2.database,
        port: config.db2.port,
      })

      await db2.query(`
        STOP SLAVE;
        CHANGE MASTER TO
          MASTER_HOST='${config.db1.host}',
          MASTER_PORT=${config.db1.port},
          MASTER_USER='repl_user',
          MASTER_PASSWORD='repl_password',
          MASTER_LOG_FILE='${dumpBinlogFile}',
          MASTER_LOG_POS=${dumpBinlogPosition},
          MASTER_CONNECT_RETRY=10;
        CHANGE REPLICATION FILTER REPLICATE_DO_TABLE = (${config.db1.database}.table2);
        START SLAVE;
      `)

      let retries = 0
      let replicationWorking = false

      while (retries < config.replication.maxRetries && !replicationWorking) {
        const [slaveStatus] = await db2.query<mysql.RowDataPacket[]>(
          'SHOW SLAVE STATUS'
        )
        if (!Array.isArray(slaveStatus) || !slaveStatus[0]) {
          break
        }
        const status = slaveStatus[0] as SlaveStatus

        if (
          status.Slave_IO_Running === 'Yes' &&
          status.Slave_SQL_Running === 'Yes'
        ) {
          replicationWorking = true
        } else {
          retries++
          await sleep(config.replication.retryInterval)
        }
      }

      await db1.end()
      await db2.end()

      return replicationWorking
    } catch (grepError) {
      console.log(
        'No binlog position found in dump, using alternative approach'
      )
      await db1.end()
      return await setupReplicationWithoutDump()
    }
  } catch (error) {
    console.error('Error setting up replication:', error)
    return await setupReplicationWithoutDump()
  }
}

async function simulateApplication() {
  const db1 = await mysql.createConnection({
    host: config.db1.host,
    user: config.db1.user,
    password: config.db1.password,
    database: config.db1.database,
    port: config.db1.port,
  })

  let counter = 0

  const interval = setInterval(async () => {
    try {
      counter++
      const value = `value_${Date.now()}`
      const checksum = crypto.createHash('md5').update(value).digest('hex')

      await db1.query('INSERT INTO table2 (value, checksum) VALUES (?, ?)', [
        value,
        checksum,
      ])

      if (counter >= 10) {
        clearInterval(interval)
        await db1.end()
      }
    } catch (error) {
      console.error('Error in simulation:', error)
      clearInterval(interval)
      await db1.end()
    }
  }, 500)
}

async function waitForReplicationSync() {
  try {
    const db2 = await mysql.createConnection({
      host: config.db2.host,
      user: config.db2.user,
      password: config.db2.password,
      database: config.db2.database,
      port: config.db2.port,
    })

    const startTime = Date.now()
    let synced = false

    while (!synced && Date.now() - startTime < config.replication.syncTimeout) {
      const [slaveStatus] = await db2.query<mysql.RowDataPacket[]>(
        'SHOW SLAVE STATUS'
      )
      if (!Array.isArray(slaveStatus) || !slaveStatus[0]) {
        break
      }
      const status = slaveStatus[0] as SlaveStatus

      if (
        status.Slave_IO_Running === 'Yes' &&
        status.Slave_SQL_Running === 'Yes' &&
        (status.Seconds_Behind_Master || 0) <= config.replication.maxAllowedLag
      ) {
        synced = true
      } else {
        await sleep(1000)
      }
    }

    await db2.end()
    return synced
  } catch (error) {
    console.error('Error waiting for replication sync:', error)
    return false
  }
}

async function verifyDataConsistency() {
  try {
    const db1 = await mysql.createConnection({
      host: config.db1.host,
      user: config.db1.user,
      password: config.db1.password,
      database: config.db1.database,
      port: config.db1.port,
    })

    const db2 = await mysql.createConnection({
      host: config.db2.host,
      user: config.db2.user,
      password: config.db2.password,
      database: config.db2.database,
      port: config.db2.port,
    })

    const [db1Count] = await db1.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM table2'
    )
    const [db2Count] = await db2.query<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM table2'
    )

    process.stdout.write(`Verifying data consistency between DB1 and DB2... `)

    if (
      !Array.isArray(db1Count) ||
      !Array.isArray(db2Count) ||
      !db1Count[0] ||
      !db2Count[0]
    ) {
      await db1.end()
      await db2.end()
      return false
    }

    console.log(
      `DB1 Count: ${JSON.stringify(db1Count[0])}, DB2 Count: ${JSON.stringify(
        db2Count[0]
      )}`
    )

    const count1 = (db1Count[0] as CountResult).count
    const count2 = (db2Count[0] as CountResult).count

    if (count1 !== count2) {
      console.log(`Count mismatch: DB1=${count1}, DB2=${count2}`)
      await db1.end()
      await db2.end()
      return false
    }

    const [db1Checksum] = await db1.query<mysql.RowDataPacket[]>(
      'CHECKSUM TABLE table2'
    )
    const [db2Checksum] = await db2.query<mysql.RowDataPacket[]>(
      'CHECKSUM TABLE table2'
    )

    if (
      !Array.isArray(db1Checksum) ||
      !Array.isArray(db2Checksum) ||
      !db1Checksum[0] ||
      !db2Checksum[0]
    ) {
      await db1.end()
      await db2.end()
      return false
    }

    const checksum1 = (db1Checksum[0] as ChecksumResult).Checksum
    const checksum2 = (db2Checksum[0] as ChecksumResult).Checksum

    await db1.end()
    await db2.end()

    console.log(
      `Data consistency check: DB1 checksum=${checksum1}, DB2 checksum=${checksum2}`
    )
    return checksum1 === checksum2
  } catch (error) {
    console.error('Error verifying data consistency:', error)
    return false
  }
}

const main = async () => {
  try {
    const dbsInitialized = await initializeDatabases()
    if (!dbsInitialized) {
      throw new Error('Failed to initialize databases')
    }

    await setupZooKeeper(false)

    await startSimpleApiServer()

    await simulateApplication()

    await sleep(6000)
    const db2 = await mysql.createConnection({
      host: config.db2.host,
      user: config.db2.user,
      password: config.db2.password,
      database: config.db2.database,
      port: config.db2.port,
    })

    await db2.query(`
      CREATE TABLE IF NOT EXISTS table2 (
        id INT AUTO_INCREMENT PRIMARY KEY,
        value VARCHAR(100),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        checksum VARCHAR(32)
      )
    `)
    await db2.end() // Done

    const replicationSetup = await setupReplication()
    if (!replicationSetup) {
      console.log(
        'Replication setup failed, but continuing with direct data sync...'
      )
    } else {
      console.log('Replication setup successful')
    }

    if (replicationSetup) {
      const synced = await waitForReplicationSync()
      if (!synced) {
        console.log('Replication sync timeout, but continuing...')
      } else {
        console.log('Replication synchronized successfully')
      }
    }

    const isConsistent = await verifyDataConsistency()
    if (!isConsistent) {
      console.log(
        'Data inconsistency detected, but continuing with migration...'
      )
    } else {
      console.log('Data consistency verified')
    }
    const moved = await moveTable2ToDB2() // can be better as we have single insert query - fallback
    if (!moved) {
      throw new Error('Failed to move table2 to DB2')
    }

    await setupZooKeeper(true)
  } catch (error) {
    console.error('Error in main:', error)
    process.exit(1)
  }
}

main()
