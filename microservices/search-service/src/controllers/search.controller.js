const { esClient } = require('../config/elasticsearch');

exports.searchCatalog = async (req, res, next) => {
    try {
        const { q, category, brand, minPrice, maxPrice, page = 1, limit = 10 } = req.query;

        // Build Elasticsearch query
        const searchParams = {
            index: 'products',
            query: q,
            filters: {}
        };

        if (category) searchParams.filters.category = category;
        if (brand) searchParams.filters.brand = brand;
        if (minPrice) searchParams.filters.minPrice = minPrice;
        if (maxPrice) searchParams.filters.maxPrice = maxPrice;

        const result = await esClient.search(searchParams);

        // Pagination
        const from = (parseInt(page) - 1) * parseInt(limit);
        const paginatedHits = result.hits.hits.slice(from, from + parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                total: result.hits.total.value,
                page: parseInt(page),
                limit: parseInt(limit),
                products: paginatedHits.map(hit => hit._source),
                facets: result.aggregations // For frontend filters (Brands/Categories counts)
            }
        });

    } catch (error) {
        console.error('[Search Service] Search failed:', error);
        res.status(500).json({ success: false, message: 'Search engine error' });
    }
};
