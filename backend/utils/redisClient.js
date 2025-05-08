import Redis from 'ioredis';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = {};
    this.useFallback = process.env.REDIS_USE_FALLBACK !== 'false'; // Enable fallback by default
    this.init();
  }

  init() {
    try {
      this.client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        connectTimeout: 5000,
        maxRetriesPerRequest: 2,
        retryStrategy(times) {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        console.error('Redis connection error:', err.message);
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

  async ttl(key) {
    if (!this.isConnected || !this.client) {
      return -1; // Return -1 if Redis is not connected
    }
    
    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis TTL error for key ${key}:`, error.message);
      return -1;
    }
  }

  async incr(key) {
    if (!this.isConnected || !this.client) {
      if (this.useFallback) {
        // Handle increment in memory
        const currentVal = parseInt(this.memoryCache[key]) || 0;
        this.memoryCache[key] = (currentVal + 1).toString();
        return currentVal + 1;
      }
      return 0;
    }
    
    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Redis incr error for key ${key}:`, error.message);
      if (this.useFallback) {
        // Fallback to memory increment
        const currentVal = parseInt(this.memoryCache[key]) || 0;
        this.memoryCache[key] = (currentVal + 1).toString();
        return currentVal + 1;
      }
      return 0;
    }
  }
}

export default new RedisClient();
