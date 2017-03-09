import assert from 'assert';
import Client from '../src/client';
import Config from '../src/config';
import productConnectionQuery from '../src/product-connection-query';
import collectionConnectionQuery from '../src/collection-connection-query';
import variantConnectionQuery from '../src/variant-connection-query';
import optionQuery from '../src/option-query';
import imageQuery from '../src/image-query';
import imageConnectionQuery from '../src/image-connection-query';

suite('query-test', () => {
  const querySplitter = /[\s,]+/;

  function tokens(query) {
    return query.split(querySplitter).filter((token) => Boolean(token));
  }

  const config = new Config({
    domain: 'sendmecats.myshopify.com',
    storefrontAccessToken: 'abc123'
  });

  const client = new Client(config);

  test('it creates product queries with defaults', () => {
    const query = productConnectionQuery();
    const queryString = `query {
      shop {
        products (first: 20) {
          pageInfo {
            hasNextPage,
            hasPreviousPage
          },
          edges {
            cursor,
            node {
              id,
              createdAt,
              updatedAt,
              descriptionHtml,
              descriptionPlainSummary,
              handle,
              productType,
              title,
              vendor,
              tags,
              publishedAt,
              options {
                id,
                name,
                values
              },
              images (first: 250) {
                pageInfo {
                  hasNextPage,
                  hasPreviousPage
                },
                edges {
                  cursor,
                  node {
                    id,
                    src,
                    altText
                  }
                }
              },
              variants (first: 250) {
                pageInfo {
                  hasNextPage,
                  hasPreviousPage
                },
                edges {
                  cursor,
                  node {
                    id,
                    title,
                    price,
                    weight,
                    selectedOptions {
                      name,
                      value
                    }
                  }
                }
              }
            }
          }
        }
      }
    }`;

    assert.deepEqual(tokens(query(client.graphQLClient).toString()), tokens(queryString));
  });

  test('it creates product queries with specified fields', () => {
    const query = productConnectionQuery(['id', 'tags', 'vendor', ['images', imageConnectionQuery(['src'])], ['options', optionQuery(['name'])], ['variants', variantConnectionQuery(['id', 'title'])]]);
    const queryString = `query {
      shop {
        products (first: 20) {
          pageInfo {
            hasNextPage,
            hasPreviousPage
          },
          edges {
            cursor,
            node {
              id,
              tags,
              vendor,
              images (first: 250) {
                pageInfo {
                  hasNextPage,
                  hasPreviousPage
                },
                edges {
                  cursor,
                  node {
                    src
                  }
                }
              },
              options {
                id,
                name
              },
              variants (first: 250) {
                pageInfo {
                  hasNextPage,
                  hasPreviousPage
                },
                edges {
                  cursor,
                  node {
                    id,
                    title
                  }
                }
              }
            }
          }
        }
      }
    }`;

    assert.deepEqual(tokens(query(client.graphQLClient).toString()), tokens(queryString));
  });

  test('it creates collection queries with defaults', () => {
    const query = collectionConnectionQuery();
    const queryString = `query {
      shop {
        collections (first: 20) {
          pageInfo {
            hasNextPage,
            hasPreviousPage
          },
          edges {
            cursor,
            node {
              id,
              handle,
              updatedAt,
              title,
              image {
                id,
                src,
                altText
              }
            }
          }
        }
      }
    }`;

    assert.deepEqual(tokens(query(client.graphQLClient).toString()), tokens(queryString));
  });

  test('it creates collection queries with specified fields', () => {
    const query = collectionConnectionQuery(['handle', 'updatedAt', 'title', ['image', imageQuery(['id'])]]);
    const queryString = `query {
      shop {
        collections (first: 20) {
          pageInfo {
            hasNextPage,
            hasPreviousPage
          },
          edges {
            cursor,
            node {
              id,
              handle,
              updatedAt,
              title,
              image {
                id
              }
            }
          }
        }
      }
    }`;

    assert.deepEqual(tokens(query(client.graphQLClient).toString()), tokens(queryString));
  });
});
