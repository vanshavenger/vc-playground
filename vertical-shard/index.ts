import ZooKeeper from 'node-zookeeper-client'
import mysql from 'mysql2/promise'
import { config } from './config'
import express from 'express'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'

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

const execAsync = promisify(exec)

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
        INSERT INTO table1 (name) VALUES 
        ('record_1'),
        ('record_2'),
        ('record_3')
      `)

    await db1.query(`
        INSERT INTO table2 (value, checksum) VALUES 
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
    console.log('DB2 initialized (empty)')

    await db1.end()
    await db2.end()

    return true
  } catch (error) {
    console.error('Error initializing databases:', error)
    return false
  }
}

async function setupZooKeeper(useDB2ForTable2 = false) {
  return new Promise((resolve, reject) => {
    const zkClient = ZooKeeper.createClient(config.zookeeper.connectionString)
    zkClient.once('connected', async () => {
      const configExists = await new Promise(resolve => {
        zkClient.exists(config.zookeeper.configPath, (error, stat) => {
          if (error) {
            console.error('Error checking Zookeeper path:', error)
            resolve(false)
          } else {
            resolve(!!stat)
          }
        })
      })
      if (!configExists) {
        await new Promise((resolve, reject) => {
          zkClient.mkdirp(config.zookeeper.configPath, (error, path) => {
            if (error) {
              reject(error)
            } else {
              resolve(path)
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
          database: useDB2ForTable2 ? config.db2.database : config.db1.database,
        },
        lastUpdated: new Date().toISOString(),
      }

      await new Promise((resolve, reject) => {
        zkClient.setData(
          config.zookeeper.configPath,
          Buffer.from(JSON.stringify(shardingConfig)),
          error => {
            if (error) {
              reject(error)
            } else {
              resolve(true)
            }
          }
        )
      })

      zkClient.close()
    })
  })
}

async function startSimpleApiServer() {
  const app = express()
  const port = 3000

  app.use(async (req, res, next) => {
    try {
      const client = ZooKeeper.createClient(config.zookeeper.connectionString)

      client.once('connected', async () => {
        try {
          const data = await new Promise((resolve, reject) => {
            client.getData(config.zookeeper.configPath, (error, data) => {
              if (error) {
                reject(error)
              } else {
                resolve(data)
              }
            })
          })

          req.shardingConfig = JSON.parse(data.toString())
          client.close()
          next()
        } catch (error) {
          client.close()
          res.status(500).json({ error: 'Failed to get configuration' })
        }
      })

      client.connect()
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
      res.status(500).json({ error: 'Failed to query Table 2' })
    }
  })

  app.get('/config', async (req, res) => {
    try {
      res.json(req.body.shardingConfig)
    } catch (error) {
      res.status(500).json({ error: 'Failed to get configuration' })
    }
  })

  app.listen(port, () => {})
}

const main = async () => {
  const dbsInitialized = await initializeDatabases()
  if (!dbsInitialized) {
    throw new Error('Failed to initialize databases')
  }

  await setupZooKeeper(false)
  await startSimpleApiServer()
}

main()
