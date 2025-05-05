import Redis from 'ioredis';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = {};
    this.useFallback = process.env.REDIS_USE_FALLBACK !== 'false'; // Enable fallback by default
    this.reconnectTimer = null;
    this.init();
  }

  init() {
    try {
      // For Kubernetes, we use environment variables to configure Redis
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || null,
        connectTimeout: 5000,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        retryStrategy(times) {
          // Exponential backoff with max delay of 5s
          const delay = Math.min(Math.exp(times) * 100, 5000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected successfully');
        
        // Clear any reconnection timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        console.error('Redis connection error:', err.message);
        
        // If we're in Kubernetes, don't set up our own reconnection timer
        // as the Redis client and Kubernetes will handle it
        if (!process.env.KUBERNETES_SERVICE_HOST && !this.reconnectTimer) {
          this.reconnectTimer = setTimeout(() => {
            console.log('Manually attempting Redis reconnection...');
            this.reconnectTimer = null;
            this.init();
          }, 10000); // Try reconnecting after 10 seconds
        }
      });

      this.client.on('reconnecting', () => {
        this.isConnected = false;
        console.log('Redis reconnecting...');
      });

      this.client.on('end', () => {
        this.isConnected = false;
        console.log('Redis connection closed');
      });
    } catch (err) {
      this.isConnected = false;
      console.error('Redis initialization error:', err.message);
    }
  }

  async get(key) {
    if (this.isConnected && this.client) {
      try {
        const value = await this.client.get(key);
        if (value) {
          return value;
        }
      } catch (error) {
        console.error(`Redis get error for key ${key}:`, error.message);
      }
    }
    
    if (this.useFallback) {
      return this.memoryCache[key] || null;
    }
    
    return null;
  }

  async set(key, value, expireTime = null) {
    if (this.useFallback) {
      this.memoryCache[key] = value;
    }
    
    if (!this.isConnected || !this.client) {
      if (this.useFallback) {
        return true;
      }
      return false;
    }
    
    try {
      if (expireTime) {
        await this.client.set(key, value, 'EX', expireTime);
      } else {
        await this.client.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`Redis set error for key ${key}:`, error.message);
      return this.useFallback; 
    }
  }

  async getJson(key) {
    const value = await this.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  }

  async setJson(key, value, expireTime = null) {
    try {
      const jsonValue = JSON.stringify(value);
      return await this.set(key, jsonValue, expireTime);
    } catch (error) {
      return false;
    }
  }

  async delete(key) {
    if (this.useFallback) {
      delete this.memoryCache[key];
    }
    
    if (!this.isConnected || !this.client) {
      if (this.useFallback) {
        return true;
      }
      return false;
    }
    
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error.message);
      return this.useFallback; 
    }
  }

  async ping() {
    if (!this.client) return false;
    
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }

  toggleFallback(enable) {
    this.useFallback = enable;
    console.log(`Memory fallback ${enable ? 'enabled' : 'disabled'}`);
  }

  async quit() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        return true;
      } catch (error) {
        console.error('Error while quitting Redis client:', error);
        return false;
      }
    }
    return true;
  }
}

export default new RedisClient();
