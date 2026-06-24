const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://localhost:9200' });

async function run() {
  try {
    const queryBody = {
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: 'perfume',
                fields: ['title^3', 'category_name^2', 'brand^2', 'search_keywords^2', 'tags', 'description'],
                fuzziness: 'AUTO'
              }
            }
          ],
          filter: []
        }
      },
      sort: [{ _score: { order: 'desc' } }],
      from: 0,
      size: 12
    };

    console.log("BODY:", JSON.stringify(queryBody, null, 2));

    const response = await client.search({
      index: 'products',
      body: queryBody
    });
    console.log("RESPONSE KEYS:", Object.keys(response));
    console.log("HITS TOTAL:", response.hits.total);
    console.log("HITS LENGTH:", response.hits.hits.length);
  } catch (err) {
    console.error(err);
  }
}
run();
