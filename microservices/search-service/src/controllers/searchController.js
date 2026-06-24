const { esClient: client } = require('../config/elasticsearch');

exports.searchProducts = async (req, res) => {
    try {
        const { q, category, brand, min_price, max_price, min_rating, sort, page = 1, limit = 12 } = req.query;

        const must = [];
        const filter = [];

        // 1. Full-text search with typo tolerance and multi-match
        if (q) {
            must.push({
                multi_match: {
                    query: q,
                    fields: ['title^3', 'category_name^2', 'brand^2', 'search_keywords^2', 'tags', 'description'],
                    fuzziness: 'AUTO'
                }
            });
        } else {
            must.push({ match_all: {} });
        }

        // 2. Filters
        if (category && category.toLowerCase() !== 'all' && category.toLowerCase() !== 'trending') {
            filter.push({ term: { 'category_name.keyword': category } });
        }
        if (brand) {
            filter.push({ term: { 'brand.keyword': brand } });
        }
        
        // Price Range
        if (min_price || max_price) {
            const priceFilter = { range: { final_price: {} } };
            if (min_price) priceFilter.range.final_price.gte = parseFloat(min_price);
            if (max_price) priceFilter.range.final_price.lte = parseFloat(max_price);
            filter.push(priceFilter);
        }

        // Rating
        if (min_rating) {
            filter.push({ range: { average_rating: { gte: parseFloat(min_rating) } } });
        }

        // 3. Sorting
        let sortBody = [];
        if (sort === 'price_asc') sortBody.push({ final_price: { order: 'asc' } });
        else if (sort === 'price_desc') sortBody.push({ final_price: { order: 'desc' } });
        else if (sort === 'rating_desc') sortBody.push({ average_rating: { order: 'desc' } });
        else if (sort === 'name_asc') sortBody.push({ 'title.keyword': { order: 'asc' } });
        else sortBody.push({ _score: { order: 'desc' } }); // Default popularity/relevance

        // 4. Pagination
        const from = (parseInt(page) - 1) * parseInt(limit);
        const size = parseInt(limit);

        const queryBody = {
            query: {
                bool: { must, filter }
            },
            sort: sortBody,
            from,
            size
        };
        console.log("ES QUERY BODY:", JSON.stringify(queryBody, null, 2));

        // Execute ES Search
        const { hits } = await client.search({
            index: 'products',
            body: queryBody
        });
        
        console.log("ES HITS TOTAL:", hits.total);

        // Map hits back to standard JSON format expected by frontend
        const products = hits.hits.map(hit => ({
            id: hit._id,
            _id: hit._id,
            title: hit._source.title,
            description: hit._source.description,
            brand: hit._source.brand,
            category: hit._source.category_name,
            price: hit._source.final_price,
            base_price: hit._source.final_price, // Simplifying for mockup parity
            average_rating: hit._source.average_rating,
            rating: hit._source.average_rating, // Simplifying for mockup parity
            tags: hit._source.tags,
            status: hit._source.status,
            image: hit._source.images && hit._source.images.length > 0 ? hit._source.images[0] : null,
            images: hit._source.images,
            slug: hit._source.slug
        }));

        res.json({
            success: true,
            products,
            total: hits.total.value,
            totalPages: Math.ceil(hits.total.value / size),
            currentPage: parseInt(page)
        });

    } catch (err) {
        console.error('Elasticsearch query error:', err);
        res.status(500).json({ success: false, error: 'Search Engine Error' });
    }
};
