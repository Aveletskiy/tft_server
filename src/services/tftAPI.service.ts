let instance = null;

export class TftApiService {
    private request;
    private url;
    private headers;

    constructor() {
        if (!instance) {
            this.request = require('request');
            this.url = 'http://localhost:23110/';
            this.headers = {
                'User-Agent': 'Rivine-Agent'
            }

            instance = this;
        }

        return instance;
    }

    private sendRequest = async (path) => {
        return new Promise((resolve, reject) => {
            this.request({
                method: 'GET',
                url: this.url + path,
                headers: this.headers
            }, (error, response, body) => {
                if (error) {
                    console.log(error)
                    reject(Error(error));
                } else {
                    resolve(JSON.parse(body));
                };
            });
        });
    }

    public getLastBlock = async () => {
        const result = await this.sendRequest('');
    }

    public getConsensus = async () => {
        return await this.sendRequest('consensus')
    }

    public getMainInfo = async () => {
        return await this.sendRequest('explorer')
    }

    public getBlockById = async (id: number) => {
        return await this.sendRequest(`explorer/blocks/${id}`) as any;
    }

    public findByHash = async (hash: string) => {
        return await this.sendRequest(`explorer/hashes/${hash}`);
    }

    public getLastBlocks = async(count: number) => {
        const start = await this.getMainInfo() as any;
        const result = []

        let currentHeight = start.height;

        if (!start || !currentHeight) {
            return null;
        }
    
        for (let i =1; i<=5; i++) {
            const block = (await this.getBlockById(currentHeight) as any).block;

            result.push({
                id: block.blockid,
                parentId: block.rawblock.parentid,
                height: block.height,
                difficulty: block.difficulty,
                timeStamp: block.rawblock.timestamp,
                transactionsCount: block.transactions.length,
                activeBlockStake: block.estimatedactivebs
            })

            currentHeight--;
        }
    
        return result;
    }

    public getPeers = async () => {
        return await this.sendRequest(`gateway`);
    }

    public getCurrentInfo = async () => {
        const current = await this.getMainInfo() as any;
        return (await this.getBlockById(current.height)).block;
    }
    
}