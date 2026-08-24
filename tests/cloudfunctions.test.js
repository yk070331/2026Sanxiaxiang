const assert = require('assert');
const path = require('path');
const Module = require('module');

function createCloudMock(options = {}) {
  const calls = [];
  const database = {
    command: {
      in(values) {
        return { operator: 'in', values };
      }
    },
    serverDate() {
      return 'SERVER_DATE';
    },
    collection(name) {
      const state = { name, query: null, limit: null, order: null };
      const chain = {
        where(query) {
          state.query = query;
          return chain;
        },
        limit(limit) {
          state.limit = limit;
          return chain;
        },
        orderBy(field, direction) {
          state.order = { field, direction };
          return chain;
        },
        async get() {
          calls.push({ operation: 'get', ...state });
          if (options.get) return options.get(state);
          return { data: [] };
        },
        async add({ data }) {
          calls.push({ operation: 'add', data, ...state });
          if (options.add) return options.add(state, data);
          return { _id: 'created-id' };
        },
        async update({ data }) {
          calls.push({ operation: 'update', data, ...state });
          if (options.update) return options.update(state, data);
          return { stats: { updated: 1 } };
        }
      };
      return chain;
    }
  };

  return {
    DYNAMIC_CURRENT_ENV: 'test-env',
    init() {},
    database() {
      return database;
    },
    getWXContext() {
      return { OPENID: options.openid === undefined ? 'test-openid' : options.openid };
    },
    calls
  };
}

function loadCloudFunction(relativePath, cloudMock) {
  const absolutePath = path.resolve(__dirname, '..', relativePath);
  delete require.cache[absolutePath];
  const originalLoad = Module._load;
  Module._load = function load(request, parent, isMain) {
    if (request === 'wx-server-sdk') return cloudMock;
    return originalLoad.call(this, request, parent, isMain);
  };
  try {
    return require(absolutePath);
  } finally {
    Module._load = originalLoad;
  }
}

async function testVisitorRecords() {
  const existingCloud = createCloudMock({
    get(state) {
      if (state.name === 'checkins') {
        return { data: [{ _id: 'old', placeId: 'site_1' }] };
      }
      return { data: [] };
    }
  });
  const existingService = loadCloudFunction(
    'cloudfunctions/visitorRecords/index.js',
    existingCloud
  );
  const existing = await existingService.main({
    action: 'saveCheckin',
    routeId: 'study_60',
    placeId: 'site_1',
    method: 'scan'
  });
  assert.equal(existing.ok, true);
  assert.equal(existing.data._id, 'old');
  assert.equal(existingCloud.calls.filter(call => call.operation === 'add').length, 0);

  const createCloud = createCloudMock();
  const createService = loadCloudFunction(
    'cloudfunctions/visitorRecords/index.js',
    createCloud
  );
  const invalid = await createService.main({
    action: 'saveCheckin',
    placeId: '../unsafe'
  });
  assert.equal(invalid.code, 'INVALID_PARAMETER');

  const created = await createService.main({
    action: 'saveCheckin',
    routeId: 'study_60',
    placeId: 'site_2',
    method: 'manual'
  });
  assert.equal(created.ok, true);
  assert.equal(createCloud.calls.filter(call => call.operation === 'add').length, 1);

  const shortCorrection = await createService.main({
    action: 'submitCorrection',
    targetType: 'place',
    targetId: 'site_2',
    errorType: '名称错误',
    description: '太短'
  });
  assert.equal(shortCorrection.code, 'INVALID_CONTENT');

  const unauthenticated = loadCloudFunction(
    'cloudfunctions/visitorRecords/index.js',
    createCloudMock({ openid: '' })
  );
  const denied = await unauthenticated.main({ action: 'listMyCheckins' });
  assert.equal(denied.code, 'UNAUTHENTICATED');
}

async function testContentAdmin() {
  const deniedCloud = createCloudMock({
    get() {
      return { data: [] };
    }
  });
  const deniedService = loadCloudFunction(
    'cloudfunctions/contentAdmin/index.js',
    deniedCloud
  );
  const denied = await deniedService.main({
    action: 'saveDraft',
    collection: 'media',
    payload: { title: '测试' }
  });
  assert.equal(denied.code, 'FORBIDDEN');

  const recorderCloud = createCloudMock({
    get(state) {
      if (state.name === 'adminRoles') {
        return { data: [{ role: 'recorder', enabled: true }] };
      }
      return { data: [] };
    }
  });
  const recorderService = loadCloudFunction(
    'cloudfunctions/contentAdmin/index.js',
    recorderCloud
  );
  const invalidCollection = await recorderService.main({
    action: 'saveDraft',
    collection: 'adminRoles',
    payload: { role: 'reviewer' }
  });
  assert.equal(invalidCollection.code, 'INVALID_COLLECTION');

  const draft = await recorderService.main({
    action: 'saveDraft',
    collection: 'media',
    payload: { title: '史料照片', status: 'published', _openid: 'forged' }
  });
  assert.equal(draft.ok, true);
  const added = recorderCloud.calls.find(call => call.operation === 'add');
  assert.equal(added.data.status, 'draft');
  assert.equal(added.data._openid, undefined);

  const queueDenied = await recorderService.main({
    action: 'listReviewQueue',
    collection: 'media'
  });
  assert.equal(queueDenied.code, 'FORBIDDEN');

  const reviewerCloud = createCloudMock({
    get(state) {
      if (state.name === 'adminRoles') {
        return { data: [{ role: 'reviewer', enabled: true }] };
      }
      return { data: [] };
    }
  });
  const reviewerService = loadCloudFunction(
    'cloudfunctions/contentAdmin/index.js',
    reviewerCloud
  );
  const published = await reviewerService.main({
    action: 'review',
    collection: 'media',
    id: 'media_1',
    approved: true,
    reviewNote: '资料来源已核验'
  });
  assert.equal(published.ok, true);
  const updated = reviewerCloud.calls.find(call => call.operation === 'update');
  assert.equal(updated.data.status, 'published');
}

async function testContentService() {
  const cloudMock = createCloudMock({
    get() {
      return { data: [{ _id: 'media_1', status: 'published' }] };
    }
  });
  const service = loadCloudFunction(
    'cloudfunctions/contentService/index.js',
    cloudMock
  );
  const invalid = await service.main({
    action: 'listPublished',
    collection: 'adminRoles'
  });
  assert.equal(invalid.code, 'INVALID_COLLECTION');

  const listed = await service.main({
    action: 'listPublished',
    collection: 'media'
  });
  assert.equal(listed.ok, true);
  assert.equal(listed.data.length, 1);
}

async function run() {
  await testVisitorRecords();
  await testContentAdmin();
  await testContentService();
  console.log('cloudfunctions.test.js: all tests passed');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

