const { esClient } = require('../config/elasticsearch');

exports.searchCatalog = async (req, res, next) => {
    try {
        const { q, category, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

        // Build Elasticsearch DSL query
        const body = {
            query: {
                bool: {
                    must: [],
                    filter: []
                }
            },
            aggs: {
                categories: { terms: { field: "category.keyword" } },
                brands: { terms: { field: "brand.keyword" } }
            }
        };

        // Typo-tolerant search
        if (q) {
            body.query.bool.must.push({
                multi_match: {
                    query: q,
                    fields: ["title^3", "description", "category", "brand"],
                    fuzziness: "AUTO"
                }
            });
        } else {
            body.query.bool.must.push({ match_all: {} });
        }

        // Filters
        if (category) body.query.bool.filter.push({ term: { "category.keyword": category } });
        if (brand) body.query.bool.filter.push({ term: { "brand.keyword": brand } });
        
        if (minPrice || maxPrice) {
            const priceFilter = { range: { base_price: {} } };
            if (minPrice) priceFilter.range.base_price.gte = parseFloat(minPrice);
            if (maxPrice) priceFilter.range.base_price.lte = parseFloat(maxPrice);
            body.query.bool.filter.push(priceFilter);
        }

        const from = (parseInt(page) - 1) * parseInt(limit);

        const result = await esClient.search({
            index: 'products',
            from,
            size: parseInt(limit),
            body
        });

        res.status(200).json({
            success: true,
            data: {
                total: result.hits.total.value,
                page: parseInt(page),
                limit: parseInt(limit),
                products: result.hits.hits.map(hit => hit._source),
                facets: result.aggregations
            }
        });

    } catch (error) {
        console.error('[Search Service] Search failed:', error);
        res.status(500).json({ success: false, message: 'Search engine error' });
    }
};
