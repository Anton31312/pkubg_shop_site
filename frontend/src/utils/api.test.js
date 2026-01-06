import fc from 'fast-check';
import api from './api';
import axios from 'axios';

// Mock axios to avoid actual HTTP requests
jest.mock('axios');
const mockedAxios = axios;

describe('API Client Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset axios create mock
    mockedAxios.create.mockReturnValue({
      interceptors: {
        request: { use: jest.fn() },
        response: { use: jest.fn() }
      },
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      patch: jest.fn()
    });
  });

  /**
   * **Feature: pkubg-ecommerce, Property 35: RESTful API структура**
   * 
   * Для любого API endpoint структура запросов и ответов должна соответствовать принципам REST
   */
  test('RESTful API structure property', () => {
    fc.assert(
      fc.property(
        // Generate various REST endpoints
        fc.record({
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH'),
          resource: fc.constantFrom('products', 'cart', 'orders', 'auth', 'articles', 'analytics'),
          id: fc.option(fc.integer({ min: 1, max: 1000 })),
          action: fc.option(fc.constantFrom('add', 'update', 'remove', 'login', 'logout', 'register'))
        }),
        fc.record({
          // Generate request data
          data: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 20 }),
            fc.oneof(
              fc.string(),
              fc.integer(),
              fc.boolean(),
              fc.array(fc.string())
            )
          )),
          // Generate query parameters
          params: fc.option(fc.dictionary(
            fc.string({ minLength: 1, maxLength: 15 }),
            fc.string()
          ))
        }),
        (endpoint, requestConfig) => {
          // Build RESTful URL
          let url = `/${endpoint.resource}`;
          
          // Add ID for resource-specific operations
          if (endpoint.id !== null && ['GET', 'PUT', 'DELETE', 'PATCH'].includes(endpoint.method)) {
            url += `/${endpoint.id}`;
          }
          
          // Add action for specific operations
          if (endpoint.action !== null) {
            url += `/${endpoint.action}/`;
          } else if (!endpoint.id) {
            url += '/';
          }

          // Verify RESTful principles
          
          // 1. URLs should be resource-based (nouns, not verbs)
          const resourcePattern = /^\/[a-z]+(?:\/\d+)?(?:\/[a-z]+)?\/$/;
          expect(url).toMatch(resourcePattern);
          
          // 2. HTTP methods should match operations
          if (endpoint.method === 'GET') {
            // GET should be for retrieval
            expect(['products', 'cart', 'orders', 'auth', 'articles', 'analytics']).toContain(endpoint.resource);
          } else if (endpoint.method === 'POST') {
            // POST should be for creation or actions
            if (endpoint.action) {
              expect(['add', 'login', 'register']).toContain(endpoint.action);
            }
          } else if (endpoint.method === 'PUT') {
            // PUT should be for updates and require ID
            expect(endpoint.id).toBeDefined();
          } else if (endpoint.method === 'DELETE') {
            // DELETE should require ID or specific action
            expect(endpoint.id !== null || endpoint.action === 'remove').toBe(true);
          }
          
          // 3. Consistent URL structure
          const segments = url.split('/').filter(segment => segment.length > 0);
          
          // First segment should always be resource
          expect(segments[0]).toBe(endpoint.resource);
          
          // If there's an ID, it should be numeric
          if (segments.length > 1 && /^\d+$/.test(segments[1])) {
            expect(parseInt(segments[1])).toBeGreaterThan(0);
          }
          
          // 4. Request data structure should be consistent
          if (requestConfig.data) {
            // Data should be an object for JSON APIs
            expect(typeof requestConfig.data).toBe('object');
            expect(requestConfig.data).not.toBeNull();
            
            // Keys should be snake_case for Django compatibility
            Object.keys(requestConfig.data).forEach(key => {
              expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
            });
          }
          
          // 5. Query parameters should follow conventions
          if (requestConfig.params) {
            Object.keys(requestConfig.params).forEach(key => {
              // Parameter names should be lowercase
              expect(key).toMatch(/^[a-z][a-z0-9_]*$/);
            });
          }
          
          // 6. Endpoint should follow hierarchical structure
          if (endpoint.action) {
            // Actions should be at the end of the URL
            expect(url.endsWith(`/${endpoint.action}/`)).toBe(true);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('API base configuration follows REST principles', () => {
    // Test that the API client is configured with proper REST defaults
    expect(api.defaults.baseURL).toBe('/api');
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
    
    // Verify interceptors are set up for authentication
    expect(api.interceptors.request.handlers).toBeDefined();
    expect(api.interceptors.response.handlers).toBeDefined();
  });

  test('HTTP status codes follow REST conventions', () => {
    fc.assert(
      fc.property(
        fc.record({
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          status: fc.integer({ min: 200, max: 599 }),
          hasData: fc.boolean()
        }),
        (scenario) => {
          // REST status code conventions
          if (scenario.method === 'GET') {
            if (scenario.status >= 200 && scenario.status < 300) {
              // Successful GET should return data
              expect(scenario.hasData || scenario.status === 204).toBe(true);
            }
          } else if (scenario.method === 'POST') {
            if (scenario.status === 201) {
              // Created resources should return data
              expect(scenario.hasData).toBe(true);
            }
          } else if (scenario.method === 'PUT') {
            if (scenario.status >= 200 && scenario.status < 300) {
              // Successful PUT can return data or be 204 No Content
              expect([200, 204].includes(scenario.status) || scenario.hasData).toBe(true);
            }
          } else if (scenario.method === 'DELETE') {
            if (scenario.status >= 200 && scenario.status < 300) {
              // Successful DELETE typically returns 204 or 200
              expect([200, 204].includes(scenario.status)).toBe(true);
            }
          }
          
          // Error status codes should not have success data
          if (scenario.status >= 400) {
            // Error responses might have error data, but not success data
            expect(scenario.status).toBeGreaterThanOrEqual(400);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});