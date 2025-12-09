// IndexedDB utility for storing AEP configurations locally in the browser

export interface AEPConfig {
  id?: string
  name: string
  clientId: string
  clientSecret: string
  orgId: string
  sandbox: string
  sandboxId: string
  authToken: string
  isActive: boolean
  createdAt: number
  updatedAt: number
}

const DB_NAME = "AEPConfigDB"
const STORE_NAME = "configurations"
const DB_VERSION = 1

let dbInstance: IDBDatabase | null = null

// Initialize IndexedDB
export async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return dbInstance
  }

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: false })
        objectStore.createIndex("name", "name", { unique: false })
        objectStore.createIndex("isActive", "isActive", { unique: false })
        objectStore.createIndex("createdAt", "createdAt", { unique: false })
      }
    }
  })
}

// Generate a unique ID for configurations
function generateId(): string {
  return `config_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Save or update a configuration
export async function saveConfig(config: Omit<AEPConfig, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const db = await initDB()
  const id = config.id || generateId()
  const now = Date.now()

  // If setting as active, deactivate all other configs
  if (config.isActive) {
    const allConfigs = await getConfigs()
    for (const existingConfig of allConfigs) {
      if (existingConfig.id !== id && existingConfig.isActive) {
        await saveConfig({ ...existingConfig, isActive: false })
      }
    }
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)

    // Check if config exists
    const getRequest = store.get(id)

    getRequest.onsuccess = () => {
      const existingConfig = getRequest.result

      const configToSave: AEPConfig = {
        ...config,
        id,
        createdAt: existingConfig?.createdAt || now,
        updatedAt: now,
      }

      const putRequest = store.put(configToSave)
      putRequest.onsuccess = () => resolve(id)
      putRequest.onerror = () => reject(putRequest.error)
    }

    getRequest.onerror = () => reject(getRequest.error)
  })
}

// Get all configurations
export async function getConfigs(): Promise<AEPConfig[]> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onsuccess = () => {
      const configs = request.result as AEPConfig[]
      // Sort by creation date, newest first
      configs.sort((a, b) => b.createdAt - a.createdAt)
      resolve(configs)
    }
    request.onerror = () => reject(request.error)
  })
}

// Get a specific configuration by ID
export async function getConfig(id: string): Promise<AEPConfig | null> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

// Delete a configuration
export async function deleteConfig(id: string): Promise<void> {
  const db = await initDB()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite")
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
  })
}

// Get the currently active configuration
export async function getActiveConfig(): Promise<AEPConfig | null> {
  const configs = await getConfigs()
  return configs.find((config) => config.isActive) || null
}

// Set a configuration as active (deactivates all others)
export async function setActiveConfig(id: string): Promise<void> {
  const config = await getConfig(id)
  if (!config) {
    throw new Error("Configuration not found")
  }

  // Save with isActive = true (which will deactivate others via saveConfig)
  await saveConfig({ ...config, isActive: true })
}
