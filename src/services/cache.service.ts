import * as redis from 'redis';

let instance = null;

export class CacheService {
    private client;

    constructor() {
        if (!instance) {
            this.client = redis.createClient()

            instance = this;
        }

        return instance;
    }

    setField = async (key, value, expire = 43200) => {
        this.client.set(`${process.env.NODE_ENV}_${key}`, JSON.stringify(value), 'EX', expire);
    }

    delField = async (key) => {
        return await new Promise((resolve) => {
            this.client.del(`${process.env.NODE_ENV}_${key}`, (err, result) => {
                resolve(result);
            });
        });
    }

    getField = async (key) => {
        return await new Promise((resolve) => {
            this.client.get(`${process.env.NODE_ENV}_${key}`, (err, result) => {
                const originalResult = result;

                if (!result) {
                    return resolve(originalResult);
                }

                try {
                    if (typeof result === 'string') {
                        result = JSON.parse(result);
                        resolve(result);
                    }
                } catch (e) {
                    resolve(originalResult);
                }
            });
        });
    }
}