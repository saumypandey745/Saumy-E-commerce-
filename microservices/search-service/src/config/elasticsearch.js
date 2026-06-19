const Fuse = require('fuse.js');

/**
 * MOCK ELASTICSEARCH CLIENT
 * For Phase 6, we implement an Elasticsearch-compatible interface that utilizes 
 * Fuse.js in-memory to provide fuzzy search without needing a heavy Java container.
 */

class MockElasticClient {
    constructor() {
        this.indices = {
            products: new Map() // product_id -> document
        };
        
        this.fuseOptions = {
            includeScore: true,
            keys: [
                { name: 'title', weight: 0.7 },
                { name: 'description', weight: 0.3 }
            ],
            threshold: 0.4
        };
    }

    async index(params) {
        const { index, id, document } = params;
        if (!this.indices[index]) this.indices[index] = new Map();
        this.indices[index].set(id.toString(), { id, ...document });
        return { result: 'created' };
    }

    async update(params) {
        const { index, id, doc } = params;
        if (!this.indices[index] || !this.indices[index].has(id.toString())) {
            return this.index({ index, id, document: doc });
        }
        const existing = this.indices[index].get(id.toString());
        this.indices[index].set(id.toString(), { ...existing, ...doc });
        return { result: 'updated' };
    }

    async delete(params) {
        const { index, id } = params;
        if (this.indices[index]) {
            this.indices[index].delete(id.toString());
        }
        return { result: 'deleted' };
    }

    async search(params) {
        const { index, query, filters = {} } = params;
        let docs = Array.from(this.indices[index]?.values() || []);

        // 1. Text Search (Fuzzy)
        if (query && query.trim() !== '') {
            const fuse = new Fuse(docs, this.fuseOptions);
            const results = fuse.search(query);
            docs = results.map(r => r.item);
        }

        // 2. Exact Filters (Term Level Query)
        if (filters.category) {
            docs = docs.filter(d => d.category === filters.category);
        }
        if (filters.brand) {
            docs = docs.filter(d => d.brand === filters.brand);
        }
        if (filters.minPrice !== undefined) {
            docs = docs.filter(d => d.base_price >= parseFloat(filters.minPrice));
        }
        if (filters.maxPrice !== undefined) {
            docs = docs.filter(d => d.base_price <= parseFloat(filters.maxPrice));
        }

        // 3. Mock Aggregations (Facets)
        const aggregations = {
            categories: {},
            brands: {}
        };
        docs.forEach(d => {
            if (d.category) {
                aggregations.categories[d.category] = (aggregations.categories[d.category] || 0) + 1;
            }
            if (d.brand) {
                aggregations.brands[d.brand] = (aggregations.brands[d.brand] || 0) + 1;
            }
        });

        return {
            hits: {
                total: { value: docs.length },
                hits: docs.map(d => ({ _source: d }))
            },
            aggregations
        };
    }
}

const esClient = new MockElasticClient();

module.exports = { esClient };
