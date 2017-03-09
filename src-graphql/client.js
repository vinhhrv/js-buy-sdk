import GraphQLJSClient, {_enum} from '@shopify/graphql-js-client';
import types from '../types';
import base64Encode from './base64encode';
import './isomorphic-fetch';
import productQuery from './product-query';
import productConnectionQuery from './product-connection-query';
import collectionQuery from './collection-query';
import collectionConnectionQuery from './collection-connection-query';

function fetchAllPages(paginatedModels, client) {
  return client.fetchNextPage(paginatedModels).then(({model}) => {
    paginatedModels.push(...model);

    if (!model[model.length - 1].hasNextPage.valueOf()) {
      return paginatedModels;
    }

    return fetchAllPages(paginatedModels, client);
  });
}

function fetchAllProductResources(product, client) {
  const promises = [];
  const images = product.images;
  const variants = product.variants;

  if (images && images[images.length - 1].hasNextPage.valueOf()) {
    promises.push(fetchAllPages(product.images, client));
  }

  if (variants && variants[variants.length - 1].hasNextPage.valueOf()) {
    promises.push(fetchAllPages(product.variants, client));
  }

  return promises;
}

export default class Client {
  constructor(config, GraphQLClientClass = GraphQLJSClient) {
    const apiUrl = `https://${config.domain}/api/graphql`;
    const authHeader = `Basic ${base64Encode(config.storefrontAccessToken)}`;

    this.graphQLClient = new GraphQLClientClass(types, {
      url: apiUrl,
      fetcherOptions: {
        headers: {
          Authorization: authHeader
        }
      }
    });
  }

  fetchAllProducts(query = productConnectionQuery()) {
    return this.graphQLClient.send(query(this.graphQLClient)).then(({model}) => {
      const promises = model.shop.products.reduce((promiseAcc, product) => {
        // Fetch the rest of the images and variants for this product
        return promiseAcc.concat(fetchAllProductResources(product, this.graphQLClient));
      }, []);

      return Promise.all(promises).then(() => {
        return model.shop.products;
      });
    });
  }

  fetchProduct(id, query = productQuery()) {
    return this.graphQLClient.send(query(this.graphQLClient, id)).then(({model}) => {
      // Fetch the rest of the images and variants for this product
      const promises = fetchAllProductResources(model.node, this.graphQLClient);

      return Promise.all(promises).then(() => {
        return model.node;
      });
    });
  }

  fetchAllCollections(query = collectionConnectionQuery()) {
    return this.graphQLClient.send(query(this.graphQLClient)).then((response) => {
      return response.model.shop.collections;
    });
  }

  fetchCollection(id, query = collectionQuery()) {
    return this.graphQLClient.send(query(this.graphQLClient, id)).then((response) => {
      return response.model.node;
    });
  }

  fetchQueryProducts(queryObject = {}, query = productConnectionQuery()) {
    const queryArgStrings = [];
    const options = {};

    if (queryObject.title) {
      queryArgStrings.push(`title:'${queryObject.title}'`);
    }
    if (queryObject.updatedAtMin) {
      queryArgStrings.push(`updated_at:>='${queryObject.updatedAtMin}'`);
    }
    if (queryObject.createdAtMin) {
      queryArgStrings.push(`created_at:>='${queryObject.createdAtMin}'`);
    }
    if (queryObject.productType) {
      queryArgStrings.push(`product_type:'${queryObject.productType}'`);
    }
    if (queryObject.limit) {
      options.first = queryObject.limit;
    }
    if (queryObject.sortBy) {
      let sortKey;

      switch (queryObject.sortBy) {
        case 'title-ascending':
          sortKey = _enum('TITLE');
          break;
        case 'title-descending':
          sortKey = _enum('TITLE');
          options.reverse = true;
          break;
        case 'updated-ascending':
          sortKey = _enum('UPDATED_AT');
          break;
        case 'updated-descending':
          sortKey = _enum('UPDATED_AT');
          options.reverse = true;
          break;
        case 'created-ascending':
          sortKey = _enum('CREATED_AT');
          break;
        case 'created-descending':
          sortKey = _enum('CREATED_AT');
          options.reverse = true;
          break;
      }

      options.sortKey = sortKey;
    }
    if (queryObject.limit) {
      options.first = queryObject.limit;
    }

    options.query = queryArgStrings.join(' ');

    return this.graphQLClient.send(query(this.graphQLClient, options)).then(({model, data}) => {
      const promises = model.shop.products.reduce((promiseAcc, product, i) => {
        const productData = data.shop.products.edges[i].node;

        // Fetch the rest of the images and variants for this product
        return promiseAcc.concat(fetchAllProductResources(productData, product, this.graphQLClient));
      }, []);

      return Promise.all(promises).then(() => {
        return model.shop.products;
      });
    });
  }

  fetchQueryCollections(queryObject = {}, query = collectionConnectionQuery()) {
    const queryArgStrings = [];
    const options = {};

    if (queryObject.title) {
      queryArgStrings.push(`title:'${queryObject.title}'`);
    }
    if (queryObject.updatedAtMin) {
      queryArgStrings.push(`updated_at:>='${queryObject.updatedAtMin}'`);
    }
    if (queryObject.sortBy) {
      let sortKey;

      switch (queryObject.sortBy) {
        case 'title-ascending':
          sortKey = _enum('TITLE');
          break;
        case 'title-descending':
          sortKey = _enum('TITLE');
          options.reverse = true;
          break;
        case 'updated-ascending':
          sortKey = _enum('UPDATED_AT');
          break;
        case 'updated-descending':
          sortKey = _enum('UPDATED_AT');
          options.reverse = true;
          break;
      }

      options.sortKey = sortKey;
    }
    if (queryObject.limit) {
      options.first = queryObject.limit;
    }

    options.query = queryArgStrings.join(' ');

    return this.graphQLClient.send(query(this.graphQLClient, options)).then((response) => {
      return response.model.shop.collections;
    });
  }
}
